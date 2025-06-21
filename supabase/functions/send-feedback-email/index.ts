import { createClient } from 'npm:@supabase/supabase-js@2'
import { Resend } from 'resend'

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
    console.log('Received feedback email notification request')
    
    // Get environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not found in environment')
      throw new Error('Resend API key not configured')
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing')
    }

    // Parse the request body (feedback data from database trigger)
    const feedbackData = await req.json()
    console.log('Processing feedback data:', feedbackData)

    // Initialize Resend
    const resend = new Resend(resendApiKey)

    // Format the feedback data for email
    const {
      reference_number,
      feedback_type,
      priority_level,
      title,
      description,
      rating,
      poll_response,
      contact_email,
      contact_name,
      created_at
    } = feedbackData

    // Create email content
    const emailSubject = `New Feedback Submission: ${title} [${reference_number}]`
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Feedback Submission</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #374151; }
          .value { margin-top: 5px; padding: 8px; background: white; border-radius: 4px; border-left: 3px solid #f97316; }
          .priority-high { border-left-color: #dc2626; }
          .priority-moderate { border-left-color: #d97706; }
          .priority-low { border-left-color: #059669; }
          .rating { color: #f59e0b; }
          .footer { margin-top: 20px; padding: 15px; background: #e5e7eb; border-radius: 4px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 New Feedback Submission</h1>
            <p>AI Bitcoin Tutor Platform</p>
          </div>
          
          <div class="content">
            <div class="field">
              <div class="label">Reference Number:</div>
              <div class="value"><strong>${reference_number}</strong></div>
            </div>
            
            <div class="field">
              <div class="label">Feedback Type:</div>
              <div class="value">${feedback_type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
            </div>
            
            <div class="field">
              <div class="label">Priority Level:</div>
              <div class="value priority-${priority_level}">
                <strong>${priority_level.toUpperCase()}</strong>
              </div>
            </div>
            
            <div class="field">
              <div class="label">Title:</div>
              <div class="value"><strong>${title}</strong></div>
            </div>
            
            <div class="field">
              <div class="label">Description:</div>
              <div class="value">${description.replace(/\n/g, '<br>')}</div>
            </div>
            
            <div class="field">
              <div class="label">Rating:</div>
              <div class="value rating">
                ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5 stars)
              </div>
            </div>
            
            ${poll_response ? `
            <div class="field">
              <div class="label">Poll Response:</div>
              <div class="value">${poll_response}</div>
            </div>
            ` : ''}
            
            ${contact_name || contact_email ? `
            <div class="field">
              <div class="label">Contact Information:</div>
              <div class="value">
                ${contact_name ? `<strong>Name:</strong> ${contact_name}<br>` : ''}
                ${contact_email ? `<strong>Email:</strong> <a href="mailto:${contact_email}">${contact_email}</a>` : ''}
              </div>
            </div>
            ` : `
            <div class="field">
              <div class="label">Contact Information:</div>
              <div class="value"><em>Anonymous submission</em></div>
            </div>
            `}
            
            <div class="field">
              <div class="label">Submitted:</div>
              <div class="value">${new Date(created_at).toLocaleString()}</div>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Review the feedback and determine appropriate action</li>
              <li>If contact information is provided, consider reaching out to the user</li>
              <li>Update the feedback status in the admin dashboard</li>
              <li>Use reference number <strong>${reference_number}</strong> for tracking</li>
            </ul>
            <p><em>This email was automatically generated by the AI Bitcoin Tutor feedback system.</em></p>
          </div>
        </div>
      </body>
      </html>
    `

    const emailText = `
New Feedback Submission - AI Bitcoin Tutor

Reference Number: ${reference_number}
Feedback Type: ${feedback_type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
Priority Level: ${priority_level.toUpperCase()}
Title: ${title}

Description:
${description}

Rating: ${rating}/5 stars

${poll_response ? `Poll Response: ${poll_response}\n` : ''}

Contact Information:
${contact_name ? `Name: ${contact_name}\n` : ''}${contact_email ? `Email: ${contact_email}\n` : 'Anonymous submission'}

Submitted: ${new Date(created_at).toLocaleString()}

---
This email was automatically generated by the AI Bitcoin Tutor feedback system.
Use reference number ${reference_number} for tracking.
    `

    // Send email using Resend
    console.log('Sending email notification...')
    const emailResult = await resend.emails.send({
      from: 'AI Bitcoin Tutor <noreply@aibitcointutor.com>',
      to: ['aibitcointutor@gmail.com'],
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
      headers: {
        'X-Feedback-Reference': reference_number,
        'X-Priority-Level': priority_level,
        'X-Feedback-Type': feedback_type
      }
    })

    console.log('Email sent successfully:', emailResult.data?.id)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Feedback email notification sent successfully',
        emailId: emailResult.data?.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error sending feedback email:', error)
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