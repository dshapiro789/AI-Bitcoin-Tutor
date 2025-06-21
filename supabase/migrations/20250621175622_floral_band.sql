/*
  # Add Unique Constraint to stripe_subscription_id

  1. Changes
    - Add unique constraint to stripe_subscription_id column in subscriptions table
    - This ensures each Stripe subscription has only one corresponding record
    - Prevents data conflicts and enables reliable upsert operations

  2. Security
    - No changes to RLS policies needed
    - Maintains existing access controls

  3. Important Notes
    - If there are existing duplicate non-NULL stripe_subscription_id values, 
      this migration will fail and duplicates must be resolved manually first
    - After this migration, webhook and fix functions can use upsert operations
      targeting stripe_subscription_id for more reliable updates
*/

-- Add unique constraint to stripe_subscription_id column
ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id);

-- Log successful completion
DO $$
BEGIN
  RAISE LOG 'Successfully added unique constraint to stripe_subscription_id column';
END $$;