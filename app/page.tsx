'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navigation } from '@/components/navigation'
import { CheckCircle, Zap, Shield, Users, Loader2, Check, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push('/dashboard')
      } else {
        setLoading(false)
      }
    }

    checkAuth()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              ✨ No Win, No Fee
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">
              Pitch Smart. <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Raise Fast.</span>
            </h1>
            <p className="text-lg leading-8 text-gray-600 max-w-3xl mx-auto mb-8">
              No Win, No Fee, AI-enabled platform designed to help founders in their journey to 
              raise venture capital funding and get a head start.
            </p>
            <div className="flex items-center justify-center gap-x-6 mb-12">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700" asChild>
                <Link href="/auth/register">Start Your Journey</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/make-ready">Learn More</Link>
              </Button>
            </div>
            
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">2,847+</div>
                <div className="text-sm text-gray-600">Startups helped</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">£12M+</div>
                <div className="text-sm text-gray-600">Funds raised</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">98%</div>
                <div className="text-sm text-gray-600">Success rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">3.2 weeks</div>
                <div className="text-sm text-gray-600">Average time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Model Section */}
      <section className="py-12 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Win, No Fee AI-Enabled Success Model
                </h3>
                <p className="text-gray-700 mb-4">
                  We only win when you do. Our AI-powered platform helps you create compelling pitch decks, 
                  connect with the right investors, and close deals faster. Pay only when you successfully raise funds.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>AI pitch deck creation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Investor matching</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Success-based pricing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Founders Choose Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Why Founders Choose Founders Pitch</h2>
            <p className="mt-4 text-lg text-gray-600">
              Everything you need to raise funds faster and smarter
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-2 hover:border-purple-200 transition-colors">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">AI-Curated Startup Marketing Guides</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Get personalized marketing strategies and guides tailored to your startup's needs using advanced AI technology.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-200 transition-colors">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg">AI-Enabled Investor Roadmap Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Smart roadmaps that guide you through the investor journey with AI-powered insights and recommendations.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-200 transition-colors">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">HMRC Advance Assurance for SEIS/EIS</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Complete HMRC compliance support with advance assurance applications for SEIS and EIS schemes.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-200 transition-colors">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle className="text-lg">Secure Pitch Page Builder</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Create professional, secure pitch pages that showcase your startup to potential investors with confidence.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Choose Your Plan</h2>
            <p className="mt-4 text-lg text-gray-600">
              Start for free. Scale as you succeed. Only pay when you raise funds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Popular Plan */}
            <Card className="relative border-2 border-gray-200">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Popular
                </span>
              </div>
              <CardHeader className="text-center pt-8">
                <CardTitle className="text-2xl font-bold">Popular</CardTitle>
                <div className="text-4xl font-bold text-gray-900 mt-4">£0</div>
                <p className="text-gray-600">Start completely free</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>AI-curated startup guides</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Investor roadmap tools</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Basic pitch page builder</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Community access</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Email support</span>
                  </div>
                </div>
                <Button className="w-full bg-blue-500 hover:bg-blue-600" asChild>
                  <Link href="/auth/register">Get Started Free</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="relative border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Pro</CardTitle>
                <div className="text-4xl font-bold text-gray-900 mt-4">7.5%</div>
                <p className="text-gray-600">Success fee only when funded</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Everything in Popular</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>HMRC SEIS/EIS advance assurance</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Secure Pitch Page Builder</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Direct Pitch Page Access - 12 months access</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Priority support</span>
                  </div>
                </div>
                <Button className="w-full bg-purple-600 hover:bg-purple-700" asChild>
                  <Link href="/auth/register">Upgrade to Pro</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-center space-x-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-green-800 font-medium">Success Guarantee</span>
              </div>
              <p className="text-green-700 text-sm mt-2">
                We only succeed when you do. No upfront costs, no hidden fees - just results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Trusted by Successful Founders</h2>
            <p className="mt-4 text-lg text-gray-600">
              Join thousands of entrepreneurs who have raised funding through our platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-2 border-gray-100">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-lg">SF</span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">Sarah Fox</CardTitle>
                    <p className="text-sm text-gray-600">TechStart CEO</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  "FoundersPitch helped us raise our first £500K in just 6 weeks. The AI-powered pitch deck was incredible and the investor connections were exactly what we needed."
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-100">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-lg">JC</span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">James Chen</CardTitle>
                    <p className="text-sm text-gray-600">GreenTech Founder</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  "The no-win-no-fee model gave us confidence to start our fundraising journey. We raised £1.2M and the SEIS/EIS support was invaluable."
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-100">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-lg">MP</span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">Maria Patel</CardTitle>
                    <p className="text-sm text-gray-600">HealthTech Founder</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  "Outstanding platform. The AI guidance and investor matching helped us secure funding 3x faster than traditional methods. Highly recommended!"
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Fundraising Journey?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join thousands of UK founders who have successfully raised funding through our platform.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/auth/register">Get Started Today</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Image 
                src="/arrow logo.png" 
                alt="FoundersPitch Logo" 
                width={30} 
                height={30} 
                className="h-12"
              />
            </div>
            <p className="text-gray-400 mb-4">
              No Win, No Fee, AI-Enabled fundraising for UK startups
            </p>
            <p className="text-sm text-gray-500">
              © 2024 FoundersPitch. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
