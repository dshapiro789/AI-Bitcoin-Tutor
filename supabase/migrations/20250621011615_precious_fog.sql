/*
  # Create Chat Sessions and Update Chat History

  1. New Tables
    - `chat_sessions`: Store metadata for each distinct chat conversation
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text, default 'New Chat')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `last_message_preview` (text)
      - `message_count` (integer, default 0)

  2. Changes to Existing Tables
    - Add `session_id` column to `chat_history` table
    - Update RLS policies for session-based access

  3. Security
    - Enable RLS on chat_sessions table
    - Add policies for session management
    - Update chat_history policies to use session_id
*/

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT 'New Chat',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_message_preview text DEFAULT '',
  message_count integer DEFAULT 0
);

-- Add session_id to chat_history table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_history' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE chat_history ADD COLUMN session_id uuid;
  END IF;
END $$;

-- Enable RLS for chat_sessions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for chat_sessions
CREATE POLICY "Users can view own chat sessions"
  ON chat_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions"
  ON chat_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
  ON chat_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions"
  ON chat_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for chat_sessions
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at);

-- Update chat_history policies to use session_id
DROP POLICY IF EXISTS "Users can view own chat history" ON chat_history;
CREATE POLICY "Users can view own chat history"
  ON chat_history
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM chat_sessions 
    WHERE chat_sessions.id = chat_history.session_id 
    AND chat_sessions.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert own chat history" ON chat_history;
CREATE POLICY "Users can insert own chat history"
  ON chat_history
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM chat_sessions 
    WHERE chat_sessions.id = chat_history.session_id 
    AND chat_sessions.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update own chat history" ON chat_history;
CREATE POLICY "Users can update own chat history"
  ON chat_history
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM chat_sessions 
    WHERE chat_sessions.id = chat_history.session_id 
    AND chat_sessions.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete own chat history" ON chat_history;
CREATE POLICY "Users can delete own chat history"
  ON chat_history
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM chat_sessions 
    WHERE chat_sessions.id = chat_history.session_id 
    AND chat_sessions.user_id = auth.uid()
  ));

-- Add foreign key constraint for session_id (after ensuring data integrity)
-- Note: This will be added after data migration for existing records
-- ALTER TABLE chat_history ADD CONSTRAINT fk_session_id 
-- FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE;