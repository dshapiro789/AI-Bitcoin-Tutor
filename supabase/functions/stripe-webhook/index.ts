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
    // Get environment variables
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!stripeWebhookSecret || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables')
    }

    // Get the raw body and signature
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      throw new Error('Missing Stripe signature')
    }

    // Verify the webhook signature
    const isValidSignature = await verifyStripeSignature(body, signature, stripeWebhookSecret)
    if (!isValidSignature) {
      throw new Error('Invalid webhook signature')
    }

    // Parse the event
    const event = JSON.parse(body)
    console.log('Received Stripe webhook event:', event.type)

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object, supabase)
        break
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object, supabase)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, supabase)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, supabase)
        break
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object, supabase)
        break
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object, supabase)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Webhook error:', error)
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
    return signatures.some(sig => {
      const provided_signature = sig.split('=')[1]
      return provided_signature === expected_signature
    })
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

// Handle successful checkout session
async function handleCheckoutSessionCompleted(session: any, supabase: any) {
  console.log('Processing checkout session completed:', session.id)
  
  const userId = session.metadata?.user_id
  if (!userId) {
    console.error('No user_id found in session metadata')
    return
  }

  // Get subscription details from Stripe
  if (session.subscription) {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const subscriptionResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${session.subscription}`, {
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
      },
    })
    
    if (subscriptionResponse.ok) {
      const subscription = await subscriptionResponse.json()
      await createOrUpdateSubscription(subscription, userId, supabase)
    }
  }
}

// Handle subscription creation
async function handleSubscriptionCreated(subscription: any, supabase: any) {
  console.log('Processing subscription created:', subscription.id)
  
  const userId = subscription.metadata?.user_id
  if (!userId) {
    console.error('No user_id found in subscription metadata')
    return
  }

  await createOrUpdateSubscription(subscription, userId, supabase)
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription: any, supabase: any) {
  console.log('Processing subscription updated:', subscription.id)
  
  const userId = subscription.metadata?.user_id
  if (!userId) {
    console.error('No user_id found in subscription metadata')
    return
  }

  await createOrUpdateSubscription(subscription, userId, supabase)
}

// Handle subscription deletion/cancellation
async function handleSubscriptionDeleted(subscription: any, supabase: any) {
  console.log('Processing subscription deleted:', subscription.id)
  
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
  }
}

// Handle successful payment
async function handlePaymentSucceeded(invoice: any, supabase: any) {
  console.log('Processing payment succeeded:', invoice.id)
  
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
    }
  }
}

// Handle failed payment
async function handlePaymentFailed(invoice: any, supabase: any) {
  console.log('Processing payment failed:', invoice.id)
  
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
    }
  }
}

// Create or update subscription in database
async function createOrUpdateSubscription(subscription: any, userId: string, supabase: any) {
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

  // Try to update existing subscription first
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

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
}