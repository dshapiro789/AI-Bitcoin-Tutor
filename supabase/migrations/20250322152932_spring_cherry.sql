/*
  # User Models Schema Update

  1. New Tables
    - `user_models`
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
    - Add policies for authenticated users to manage their models
    - Add indexes for performance

  3. Changes
    - Creates a new table for storing user-specific AI model configurations
    - Implements row-level security policies
    - Adds necessary indexes for query optimization
*/

-- Create user_models table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS user_models (
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
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE user_models ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can read their own models" ON user_models;
  DROP POLICY IF EXISTS "Users can insert their own models" ON user_models;
  DROP POLICY IF EXISTS "Users can update their own models" ON user_models;
  DROP POLICY IF EXISTS "Users can delete their own models" ON user_models;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create policies
CREATE POLICY "Users can read their own models"
  ON user_models
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own models"
  ON user_models
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own models"
  ON user_models
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own models"
  ON user_models
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes if they don't exist
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_user_models_user_id ON user_models(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_models_model_id ON user_models(model_id);
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;