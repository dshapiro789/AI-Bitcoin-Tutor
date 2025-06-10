/*
  # Add cancel_at_period_end to subscriptions table

  1. Changes
    - Add `cancel_at_period_end` boolean column to subscriptions table
    - Set default value to false
    - Update existing records to have false value

  2. Security
    - No changes to RLS policies needed
*/

-- Add cancel_at_period_end column to subscriptions table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'cancel_at_period_end'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN cancel_at_period_end boolean DEFAULT false;
  END IF;
END $$;

-- Update existing records to have false value for cancel_at_period_end
UPDATE subscriptions 
SET cancel_at_period_end = false 
WHERE cancel_at_period_end IS NULL;