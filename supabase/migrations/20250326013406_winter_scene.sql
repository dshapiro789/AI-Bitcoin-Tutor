/*
  # Course Enhancements Schema

  1. New Tables
    - `exercises`
      - `id` (uuid, primary key)
      - `course_id` (text)
      - `title` (text)
      - `description` (text)
      - `starter_code` (text)
      - `solution` (text)
      - `hints` (text[])
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `exercise_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `exercise_id` (uuid, references exercises)
      - `completed` (boolean)
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)

    - `achievements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `achievement_id` (text)
      - `unlocked_at` (timestamptz)
      - `created_at` (timestamptz)

    - `checkpoint_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `course_id` (text)
      - `checkpoint_id` (text)
      - `completed` (boolean)
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for user access control
*/

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  starter_code text,
  solution text,
  hints text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create exercise progress table
CREATE TABLE IF NOT EXISTS exercise_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  exercise_id uuid REFERENCES exercises NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  achievement_id text NOT NULL,
  unlocked_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create checkpoint progress table
CREATE TABLE IF NOT EXISTS checkpoint_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  course_id text NOT NULL,
  checkpoint_id text NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoint_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for exercises
CREATE POLICY "Public can view exercises"
  ON exercises
  FOR SELECT
  TO public
  USING (true);

-- Create policies for exercise progress
CREATE POLICY "Users can view own exercise progress"
  ON exercise_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercise progress"
  ON exercise_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercise progress"
  ON exercise_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for achievements
CREATE POLICY "Users can view own achievements"
  ON achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for checkpoint progress
CREATE POLICY "Users can view own checkpoint progress"
  ON checkpoint_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkpoint progress"
  ON checkpoint_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkpoint progress"
  ON checkpoint_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_exercise_progress_user_id ON exercise_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_progress_exercise_id ON exercise_progress(exercise_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_checkpoint_progress_user_id ON checkpoint_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_checkpoint_progress_course_id ON checkpoint_progress(course_id);