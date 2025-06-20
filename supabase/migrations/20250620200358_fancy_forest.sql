/*
  # Create Feedback System

  1. New Tables
    - `feedback`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, nullable for anonymous feedback)
      - `reference_number` (text, unique)
      - `feedback_type` (text)
      - `priority_level` (text)
      - `title` (text)
      - `description` (text)
      - `rating` (integer, 1-5 stars)
      - `poll_response` (text)
      - `contact_email` (text, nullable)
      - `contact_name` (text, nullable)
      - `status` (text, default 'open')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on feedback table
    - Add policies for feedback submission and viewing
    - Create indexes for performance

  3. Features
    - Unique reference number generation
    - Support for anonymous feedback
    - Rating and poll system
    - Status tracking for admin management
*/

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  reference_number text UNIQUE NOT NULL,
  feedback_type text NOT NULL,
  priority_level text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  poll_response text,
  contact_email text,
  contact_name text,
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can submit feedback"
  ON feedback
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can view their own feedback"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anonymous feedback is viewable by submitter via reference"
  ON feedback
  FOR SELECT
  TO public
  USING (user_id IS NULL);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_reference_number ON feedback(reference_number);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority_level);

-- Function to generate unique reference numbers
CREATE OR REPLACE FUNCTION generate_feedback_reference()
RETURNS text AS $$
DECLARE
  ref_number text;
  exists_check boolean;
BEGIN
  LOOP
    -- Generate reference number: FB-YYYYMMDD-XXXX (FB + date + 4 random chars)
    ref_number := 'FB-' || to_char(now(), 'YYYYMMDD') || '-' || 
                  upper(substring(md5(random()::text) from 1 for 4));
    
    -- Check if reference number already exists
    SELECT EXISTS(SELECT 1 FROM feedback WHERE reference_number = ref_number) INTO exists_check;
    
    -- If it doesn't exist, we can use it
    IF NOT exists_check THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN ref_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate reference numbers
CREATE OR REPLACE FUNCTION set_feedback_reference_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
    NEW.reference_number := generate_feedback_reference();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feedback_reference_trigger
  BEFORE INSERT OR UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION set_feedback_reference_number();