/*
  # Expand Course Schema

  1. Changes
    - Add new columns to exercises table for expanded content
    - Add quiz_results table for tracking expanded quiz responses
    - Add course_content table for additional module materials
    - Add course_resources table for supplementary content

  2. Security
    - Enable RLS on new tables
    - Add appropriate policies
    - Create necessary indexes
*/

-- Add quiz_results table
CREATE TABLE IF NOT EXISTS quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  quiz_id text NOT NULL,
  course_id text NOT NULL,
  score integer NOT NULL,
  max_score integer NOT NULL,
  answers jsonb NOT NULL,
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Add course_content table
CREATE TABLE IF NOT EXISTS course_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id text NOT NULL,
  module_id text NOT NULL,
  content_type text NOT NULL,
  title text NOT NULL,
  description text,
  content text NOT NULL,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add course_resources table
CREATE TABLE IF NOT EXISTS course_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id text NOT NULL,
  module_id text NOT NULL,
  title text NOT NULL,
  description text,
  resource_type text NOT NULL,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_resources ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own quiz results"
  ON quiz_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz results"
  ON quiz_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view course content"
  ON course_content
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view course resources"
  ON course_resources
  FOR SELECT
  TO public
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_course_id ON quiz_results(course_id);
CREATE INDEX IF NOT EXISTS idx_course_content_course_id ON course_content(course_id);
CREATE INDEX IF NOT EXISTS idx_course_content_module_id ON course_content(module_id);
CREATE INDEX IF NOT EXISTS idx_course_resources_course_id ON course_resources(course_id);
CREATE INDEX IF NOT EXISTS idx_course_resources_module_id ON course_resources(module_id);