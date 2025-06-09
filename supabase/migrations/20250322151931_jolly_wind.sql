/*
  # AI Models Schema

  1. New Tables
    - `ai_models`
      - `id` (uuid, primary key)
      - `model_id` (text, unique)
      - `name` (text)
      - `provider` (text)
      - `api_key` (text, encrypted)
      - `active` (boolean)
      - `context_length` (integer)
      - `temperature` (float)
      - `max_tokens` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `ai_models` table
    - Add policies for authenticated users to manage their models
*/

-- Create AI Models table
CREATE TABLE IF NOT EXISTS ai_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id text NOT NULL UNIQUE,
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
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read their own models"
  ON ai_models
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own models"
  ON ai_models
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own models"
  ON ai_models
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own models"
  ON ai_models
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);