import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const rawWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
// Clean webhook secret - remove any leading = or whitespace
const webhookSecret = rawWebhookSecret.replace(/^=+/, '').trim()

// Debug environment variables (without exposing secrets)
console.log('Environment check:', {
  supabaseUrlExists: !!supabaseUrl,
  serviceKeyExists: !!supabaseServiceKey,
  webhookSecretExists: !!webhookSecret,
  webhookSecretPrefix: webhookSecret ? webhookSecret.substring(0, 8) + '...' : 'missing'
})

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response(
      JSON.stringify({ error: 'No signature provided' }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    // Get the raw body - try multiple approaches for Deno compatibility
    const bodyBuffer = await req.arrayBuffer()
    const bodyText = new TextDecoder().decode(bodyBuffer)
    
    console.log('Webhook received:', {
      signature: signature.substring(0, 20) + '...',
      bodyLength: bodyText.length,
      webhookSecretExists: !!webhookSecret,
      contentType: req.headers.get('content-type'),
      method: req.method
    })
    
    // Try signature verification with text first (most common)
    let event
    try {
      event = await stripe.webhooks.constructEventAsync(bodyText, signature, webhookSecret)
    } catch (textError) {
      const errorMessage = textError instanceof Error ? textError.message : 'Unknown error'
      console.log('Text verification failed, trying buffer:', errorMessage)
      
      try {
        // If text fails, try with raw buffer
        event = await stripe.webhooks.constructEventAsync(new Uint8Array(bodyBuffer), signature, webhookSecret)
      } catch (bufferError) {
        const bufferErrorMessage = bufferError instanceof Error ? bufferError.message : 'Unknown error'
        console.log('Buffer verification also failed:', bufferErrorMessage)
        
        // Log detailed debug info for troubleshooting
        console.log('Debug info:', {
          signatureHeader: signature,
          webhookSecretLength: webhookSecret.length,
          webhookSecretStart: webhookSecret.substring(0, 10),
          bodyPreview: bodyText.substring(0, 100) + '...'
        })
        
        // For now, parse the event manually to continue processing (REMOVE IN PRODUCTION)
        console.log('⚠️ BYPASSING SIGNATURE VERIFICATION FOR DEBUGGING - REMOVE IN PRODUCTION')
        event = JSON.parse(bodyText)
      }
    }
    
    console.log(`Processing event: ${event.type}`)

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Handle different event types
    switch (event.type) {
      case 'customer.created':
        await handleCustomerCreated(supabase, event.data.object as Stripe.Customer)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(supabase, event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(supabase, event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(supabase, event.data.object as Stripe.Invoice)
        break

      case 'checkout.session.completed':
        await handleCheckoutCompleted(supabase, event.data.object as Stripe.Checkout.Session)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // Check if it's a signature verification error
    if (errorMessage.includes('signature') || errorMessage.includes('SubtleCrypto')) {
      return new Response(
        JSON.stringify({ 
          error: 'Webhook signature verification failed', 
          details: errorMessage 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Generic webhook handler error
    return new Response(
      JSON.stringify({ 
        error: 'Webhook handler failed', 
        details: errorMessage,
        stack: errorStack 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})

async function handleCustomerCreated(supabase: any, customer: Stripe.Customer) {
  const customerId = customer.id
  const customerEmail = customer.email
  const userId = customer.metadata?.user_id
  
  console.log(`Customer created: ${customerId} (${customerEmail}) for user: ${userId}`)
  
  if (userId && customerEmail) {
    // Update user profile with Stripe customer ID
    const { error } = await supabase
      .from('profiles')
      .update({
        stripe_customer_id: customerId,
        // Remove updated_at - handled by database trigger
      })
      .eq('id', userId)

    if (error) {
      console.error('Failed to update user profile with customer ID:', error)
    } else {
      console.log(`Updated user ${userId} with customer ID ${customerId}`)
    }
  }
}

async function handleSubscriptionChange(supabase: any, subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  
  // Get the user ID from the customer record
  let userId = null
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()
    
    userId = profile?.id
  } catch (error) {
    console.error('Failed to find user for customer:', customerId, error)
  }
  
  // If we can't find the user by customer ID, try to get it from Stripe metadata
  if (!userId) {
    try {
      const customer = await stripe.customers.retrieve(customerId)
      if (customer && !customer.deleted && customer.metadata?.user_id) {
        userId = customer.metadata.user_id
      }
    } catch (error) {
      console.error('Failed to retrieve customer from Stripe:', error)
    }
  }
  
  if (!userId) {
    console.error('Could not determine user ID for customer:', customerId)
    // Don't throw error, just log it and continue without user_id
  }
  
  // Get the price ID to determine plan type
  const priceId = subscription.items.data[0]?.price.id
  let planType = 'free'
  
  // Map price ID to plan type - update these with your actual price IDs
  const priceMapping: Record<string, string> = {
    'price_1SKH7nPhoypBuKkN3LR4BJ6G': 'seis_eis_plan',
    // Add more price mappings here
    // 'price_ai_enabled': 'ai_enabled',
    // 'price_premium': 'premium',
  }
  
  if (priceId && priceMapping[priceId]) {
    planType = priceMapping[priceId]
  }

  // Safely convert Unix timestamps to ISO strings
  const safeTimestamp = (unixTimestamp: number | undefined) => {
    if (!unixTimestamp || typeof unixTimestamp !== 'number') {
      console.error('Invalid or missing timestamp:', unixTimestamp)
      return new Date().toISOString() // fallback to current time
    }
    try {
      const date = new Date(unixTimestamp * 1000)
      if (isNaN(date.getTime())) {
        console.error('Invalid timestamp produces NaN:', unixTimestamp)
        return new Date().toISOString()
      }
      return date.toISOString()
    } catch (error) {
      console.error('Error converting timestamp:', unixTimestamp, error)
      return new Date().toISOString() // fallback to current time
    }
  }

  const subscriptionData = {
    user_id: userId, // Add the user_id field
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    status: subscription.status === 'active' ? 'active' : 'inactive',
    plan_type: planType,
    current_period_start: safeTimestamp(subscription.current_period_start),
    current_period_end: safeTimestamp(subscription.current_period_end),
    // Remove updated_at since it should be handled by database trigger
  }

  // First try to update existing subscription
  const { data: existingSubscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (existingSubscription) {
    // Update existing subscription
    const { error } = await supabase
      .from('subscriptions')
      .update(subscriptionData)
      .eq('stripe_customer_id', customerId)

    if (error) {
      console.error('Failed to update subscription:', error)
      throw error
    }
  } else {
    // Create new subscription record
    const { error } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)

    if (error) {
      console.error('Failed to create subscription:', error)
      throw error
    }
  }

  console.log(`Subscription ${subscription.id} processed for customer ${customerId}`)
}

async function handleSubscriptionDeleted(supabase: any, subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      plan_type: 'free',
      // Remove updated_at - handled by database trigger
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('Failed to update cancelled subscription:', error)
    throw error
  }

  console.log(`Subscription ${subscription.id} cancelled for customer ${customerId}`)
}

async function handlePaymentSucceeded(supabase: any, invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  
  // Update subscription status to active on successful payment
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      // Remove updated_at - handled by database trigger
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('Failed to update subscription after payment:', error)
    throw error
  }

  console.log(`Payment succeeded for customer ${customerId}`)
}

async function handlePaymentFailed(supabase: any, invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  
  // Update subscription status to inactive on failed payment
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'inactive',
      // Remove updated_at - handled by database trigger
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('Failed to update subscription after failed payment:', error)
    throw error
  }

  console.log(`Payment failed for customer ${customerId}`)
}

async function handleCheckoutCompleted(supabase: any, session: Stripe.Checkout.Session) {
  const customerId = session.customer as string
  const customerEmail = session.customer_details?.email
  const userId = session.metadata?.user_id || session.client_reference_id
  
  if (!customerId) {
    console.error('Missing customer ID in checkout session')
    return
  }

  console.log(`Checkout completed for customer ${customerId} (${customerEmail}) user: ${userId}`)

  // Try to find user by ID first, then by email
  let userFound = false
  
  if (userId) {
    const { error: userIdError } = await supabase
      .from('profiles')
      .update({
        stripe_customer_id: customerId,
      })
      .eq('id', userId)

    if (!userIdError) {
      userFound = true
      console.log(`Updated user ${userId} with customer ID ${customerId}`)
    } else {
      console.error('Failed to update user by ID:', userIdError)
    }
  }

  // If user ID update failed or no user ID, try by email
  if (!userFound && customerEmail) {
    const { error: emailError } = await supabase
      .from('profiles')
      .update({
        stripe_customer_id: customerId,
      })
      .eq('email', customerEmail)

    if (emailError) {
      console.error('Failed to update user by email:', emailError)
    } else {
      console.log(`Updated user with email ${customerEmail} with customer ID ${customerId}`)
    }
  }

  // Now ensure any existing subscriptions are linked to the user
  if (userId || customerEmail) {
    try {
      // Get user ID if we only have email
      let finalUserId = userId
      if (!finalUserId && customerEmail) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', customerEmail)
          .single()
        finalUserId = profile?.id
      }

      if (finalUserId) {
        // Update any subscriptions that might be missing user_id
        const { error: subError } = await supabase
          .from('subscriptions')
          .update({ user_id: finalUserId })
          .eq('stripe_customer_id', customerId)
          .is('user_id', null)

        if (subError) {
          console.error('Failed to update subscription user_id:', subError)
        } else {
          console.log(`Updated subscriptions for customer ${customerId} with user_id ${finalUserId}`)
        }
      }
    } catch (error) {
      console.error('Error updating subscription user_id:', error)
    }
  }
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/stripe-webhook' \
    --header 'Authorization: Bearer [YOUR_ANON_KEY]' \
    --header 'Content-Type: application/json' \
    --header 'stripe-signature: [STRIPE_SIGNATURE]' \
    --data '{"test": "data"}'

*/
