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
    console.log('Received request to cancel subscription at period end')
    
    const { stripeSubscriptionId, userId } = await req.json()
    console.log('Request data:', { stripeSubscriptionId, userId })

    if (!stripeSubscriptionId || !userId) {
      throw new Error('Missing required parameters: stripeSubscriptionId and userId')
    }

    // Get environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!stripeSecretKey) {
      console.error('Stripe secret key not found in environment')
      throw new Error('Stripe secret key not configured')
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing')
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Updating Stripe subscription to cancel at period end...')

    // Update Stripe subscription to cancel at period end
    const stripeResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${stripeSubscriptionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'cancel_at_period_end': 'true',
      }),
    })

    console.log('Stripe API response status:', stripeResponse.status)

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text()
      console.error('Stripe API error:', errorText)
      throw new Error(`Stripe API error: ${stripeResponse.status} - ${errorText}`)
    }

    const subscription = await stripeResponse.json()
    console.log('Successfully updated Stripe subscription:', subscription.id)

    // Update the subscription in our database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        status: 'active_until_period_end',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .eq('user_id', userId)

    if (updateError) {
      console.error('Database update error:', updateError)
      throw new Error('Failed to update subscription in database')
    }

    console.log('Successfully updated subscription in database')

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Subscription will be canceled at the end of the current period'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check the function logs for more information'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})