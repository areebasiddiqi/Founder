'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  Crown, 
  Zap, 
  Building2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { PLANS } from '@/lib/stripe';

export default function PricingPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    checkUserAndSubscription();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Pricing page - Auth state change:', { event, session });
        setUser(session?.user ?? null);
        if (session?.user) {
          // Reload subscription data when user logs in
          checkUserAndSubscription();
        } else {
          setSubscription(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkUserAndSubscription = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Pricing page - User check:', { user, userError });
      setUser(user);

      if (user) {
        const { data: sub, error: subError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        console.log('Pricing page - Subscription check:', { sub, subError });
        setSubscription(sub);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planType: string, priceId: string) => {
    if (!user) {
      alert('Please log in to upgrade your subscription');
      router.push('/auth/login?redirect=/pricing');
      return;
    }

    setSubscribing(planType);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/dashboard?success=subscription`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        console.error('Failed to create checkout session:', data.error);
        alert('Failed to start checkout. Please try again.');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setSubscribing(null);
    }
  };

  const isCurrentPlan = (planType: string) => {
    if (!subscription) return planType === 'FREE';
    return subscription.plan_type === planType.toLowerCase();
  };

  const canUpgrade = (planType: string) => {
    if (!user) return true;
    if (!subscription) return planType !== 'FREE';
    
    const currentPlan = subscription.plan_type;
    if (currentPlan === 'free' && planType !== 'FREE') return true;
    if (currentPlan === 'ai_enabled' && planType === 'SEIS_EIS_PLAN') return true;
    
    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From basic pitch creation to full SEIS/EIS agent services, 
            we have the right plan to help you raise funding successfully.
          </p>
        </div>

        {/* Current Subscription Alert */}
        {subscription && subscription.status === 'active' && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-green-800">
                You currently have an active <strong>{subscription.plan_type.replace('_', ' ').toUpperCase()}</strong> subscription.
              </span>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {PLANS.FREE.name}
                  </CardTitle>
                  <CardDescription>Perfect for getting started</CardDescription>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold">£{PLANS.FREE.price}</span>
                <span className="text-gray-600">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {PLANS.FREE.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                variant={isCurrentPlan('FREE') ? 'secondary' : 'outline'}
                className="w-full"
                disabled={isCurrentPlan('FREE')}
              >
                {isCurrentPlan('FREE') ? 'Current Plan' : 'Get Started'}
              </Button>
            </CardContent>
          </Card>

          {/* AI-Enabled Plan */}
          <Card className="relative border-blue-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    {PLANS.AI_ENABLED.name}
                  </CardTitle>
                  <CardDescription>AI-powered fundraising tools</CardDescription>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Popular</Badge>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold">£{PLANS.AI_ENABLED.price}</span>
                <span className="text-gray-600">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {PLANS.AI_ENABLED.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                variant={isCurrentPlan('AI_ENABLED') ? 'secondary' : 'default'}
                className="w-full"
                disabled={isCurrentPlan('AI_ENABLED') || subscribing === 'AI_ENABLED'}
                onClick={() => handleSubscribe('AI_ENABLED', PLANS.AI_ENABLED.priceId)}
              >
                {subscribing === 'AI_ENABLED' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : isCurrentPlan('AI_ENABLED') ? (
                  'Current Plan'
                ) : canUpgrade('AI_ENABLED') ? (
                  'Upgrade Now'
                ) : (
                  'Subscribe'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* SEIS/EIS Plan */}
          <Card className="relative border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-purple-600 text-white">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            </div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-purple-600" />
                    {PLANS.SEIS_EIS_PLAN.name}
                  </CardTitle>
                  <CardDescription>Full SEIS/EIS agent service</CardDescription>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold">£{PLANS.SEIS_EIS_PLAN.price}</span>
                <span className="text-gray-600">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {PLANS.SEIS_EIS_PLAN.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                variant={isCurrentPlan('SEIS_EIS_PLAN') ? 'secondary' : 'default'}
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={isCurrentPlan('SEIS_EIS_PLAN') || subscribing === 'SEIS_EIS_PLAN'}
                onClick={() => handleSubscribe('SEIS_EIS_PLAN', PLANS.SEIS_EIS_PLAN.priceId)}
              >
                {subscribing === 'SEIS_EIS_PLAN' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : isCurrentPlan('SEIS_EIS_PLAN') ? (
                  'Current Plan'
                ) : canUpgrade('SEIS_EIS_PLAN') ? (
                  'Upgrade Now'
                ) : (
                  'Subscribe'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* SEIS/EIS Information */}
        <div className="bg-white rounded-lg p-8 shadow-sm border">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Why Choose Our SEIS/EIS Agent Service?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What We Handle For You</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Complete HMRC application preparation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Document validation and compilation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Eligibility assessment and guidance</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Ongoing compliance monitoring</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Direct HMRC communication as your agent</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">SEIS/EIS Benefits</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Up to 50% tax relief for investors (SEIS)</span>
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Up to 30% tax relief for investors (EIS)</span>
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Capital gains tax deferral</span>
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Inheritance tax relief after 2 years</span>
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Loss relief if investment fails</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-2">
                What's included in the SEIS/EIS service?
              </h3>
              <p className="text-gray-600 text-sm">
                Complete end-to-end management of your SEIS/EIS Advance Assurance application, 
                including document preparation, HMRC submission, and ongoing compliance tracking.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-2">
                How long does the application process take?
              </h3>
              <p className="text-gray-600 text-sm">
                HMRC typically responds to Advance Assurance applications within 30 days. 
                We'll handle all follow-ups and keep you updated throughout the process.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-gray-600 text-sm">
                Yes, you can cancel your subscription at any time. You'll continue to have 
                access until the end of your current billing period.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-2">
                What if my application is rejected?
              </h3>
              <p className="text-gray-600 text-sm">
                We'll work with you to understand the reasons and help prepare a revised 
                application. Our service includes ongoing support throughout the process.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
