/*
  # Add Unique Constraint to stripe_subscription_id

  1. Changes
    - Clean up duplicate stripe_subscription_id values
    - Add unique constraint to stripe_subscription_id column
    - Ensure data integrity for subscription management

  2. Process
    - Identify and resolve duplicate stripe_subscription_id entries
    - Keep the most recent subscription record for each duplicate
    - Add unique constraint after cleanup
*/

-- First, let's identify and clean up duplicate stripe_subscription_id values
-- We'll keep the most recent record for each stripe_subscription_id and mark older ones as canceled

DO $$
DECLARE
  duplicate_count integer;
BEGIN
  -- Log start of cleanup process
  RAISE LOG 'Starting cleanup of duplicate stripe_subscription_id values';
  
  -- Count duplicates before cleanup
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT stripe_subscription_id, COUNT(*) as cnt
    FROM subscriptions 
    WHERE stripe_subscription_id IS NOT NULL
    GROUP BY stripe_subscription_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  RAISE LOG 'Found % duplicate stripe_subscription_id groups', duplicate_count;
  
  -- Update older duplicate records to have status 'canceled' and clear their stripe_subscription_id
  -- This keeps the most recent record for each stripe_subscription_id
  UPDATE subscriptions 
  SET 
    status = 'canceled',
    stripe_subscription_id = NULL,
    updated_at = now()
  WHERE id IN (
    SELECT s1.id
    FROM subscriptions s1
    INNER JOIN subscriptions s2 ON s1.stripe_subscription_id = s2.stripe_subscription_id
    WHERE s1.stripe_subscription_id IS NOT NULL
      AND s1.id != s2.id
      AND s1.created_at < s2.created_at  -- Keep the newer record
  );
  
  -- Log completion of cleanup
  GET DIAGNOSTICS duplicate_count = ROW_COUNT;
  RAISE LOG 'Cleaned up % duplicate subscription records', duplicate_count;
  
END $$;

-- Verify no duplicates remain
DO $$
DECLARE
  remaining_duplicates integer;
BEGIN
  SELECT COUNT(*) INTO remaining_duplicates
  FROM (
    SELECT stripe_subscription_id, COUNT(*) as cnt
    FROM subscriptions 
    WHERE stripe_subscription_id IS NOT NULL
    GROUP BY stripe_subscription_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF remaining_duplicates > 0 THEN
    RAISE EXCEPTION 'Still have % duplicate stripe_subscription_id groups after cleanup', remaining_duplicates;
  END IF;
  
  RAISE LOG 'Verified no duplicate stripe_subscription_id values remain';
END $$;

-- Now add the unique constraint
ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id);

-- Log successful completion
DO $$
BEGIN
  RAISE LOG 'Successfully added unique constraint to stripe_subscription_id column';
  RAISE LOG 'Migration completed: duplicate cleanup and unique constraint added';
END $$;