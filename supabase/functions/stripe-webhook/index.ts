import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== STRIPE WEBHOOK RECEIVED ===')
    
    // Get environment variables
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    console.log('Environment check:', {
      hasWebhookSecret: !!stripeWebhookSecret,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    })

    if (!stripeWebhookSecret || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables')
    }

    // Get the raw body and signature
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    console.log('Request details:', {
      hasBody: !!body,
      hasSignature: !!signature,
      bodyLength: body.length
    })

    if (!signature) {
      throw new Error('Missing Stripe signature')
    }

    // Verify the webhook signature
    const isValidSignature = await verifyStripeSignature(body, signature, stripeWebhookSecret)
    if (!isValidSignature) {
      console.error('Invalid webhook signature')
      throw new Error('Invalid webhook signature')
    }

    // Parse the event
    const event = JSON.parse(body)
    console.log('Stripe event received:', {
      type: event.type,
      id: event.id,
      created: event.created
    })

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('Processing checkout.session.completed')
        await handleCheckoutSessionCompleted(event.data.object, supabase)
        break
      
      case 'customer.subscription.created':
        console.log('Processing customer.subscription.created')
        await handleSubscriptionCreated(event.data.object, supabase)
        break
      
      case 'customer.subscription.updated':
        console.log('Processing customer.subscription.updated')
        await handleSubscriptionUpdated(event.data.object, supabase)
        break
      
      case 'customer.subscription.deleted':
        console.log('Processing customer.subscription.deleted')
        await handleSubscriptionDeleted(event.data.object, supabase)
        break
      
      case 'invoice.payment_succeeded':
        console.log('Processing invoice.payment_succeeded')
        await handlePaymentSucceeded(event.data.object, supabase)
        break
      
      case 'invoice.payment_failed':
        console.log('Processing invoice.payment_failed')
        await handlePaymentFailed(event.data.object, supabase)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    console.log('=== WEBHOOK PROCESSING COMPLETE ===')

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('=== WEBHOOK ERROR ===')
    console.error('Error details:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

// Verify Stripe webhook signature
async function verifyStripeSignature(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    const elements = signature.split(',')
    const timestamp = elements.find(el => el.startsWith('t='))?.split('=')[1]
    const signatures = elements.filter(el => el.startsWith('v1='))

    if (!timestamp || signatures.length === 0) {
      console.error('Invalid signature format')
      return false
    }

    // Create the signed payload
    const payload = `${timestamp}.${body}`
    
    // Create HMAC
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signature_bytes = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
    const expected_signature = Array.from(new Uint8Array(signature_bytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Compare signatures
    const isValid = signatures.some(sig => {
      const provided_signature = sig.split('=')[1]
      return provided_signature === expected_signature
    })

    console.log('Signature verification:', { isValid })
    return isValid
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

// Handle successful checkout session
async function handleCheckoutSessionCompleted(session: any, supabase: any) {
  console.log('=== CHECKOUT SESSION COMPLETED ===')
  console.log('Session details:', {
    id: session.id,
    customer: session.customer,
    subscription: session.subscription,
    metadata: session.metadata
  })
  
  const userId = session.metadata?.user_id
  if (!userId) {
    console.error('No user_id found in session metadata')
    return
  }

  console.log('Found user_id:', userId)

  // Get subscription details from Stripe if subscription exists
  if (session.subscription) {
    console.log('Fetching subscription details from Stripe...')
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const subscriptionResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${session.subscription}`, {
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
      },
    })
    
    if (subscriptionResponse.ok) {
      const subscription = await subscriptionResponse.json()
      console.log('Stripe subscription details:', {
        id: subscription.id,
        status: subscription.status,
        customer: subscription.customer,
        current_period_end: subscription.current_period_end
      })
      await createOrUpdateSubscription(subscription, userId, supabase)
    } else {
      console.error('Failed to fetch subscription from Stripe:', subscriptionResponse.status)
    }
  } else {
    console.log('No subscription in checkout session')
  }
}

// Handle subscription creation
async function handleSubscriptionCreated(subscription: any, supabase: any) {
  console.log('=== SUBSCRIPTION CREATED ===')
  console.log('Subscription details:', {
    id: subscription.id,
    customer: subscription.customer,
    status: subscription.status,
    metadata: subscription.metadata
  })
  
  const userId = subscription.metadata?.user_id
  if (!userId) {
    console.error('No user_id found in subscription metadata')
    return
  }

  await createOrUpdateSubscription(subscription, userId, supabase)
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription: any, supabase: any) {
  console.log('=== SUBSCRIPTION UPDATED ===')
  console.log('Subscription details:', {
    id: subscription.id,
    status: subscription.status,
    cancel_at_period_end: subscription.cancel_at_period_end
  })
  
  const userId = subscription.metadata?.user_id
  if (!userId) {
    console.error('No user_id found in subscription metadata')
    return
  }

  await createOrUpdateSubscription(subscription, userId, supabase)
}

// Handle subscription deletion/cancellation
async function handleSubscriptionDeleted(subscription: any, supabase: any) {
  console.log('=== SUBSCRIPTION DELETED ===')
  console.log('Subscription ID:', subscription.id)
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      end_date: new Date().toISOString(),
      cancel_at_period_end: false,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating subscription:', error)
  } else {
    console.log('Successfully marked subscription as canceled')
  }
}

// Handle successful payment
async function handlePaymentSucceeded(invoice: any, supabase: any) {
  console.log('=== PAYMENT SUCCEEDED ===')
  console.log('Invoice details:', {
    id: invoice.id,
    subscription: invoice.subscription,
    amount_paid: invoice.amount_paid
  })
  
  if (invoice.subscription) {
    // Update subscription status to active
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', invoice.subscription)

    if (error) {
      console.error('Error updating subscription after payment:', error)
    } else {
      console.log('Successfully updated subscription status to active')
    }
  }
}

// Handle failed payment
async function handlePaymentFailed(invoice: any, supabase: any) {
  console.log('=== PAYMENT FAILED ===')
  console.log('Invoice details:', {
    id: invoice.id,
    subscription: invoice.subscription,
    attempt_count: invoice.attempt_count
  })
  
  if (invoice.subscription) {
    // Update subscription status to past_due or canceled based on attempt count
    const status = invoice.attempt_count >= 3 ? 'canceled' : 'past_due'
    
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', invoice.subscription)

    if (error) {
      console.error('Error updating subscription after failed payment:', error)
    } else {
      console.log(`Successfully updated subscription status to ${status}`)
    }
  }
}

// Create or update subscription in database
async function createOrUpdateSubscription(subscription: any, userId: string, supabase: any) {
  console.log('=== CREATE/UPDATE SUBSCRIPTION ===')
  console.log('Processing subscription for user:', userId)
  
  // Determine status based on Stripe subscription state
  let status = subscription.status
  if (subscription.cancel_at_period_end && subscription.status === 'active') {
    status = 'active_until_period_end'
  }

  const subscriptionData = {
    user_id: userId,
    tier: 'premium',
    status: status,
    start_date: new Date(subscription.created * 1000).toISOString(),
    end_date: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
    stripe_customer_id: subscription.customer,
    stripe_price_id: subscription.items.data[0]?.price?.id,
    stripe_subscription_id: subscription.id,
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    updated_at: new Date().toISOString()
  }

  console.log('Subscription data to save:', subscriptionData)

  // Try to update existing subscription first
  const { data: existingSubscription, error: selectError } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  console.log('Existing subscription check:', { 
    found: !!existingSubscription, 
    error: selectError?.message 
  })

  if (existingSubscription) {
    // Update existing subscription
    const { error } = await supabase
      .from('subscriptions')
      .update(subscriptionData)
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('Error updating subscription:', error)
    } else {
      console.log('Successfully updated subscription:', subscription.id)
    }
  } else {
    // Create new subscription
    const { error } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)

    if (error) {
      console.error('Error creating subscription:', error)
    } else {
      console.log('Successfully created subscription:', subscription.id)
    }
  }

  // Also check if we need to create/update by user_id (in case of multiple subscriptions)
  const { data: userSubscription, error: userSelectError } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!userSubscription && userSelectError?.code === 'PGRST116') {
    // No subscription exists for this user, create one
    console.log('Creating subscription record for user:', userId)
    const { error: insertError } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)

    if (insertError) {
      console.error('Error creating user subscription:', insertError)
    } else {
      console.log('Successfully created user subscription')
    }
  }
}