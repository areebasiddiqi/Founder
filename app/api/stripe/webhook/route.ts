import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

// Use service role key for webhook handler
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  // Get the price ID to determine plan type
  const priceId = subscription.items.data[0]?.price.id;
  let planType = 'free';
  
  // Map price ID to plan type
  if (priceId === 'price_1SKH7nPhoypBuKkN3LR4BJ6G') {
    // This is the same price ID for both AI_ENABLED and SEIS_EIS_PLAN
    // You might want to use different price IDs or add metadata to distinguish
    planType = 'seis_eis_plan'; // Default to SEIS/EIS plan for now
  }

  const subscriptionData = {
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    status: subscription.status === 'active' ? 'active' : 'inactive',
    plan_type: planType,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  };

  // Update subscription in database
  const { error } = await supabase
    .from('subscriptions')
    .update(subscriptionData)
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Failed to update subscription:', error);
    throw error;
  }

  console.log(`Subscription ${subscription.id} updated for customer ${customerId}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      plan_type: 'free',
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Failed to update cancelled subscription:', error);
    throw error;
  }

  console.log(`Subscription ${subscription.id} cancelled for customer ${customerId}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  // Update subscription status to active on successful payment
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Failed to update subscription after payment:', error);
    throw error;
  }

  console.log(`Payment succeeded for customer ${customerId}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  // Update subscription status to inactive on failed payment
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'inactive',
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Failed to update subscription after failed payment:', error);
    throw error;
  }

  console.log(`Payment failed for customer ${customerId}`);
}
