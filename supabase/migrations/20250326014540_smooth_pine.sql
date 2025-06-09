/*
  # Add Exercise and Achievement Tables

  1. New Tables
    - `exercises`: Store exercise content and metadata
    - `exercise_progress`: Track user progress on exercises
    - `achievements`: Store user achievement unlocks
    - `checkpoint_progress`: Track course checkpoint completion

  2. Security
    - Enable RLS on all tables
    - Add policies for user access control
    - Create necessary indexes
*/

-- Create exercises table if it doesn't exist
DO $$ BEGIN
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
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Create exercise progress table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS exercise_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    exercise_id uuid REFERENCES exercises NOT NULL,
    completed boolean DEFAULT false,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Create achievements table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS achievements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    achievement_id text NOT NULL,
    unlocked_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Create checkpoint progress table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS checkpoint_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    course_id text NOT NULL,
    checkpoint_id text NOT NULL,
    completed boolean DEFAULT false,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Enable RLS
DO $$ BEGIN
  ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
  ALTER TABLE exercise_progress ENABLE ROW LEVEL SECURITY;
  ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
  ALTER TABLE checkpoint_progress ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can view exercises" ON exercises;
  DROP POLICY IF EXISTS "Users can view own exercise progress" ON exercise_progress;
  DROP POLICY IF EXISTS "Users can insert own exercise progress" ON exercise_progress;
  DROP POLICY IF EXISTS "Users can update own exercise progress" ON exercise_progress;
  DROP POLICY IF EXISTS "Users can view own achievements" ON achievements;
  DROP POLICY IF EXISTS "Users can insert own achievements" ON achievements;
  DROP POLICY IF EXISTS "Users can view own checkpoint progress" ON checkpoint_progress;
  DROP POLICY IF EXISTS "Users can insert own checkpoint progress" ON checkpoint_progress;
  DROP POLICY IF EXISTS "Users can update own checkpoint progress" ON checkpoint_progress;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

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

-- Create indexes if they don't exist
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_exercise_progress_user_id ON exercise_progress(user_id);
  CREATE INDEX IF NOT EXISTS idx_exercise_progress_exercise_id ON exercise_progress(exercise_id);
  CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
  CREATE INDEX IF NOT EXISTS idx_checkpoint_progress_user_id ON checkpoint_progress(user_id);
  CREATE INDEX IF NOT EXISTS idx_checkpoint_progress_course_id ON checkpoint_progress(course_id);
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;