-- Add api_endpoint column to user_models table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_models' AND column_name = 'api_endpoint'
  ) THEN
    ALTER TABLE user_models ADD COLUMN api_endpoint text;
  END IF;
END $$;