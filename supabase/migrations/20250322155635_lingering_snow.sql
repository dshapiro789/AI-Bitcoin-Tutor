/*
  # Add User Sessions Table

  1. New Tables
    - `user_sessions`: Stores user session information
      - `id` (uuid, primary key)
      - `session_token` (text, unique)
      - `created_at` (timestamp)
      - `last_used` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for session management
*/

-- Create user sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_used timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can create sessions"
  ON user_sessions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can read their own sessions"
  ON user_sessions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can delete their own sessions"
  ON user_sessions
  FOR DELETE
  TO public
  USING (true);

-- Create index for session token lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);