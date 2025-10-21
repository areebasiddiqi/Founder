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
  SEIS_EIS_PLAN: 'price_seis_eis_monthly', // Replace with actual Stripe price ID
}

export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    features: [
      'Basic pitch creation',
      'Investor browsing',
      'Email notifications',
    ],
  },
  AI_ENABLED: {
    name: 'AI-Enabled',
    price: 9,
    priceId: "price_1SKH7nPhoypBuKkN3LR4BJ6G",
    features: [
      'Everything in Free',
      'AI-powered form completion',
      'Document review assistance',
      'Priority support',
      'Advanced analytics',
    ],
  },
  SEIS_EIS_PLAN: {
    name: 'SEIS/EIS Agent Service',
    price: 9,
    priceId: "price_1SKH7nPhoypBuKkN3LR4BJ6G",
    features: [
      'Full SEIS/EIS application workflow',
      'Authorised agent representation',
      'Document validation & compilation',
      'HMRC submission management',
      'Compliance tracking & reminders',
      'Priority support',
    ],
  },
}
