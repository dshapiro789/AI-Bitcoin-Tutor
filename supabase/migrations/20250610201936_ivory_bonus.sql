/*
  # Chat History and Enhanced Schema

  1. New Tables
    - `chat_history`: Store user chat conversations
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `message_text` (text)
      - `is_user` (boolean)
      - `model_used` (text)
      - `category` (text)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)

  2. Enhanced Tables (if not exist)
    - `profiles`: User profile information
    - `courses`: Course content
    - `lessons`: Course lessons
    - `articles`: Article content

  3. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Create indexes for performance
*/

-- Create chat history table
CREATE TABLE IF NOT EXISTS chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  message_text text NOT NULL,
  is_user boolean NOT NULL,
  model_used text,
  category text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
    CREATE TABLE profiles (
      id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
      email text UNIQUE NOT NULL,
      full_name text,
      role text DEFAULT 'user',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Create courses table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'courses') THEN
    CREATE TABLE courses (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      description text NOT NULL,
      price numeric DEFAULT 0 NOT NULL,
      published boolean DEFAULT false,
      author_id uuid REFERENCES profiles NOT NULL,
      slug text UNIQUE NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Create lessons table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lessons') THEN
    CREATE TABLE lessons (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      content text NOT NULL,
      course_id uuid REFERENCES courses ON DELETE CASCADE NOT NULL,
      lesson_order integer NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Create articles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'articles') THEN
    CREATE TABLE articles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      content text NOT NULL,
      category text NOT NULL,
      slug text UNIQUE NOT NULL,
      author_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
      published boolean DEFAULT false,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
  -- Chat history policies
  DROP POLICY IF EXISTS "Users can view own chat history" ON chat_history;
  DROP POLICY IF EXISTS "Users can insert own chat history" ON chat_history;
  DROP POLICY IF EXISTS "Users can update own chat history" ON chat_history;
  DROP POLICY IF EXISTS "Users can delete own chat history" ON chat_history;

  -- Profiles policies
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

  -- Courses policies
  DROP POLICY IF EXISTS "Published courses are viewable by everyone" ON courses;
  DROP POLICY IF EXISTS "Authors can view own unpublished courses" ON courses;
  DROP POLICY IF EXISTS "Authors can insert courses" ON courses;
  DROP POLICY IF EXISTS "Authors can update own courses" ON courses;

  -- Lessons policies
  DROP POLICY IF EXISTS "Lessons of published courses are viewable by everyone" ON lessons;
  DROP POLICY IF EXISTS "Authors can view lessons of own courses" ON lessons;
  DROP POLICY IF EXISTS "Authors can insert lessons to own courses" ON lessons;
  DROP POLICY IF EXISTS "Authors can update lessons of own courses" ON lessons;

  -- Articles policies
  DROP POLICY IF EXISTS "Published articles are viewable by everyone" ON articles;
  DROP POLICY IF EXISTS "Authors can view own unpublished articles" ON articles;
  DROP POLICY IF EXISTS "Authors can insert articles" ON articles;
  DROP POLICY IF EXISTS "Authors can update own articles" ON articles;

EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create chat history policies
CREATE POLICY "Users can view own chat history"
  ON chat_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat history"
  ON chat_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat history"
  ON chat_history
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat history"
  ON chat_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO public
  USING (auth.uid() = id);

-- Create courses policies
CREATE POLICY "Published courses are viewable by everyone"
  ON courses
  FOR SELECT
  TO public
  USING (published = true);

CREATE POLICY "Authors can view own unpublished courses"
  ON courses
  FOR SELECT
  TO public
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can insert courses"
  ON courses
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own courses"
  ON courses
  FOR UPDATE
  TO public
  USING (auth.uid() = author_id);

-- Create lessons policies
CREATE POLICY "Lessons of published courses are viewable by everyone"
  ON lessons
  FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = lessons.course_id 
    AND courses.published = true
  ));

CREATE POLICY "Authors can view lessons of own courses"
  ON lessons
  FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = lessons.course_id 
    AND courses.author_id = auth.uid()
  ));

CREATE POLICY "Authors can insert lessons to own courses"
  ON lessons
  FOR INSERT
  TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = lessons.course_id 
    AND courses.author_id = auth.uid()
  ));

CREATE POLICY "Authors can update lessons of own courses"
  ON lessons
  FOR UPDATE
  TO public
  USING (EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = lessons.course_id 
    AND courses.author_id = auth.uid()
  ));

-- Create articles policies
CREATE POLICY "Published articles are viewable by everyone"
  ON articles
  FOR SELECT
  TO public
  USING (published = true);

CREATE POLICY "Authors can view own unpublished articles"
  ON articles
  FOR SELECT
  TO public
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can insert articles"
  ON articles
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own articles"
  ON articles
  FOR UPDATE
  TO public
  USING (auth.uid() = author_id);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_courses_author_id ON courses(author_id);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(published);
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published);