import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Processing pending feedback email notifications')
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing')
    }

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get feedback entries that need email notifications
    // We'll look for feedback created in the last 5 minutes that hasn't been processed
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    const { data: pendingFeedback, error: fetchError } = await supabase
      .from('feedback')
      .select('*')
      .gte('created_at', fiveMinutesAgo)
      .is('email_sent', null) // Assuming we add this column to track email status
      .order('created_at', { ascending: true })
      .limit(10) // Process up to 10 at a time

    if (fetchError) {
      console.error('Error fetching pending feedback:', fetchError)
      throw fetchError
    }

    if (!pendingFeedback || pendingFeedback.length === 0) {
      console.log('No pending feedback to process')
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No pending feedback to process',
          processed: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    console.log(`Processing ${pendingFeedback.length} feedback entries`)

    let successCount = 0
    let errorCount = 0

    // Process each feedback entry
    for (const feedback of pendingFeedback) {
      try {
        // Call the send-feedback-email function
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-feedback-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify(feedback),
        })

        if (emailResponse.ok) {
          // Mark as email sent (you'll need to add this column)
          // await supabase
          //   .from('feedback')
          //   .update({ email_sent: new Date().toISOString() })
          //   .eq('id', feedback.id)
          
          successCount++
          console.log(`Email sent for feedback ${feedback.reference_number}`)
        } else {
          const errorText = await emailResponse.text()
          console.error(`Failed to send email for ${feedback.reference_number}:`, errorText)
          errorCount++
        }
      } catch (error) {
        console.error(`Error processing feedback ${feedback.reference_number}:`, error)
        errorCount++
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Processed ${pendingFeedback.length} feedback entries`,
        processed: successCount,
        errors: errorCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error processing feedback emails:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check the function logs for more information'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})