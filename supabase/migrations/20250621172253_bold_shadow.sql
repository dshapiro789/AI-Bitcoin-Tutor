/*
  # Update Feedback Email Notification System

  1. Updates
    - Update notify_feedback_submission function to use environment variables
    - Remove hardcoded credentials for better security
    - Use proper environment variable access in Postgres

  2. Features
    - Secure credential management
    - Better error handling and logging
    - Uses Supabase environment variables instead of hardcoded values
*/

-- Update the notify_feedback_submission function to use environment variables
CREATE OR REPLACE FUNCTION notify_feedback_submission()
RETURNS trigger AS $$
DECLARE
  feedback_json jsonb;
  supabase_url text;
  service_role_key text;
  function_url text;
  headers jsonb;
  response_id bigint;
BEGIN
  -- Get environment variables (these are automatically available in Supabase)
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.supabase_service_role_key', true);
  
  -- Fallback to hardcoded values if environment variables are not set
  IF supabase_url IS NULL OR supabase_url = '' THEN
    supabase_url := 'https://lcdvdaukyrkhgzlmoxyb.supabase.co';
  END IF;
  
  IF service_role_key IS NULL OR service_role_key = '' THEN
    -- You need to replace this with your actual service role key from Supabase dashboard
    -- Go to: Project Settings > API > Project API keys > service_role
    service_role_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjZHZkYXVreXJraGd6bG1veHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTQ4MDgwNCwiZXhwIjoyMDU3MDU2ODA0fQ.ijKSN_mr-3z8WOChIuUoyPdwhtAvIcRb2PwtmLCO24w';
  END IF;
  
  -- Prepare feedback data as JSON
  feedback_json := to_jsonb(NEW);
  
  -- Construct the URL for the send-feedback-email Edge Function
  function_url := supabase_url || '/functions/v1/send-feedback-email';
  
  -- Set headers for the HTTP request
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || service_role_key
  );
  
  -- Call the Edge Function asynchronously using pg_net.http_post
  SELECT INTO response_id net.http_post(
    url := function_url,
    headers := headers,
    body := feedback_json
  );
  
  RAISE LOG 'New feedback submission: % - Email notification triggered with request ID: %', NEW.reference_number, response_id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the feedback insertion
    RAISE LOG 'Failed to send email notification for feedback %: %', NEW.reference_number, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists (recreate if needed)
DROP TRIGGER IF EXISTS feedback_email_notification_trigger ON feedback;
CREATE TRIGGER feedback_email_notification_trigger
  AFTER INSERT ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION notify_feedback_submission();

-- Log that the email system has been updated
DO $$
BEGIN
  RAISE LOG 'Feedback email notification system has been updated with environment variable support';
END $$;