'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

// Define plans locally since PLANS import might not exist
const PLANS = {
  FREE: {
    name: 'Free Plan',
    price: 0,
    features: [
      'Submit Advance Assurance applications',
      'Basic application tracking',
      'Email support',
      'Standard processing time'
    ],
    priceId: null
  },
  AI_ENABLED: {
    name: 'AI-Enabled Plan',
    price: 9,
    features: [
      'Everything in Free Plan',
      'AI-powered application review',
      'Smart document analysis',
      'Priority support',
      'Faster processing time'
    ],
    priceId: 'price_ai_enabled'
  }
}

interface Subscription {
  plan_type: string
  status: string
  current_period_end: string | null
}

export default function BillingPage() {
  const [loading, setLoading] = useState(false)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadSubscriptionData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          const { data: subscriptionData } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .single()
          
          setSubscription(subscriptionData)
        }
      } catch (error) {
        console.error('Error loading subscription data:', error)
      }
    }

    loadSubscriptionData()
  }, [])

  const handleUpgrade = async (priceId: string) => {
    setLoading(true)
    
    try {
      if (!user) {
        alert('Please log in to upgrade your subscription')
        return
      }
      
      // For now, just update the subscription in the database
      // In a real app, this would integrate with Stripe
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          plan_type: 'ai_enabled',
          status: 'active'
        })
        .eq('user_id', user.id)
      
      if (error) throw error
      
      // Reload subscription data
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      setSubscription(subscriptionData)
      alert('Subscription upgraded successfully!')
      
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to upgrade subscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-600">Manage your subscription and billing preferences</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Your current subscription status and usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold capitalize">{subscription?.plan_type || 'free'} Plan</h3>
              <p className="text-gray-600">
                {subscription?.plan_type === 'free' ? 'No monthly charge' : '£9/month'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Next billing date</p>
              <p className="font-medium">
                {subscription?.plan_type === 'free' || !subscription?.current_period_end ? 
                  'N/A' : 
                  new Date(subscription.current_period_end).toLocaleDateString()
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <Card className={subscription?.plan_type === 'free' ? 'ring-2 ring-purple-500' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="mr-2 text-xl">✅</span>
              {PLANS.FREE.name}
            </CardTitle>
            <CardDescription>
              Perfect for getting started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <span className="text-3xl font-bold">£{PLANS.FREE.price}</span>
              <span className="text-gray-600">/month</span>
            </div>
            
            <ul className="space-y-2 mb-6">
              {PLANS.FREE.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <span className="mr-2">✅</span>
                  {feature}
                </li>
              ))}
            </ul>

            {subscription?.plan_type === 'free' ? (
              <Button disabled className="w-full">
                Current Plan
              </Button>
            ) : (
              <Button variant="outline" className="w-full">
                Downgrade
              </Button>
            )}
          </CardContent>
        </Card>

        {/* AI-Enabled Plan */}
        <Card className={subscription?.plan_type === 'ai_enabled' ? 'ring-2 ring-purple-500' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="mr-2 text-xl">⚡</span>
              {PLANS.AI_ENABLED.name}
              <span className="ml-2 text-lg">👑</span>
            </CardTitle>
            <CardDescription>
              Unlock AI-powered features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <span className="text-3xl font-bold">£{PLANS.AI_ENABLED.price}</span>
              <span className="text-gray-600">/month</span>
            </div>
            
            <ul className="space-y-2 mb-6">
              {PLANS.AI_ENABLED.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <span className="mr-2">✅</span>
                  {feature}
                </li>
              ))}
            </ul>

            {subscription?.plan_type === 'ai_enabled' ? (
              <Button disabled className="w-full">
                Current Plan
              </Button>
            ) : (
              <Button 
                className="w-full" 
                onClick={() => handleUpgrade(PLANS.AI_ENABLED.priceId!)}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Upgrade Now'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Success Fee Information */}
      <Card>
        <CardHeader>
          <CardTitle>Success Fee Structure</CardTitle>
          <CardDescription>
            Our "No Win, No Fee" model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <h4 className="font-medium text-green-900">Success Fee</h4>
                <p className="text-sm text-green-700">Only charged when you successfully raise funds</p>
              </div>
              <div className="text-2xl font-bold text-green-900">7.5%</div>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>
                <strong>How it works:</strong> We only charge a success fee when you successfully 
                raise investment through our platform. No upfront costs, no hidden fees.
              </p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>7.5% fee on successfully raised funds</li>
                <li>No charge if fundraising is unsuccessful</li>
                <li>Transparent billing with detailed invoices</li>
                <li>Payment due within 30 days of fund receipt</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            Your recent transactions and invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No billing history available</p>
            <p className="text-sm">Transactions will appear here once you have an active subscription</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
