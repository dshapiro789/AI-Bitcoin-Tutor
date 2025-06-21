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
    console.log('=== MANUAL SUBSCRIPTION FIX ===')
    
    const { userEmail } = await req.json()
    console.log('Fixing subscription for user:', userEmail)

    // Get environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables')
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
    if (userError) throw userError

    const user = userData.users.find(u => u.email === userEmail)
    if (!user) {
      throw new Error(`User not found with email: ${userEmail}`)
    }

    console.log('Found user:', user.id)

    // Get all Stripe customers with this email
    const customersResponse = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(userEmail)}`, {
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
      },
    })

    if (!customersResponse.ok) {
      throw new Error('Failed to fetch Stripe customers')
    }

    const customers = await customersResponse.json()
    console.log('Found Stripe customers:', customers.data.length)

    if (customers.data.length === 0) {
      throw new Error('No Stripe customer found for this email')
    }

    // Get subscriptions for each customer
    for (const customer of customers.data) {
      console.log('Checking customer:', customer.id)
      
      const subscriptionsResponse = await fetch(`https://api.stripe.com/v1/subscriptions?customer=${customer.id}`, {
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
        },
      })

      if (!subscriptionsResponse.ok) {
        console.error('Failed to fetch subscriptions for customer:', customer.id)
        continue
      }

      const subscriptions = await subscriptionsResponse.json()
      console.log('Found subscriptions:', subscriptions.data.length)

      // Process each active subscription
      for (const subscription of subscriptions.data) {
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          console.log('Processing active subscription:', subscription.id)
          
          // Create/update subscription in database
          const subscriptionData = {
            user_id: user.id,
            tier: 'premium',
            status: subscription.status,
            start_date: new Date(subscription.created * 1000).toISOString(),
            end_date: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
            stripe_customer_id: customer.id,
            stripe_price_id: subscription.items.data[0]?.price?.id,
            stripe_subscription_id: subscription.id,
            cancel_at_period_end: subscription.cancel_at_period_end || false,
            updated_at: new Date().toISOString()
          }

          // Upsert subscription
          const { error: upsertError } = await supabase
            .from('subscriptions')
            .upsert(subscriptionData, {
              onConflict: 'user_id'
            })

          if (upsertError) {
            console.error('Error upserting subscription:', upsertError)
          } else {
            console.log('Successfully updated subscription for user')
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Subscription status updated successfully',
        userId: user.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error fixing subscription:', error)
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