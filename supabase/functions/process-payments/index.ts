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
    console.log('Received request to process payment')
    
    const { priceId, userId } = await req.json()
    console.log('Request data:', { priceId, userId })

    if (!priceId || !userId) {
      throw new Error('Missing required parameters: priceId and userId')
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

    console.log('Creating Stripe checkout session...')

    // Get user email from Supabase
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)
    if (userError || !userData.user) {
      throw new Error('User not found')
    }

    // Create or retrieve Stripe customer
    let customerId = null
    
    // Check if user already has a Stripe customer ID
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    if (existingSubscription?.stripe_customer_id) {
      customerId = existingSubscription.stripe_customer_id
    } else {
      // Create new Stripe customer
      const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'email': userData.user.email || '',
          'metadata[user_id]': userId,
        }),
      })

      if (!customerResponse.ok) {
        throw new Error('Failed to create Stripe customer')
      }

      const customer = await customerResponse.json()
      customerId = customer.id
    }

    // Create Stripe checkout session with promotion codes enabled
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'customer': customerId,
        'payment_method_types[0]': 'card',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        'allow_promotion_codes': 'true', // Enable promotion codes
        'billing_address_collection': 'required',
        'success_url': `${req.headers.get('origin') || 'https://aibitcointutor.com'}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': `${req.headers.get('origin') || 'https://aibitcointutor.com'}/subscription`,
        'metadata[user_id]': userId,
        'subscription_data[metadata][user_id]': userId,
      }),
    })

    console.log('Stripe API response status:', stripeResponse.status)

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text()
      console.error('Stripe API error:', errorText)
      throw new Error(`Stripe API error: ${stripeResponse.status} - ${errorText}`)
    }

    const session = await stripeResponse.json()
    console.log('Successfully created checkout session:', session.id)

    // Store the customer ID if it's new
    if (!existingSubscription?.stripe_customer_id) {
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          tier: 'free',
          status: 'none',
          stripe_customer_id: customerId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    }

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error processing payment:', error)
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