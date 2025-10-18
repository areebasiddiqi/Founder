import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export const getStripe = () => {
  if (typeof window !== 'undefined') {
    const stripePromise = import('@stripe/stripe-js').then(({ loadStripe }) =>
      loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
    )
    return stripePromise
  }
  return null
}

export const PRICE_IDS = {
  AI_ENABLED: 'price_ai_enabled_monthly', // Replace with actual Stripe price ID
}

export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    features: [
      'Advance Assurance application',
      'Basic support',
      'Email notifications',
    ],
  },
  AI_ENABLED: {
    name: 'AI-Enabled',
    price: 9,
    priceId: PRICE_IDS.AI_ENABLED,
    features: [
      'Everything in Free',
      'AI-powered form completion',
      'Document review assistance',
      'Priority support',
      'Advanced analytics',
    ],
  },
}
