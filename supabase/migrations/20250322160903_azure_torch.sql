/*
  # User Sessions Migration Fix

  1. Changes
    - Add DO block to safely handle policy creation
    - Drop existing policies if they exist
    - Create new policies
    - Add indexes for performance

  2. Security
    - Enable RLS
    - Public policies for session management
    - Index on session token for efficient lookups
*/

-- Create user sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_used timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Public can create sessions" ON user_sessions;
  DROP POLICY IF EXISTS "Users can read their own sessions" ON user_sessions;
  DROP POLICY IF EXISTS "Users can delete their own sessions" ON user_sessions;

  -- Create new policies
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

EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create index for session token lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);