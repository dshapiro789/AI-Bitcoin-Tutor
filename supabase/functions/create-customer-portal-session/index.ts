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
    console.log('Received request to create customer portal session')
    
    const { userId, returnUrl } = await req.json()
    console.log('Request data:', { userId, returnUrl })

    if (!userId) {
      throw new Error('Missing required parameter: userId')
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

    console.log('Getting user subscription data...')

    // Get user's Stripe customer ID from subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    if (subscriptionError || !subscription?.stripe_customer_id) {
      throw new Error('No subscription found for user or missing Stripe customer ID')
    }

    const customerId = subscription.stripe_customer_id
    console.log('Found customer ID:', customerId)

    console.log('Creating Stripe customer portal session...')

    // Create Stripe customer portal session
    const stripeResponse = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'customer': customerId,
        'return_url': returnUrl || `${req.headers.get('origin') || 'https://aibitcointutor.com'}/account`,
      }),
    })

    console.log('Stripe API response status:', stripeResponse.status)

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text()
      console.error('Stripe API error:', errorText)
      throw new Error(`Stripe API error: ${stripeResponse.status} - ${errorText}`)
    }

    const session = await stripeResponse.json()
    console.log('Successfully created customer portal session:', session.id)

    return new Response(
      JSON.stringify({ 
        url: session.url
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error creating customer portal session:', error)
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