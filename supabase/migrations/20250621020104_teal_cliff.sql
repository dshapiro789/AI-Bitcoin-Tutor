/*
  # Complete Feedback Email Notification System

  1. Updates
    - Update notify_feedback_submission function to use pg_net.http_post
    - Configure with actual Supabase URL and service role key
    - Enable automatic email notifications for new feedback

  2. Features
    - Automatic email sending when feedback is submitted
    - Uses pg_net extension to call send-feedback-email Edge Function
    - Proper error handling and logging
*/

-- Update the notify_feedback_submission function to actually send emails
CREATE OR REPLACE FUNCTION notify_feedback_submission()
RETURNS trigger AS $$
DECLARE
  feedback_json jsonb;
  supabase_url text := 'https://lcdvdaukyrkhgzlmoxyb.supabase.co';
  service_role_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjZHZkYXVreXJraGd6bG1veHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTQ4MDgwNCwiZXhwIjoyMDU3MDU2ODA0fQ.ijKSN_mr-3z8WOChIuUoyPdwhtAvIcRb2PwtmLCO24w';
  function_url text;
  headers jsonb;
  response_id bigint;
BEGIN
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

-- Log that the email system is now active
DO $$
BEGIN
  RAISE LOG 'Feedback email notification system is now active and configured';
END $$;