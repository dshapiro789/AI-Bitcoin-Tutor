/*
  # Add Knowledge Level to Profiles

  1. Changes
    - Add `knowledge_level` column to profiles table
    - Set default value to null (will trigger welcome screen)
    - Add index for performance

  2. Security
    - No changes to RLS policies needed
*/

-- Add knowledge_level column to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'knowledge_level'
  ) THEN
    ALTER TABLE profiles ADD COLUMN knowledge_level text;
  END IF;
END $$;

-- Create index for knowledge level lookups
CREATE INDEX IF NOT EXISTS idx_profiles_knowledge_level ON profiles(knowledge_level);