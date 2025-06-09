/*
  # Add User Model Settings Table

  1. New Tables
    - `user_model_settings`: Stores user-specific AI model configurations
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `model_id` (text)
      - `name` (text)
      - `provider` (text)
      - `api_key` (text)
      - `active` (boolean)
      - `context_length` (integer)
      - `temperature` (float)
      - `max_tokens` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Create indexes for performance
*/

-- Create user model settings table
CREATE TABLE IF NOT EXISTS user_model_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  model_id text NOT NULL,
  name text NOT NULL,
  provider text NOT NULL,
  api_key text,
  active boolean DEFAULT false,
  context_length integer DEFAULT 4096,
  temperature float DEFAULT 0.7,
  max_tokens integer DEFAULT 1000,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_model_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own model settings"
  ON user_model_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own model settings"
  ON user_model_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own model settings"
  ON user_model_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own model settings"
  ON user_model_settings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_model_settings_user_id ON user_model_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_model_settings_model_id ON user_model_settings(model_id);