/*
  # Add Course Progress Tracking
  
  1. New Tables
    - `course_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `course_id` (text)
      - `module_index` (integer)
      - `completed` (boolean)
      - `progress` (float)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      
  2. Security
    - Enable RLS on course_progress table
    - Add policies for user access control
*/

-- Create course progress table
CREATE TABLE IF NOT EXISTS course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  course_id text NOT NULL,
  module_index integer NOT NULL DEFAULT 0,
  completed boolean DEFAULT false,
  progress float DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own course progress"
  ON course_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own course progress"
  ON course_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own course progress"
  ON course_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_course_progress_user_id ON course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_course_id ON course_progress(course_id);