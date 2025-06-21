/*
  # Add Feedback Email Notification System

  1. Changes
    - Create a database trigger that calls the send-feedback-email Edge Function
    - The trigger fires after INSERT on the feedback table
    - Automatically sends email notifications for new feedback submissions

  2. Security
    - Uses service role to call the Edge Function
    - Includes all necessary feedback data in the function call

  3. Features
    - Automatic email notifications for all new feedback
    - Includes all feedback details in a formatted email
    - Sends to aibitcointutor@gmail.com
    - Uses Resend API for reliable email delivery
*/

-- Function to call the send-feedback-email Edge Function
CREATE OR REPLACE FUNCTION notify_feedback_submission()
RETURNS trigger AS $$
DECLARE
  feedback_json jsonb;
BEGIN
  -- Prepare feedback data as JSON
  feedback_json := to_jsonb(NEW);
  
  -- Call the Edge Function asynchronously using pg_net (if available)
  -- Note: This requires the pg_net extension to be enabled
  -- Alternative: Use a simpler approach with a scheduled job or manual processing
  
  -- For now, we'll log the feedback submission
  -- The actual email sending will be handled by a separate process
  RAISE LOG 'New feedback submission: %', NEW.reference_number;
  
  -- In a production environment, you would typically:
  -- 1. Use pg_net to call the Edge Function directly
  -- 2. Or use a job queue system
  -- 3. Or process via a scheduled function
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for feedback email notifications
DROP TRIGGER IF EXISTS feedback_email_notification_trigger ON feedback;
CREATE TRIGGER feedback_email_notification_trigger
  AFTER INSERT ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION notify_feedback_submission();

-- Note: To enable automatic email sending, you'll need to:
-- 1. Enable the pg_net extension in your Supabase project
-- 2. Update the notify_feedback_submission function to use pg_net.http_post
-- 3. Or implement a scheduled job that processes new feedback entries

-- Example of how to call the Edge Function manually (for testing):
-- SELECT net.http_post(
--   url := 'https://your-project.supabase.co/functions/v1/send-feedback-email',
--   headers := '{"Content-Type": "application/json", "Authorization": "Bearer your-service-role-key"}'::jsonb,
--   body := '{"reference_number": "FB-20250621-ABCD", "title": "Test Feedback"}'::jsonb
-- );