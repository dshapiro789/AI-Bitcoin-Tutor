/*
  # Enhanced Course Content Schema

  1. New Tables
    - `course_glossary`: Store course-specific glossary terms
    - `course_case_studies`: Store detailed case studies
    - `course_learning_objectives`: Store course learning objectives
    - `course_external_resources`: Store links to external resources

  2. Security
    - Enable RLS
    - Add policies for content access
    - Create indexes for performance
*/

-- Create course glossary table
CREATE TABLE IF NOT EXISTS course_glossary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id text NOT NULL,
  term text NOT NULL,
  definition text NOT NULL,
  category text,
  see_also text[],
  created_at timestamptz DEFAULT now()
);

-- Create case studies table
CREATE TABLE IF NOT EXISTS course_case_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id text NOT NULL,
  module_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  content text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create learning objectives table
CREATE TABLE IF NOT EXISTS course_learning_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id text NOT NULL,
  objective text NOT NULL,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create external resources table
CREATE TABLE IF NOT EXISTS course_external_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id text NOT NULL,
  module_id text NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  description text NOT NULL,
  resource_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE course_glossary ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_learning_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_external_resources ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view course glossary"
  ON course_glossary
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view case studies"
  ON course_case_studies
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view learning objectives"
  ON course_learning_objectives
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view external resources"
  ON course_external_resources
  FOR SELECT
  TO public
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_course_glossary_course_id ON course_glossary(course_id);
CREATE INDEX IF NOT EXISTS idx_case_studies_course_id ON course_case_studies(course_id);
CREATE INDEX IF NOT EXISTS idx_case_studies_module_id ON course_case_studies(module_id);
CREATE INDEX IF NOT EXISTS idx_learning_objectives_course_id ON course_learning_objectives(course_id);
CREATE INDEX IF NOT EXISTS idx_external_resources_course_id ON course_external_resources(course_id);
CREATE INDEX IF NOT EXISTS idx_external_resources_module_id ON course_external_resources(module_id);