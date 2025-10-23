'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navigation } from '@/components/navigation'
import { CheckCircle, Zap, Shield, Users, Loader2 } from 'lucide-react'
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
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Raise Smart. Raise Fast.
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              No Win, No Fee, AI-Enabled fundraising platform designed to help UK startup founders 
              become investor-ready and connect directly with verified investors.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" asChild>
                <Link href="/auth/register">Start Your Journey</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/make-ready">Learn More</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              ✨ <strong>We only win when you do.</strong> No upfront fees, 7.5% success fee only.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose FoundersPitch?</h2>
            <p className="mt-4 text-lg text-gray-600">
              The complete fundraising solution for UK startups
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardHeader>
                <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle className="text-lg">No Win, No Fee</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Start for free. Only pay when you successfully raise funds. 
                  7.5% success fee, no upfront costs.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle className="text-lg">AI-Powered</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Smart form completion, document review, and pitch optimization 
                  powered by advanced AI technology.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle className="text-lg">SEIS/EIS Ready</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Complete HMRC Advance Assurance application support with 
                  full regulatory compliance.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-indigo-600 mb-2" />
                <CardTitle className="text-lg">Verified Investors</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Connect with verified High Net Worth, Sophisticated, 
                  and Angel investors through secure pitch pages.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Simple 3-Step Process</h2>
            <p className="mt-4 text-lg text-gray-600">
              From application to funding in three easy steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-purple-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Make Ready</h3>
              <p className="text-gray-600">
                Complete your SEIS/EIS Advance Assurance application with our guided process 
                and AI assistance.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Approved</h3>
              <p className="text-gray-600">
                Our team reviews your application and submits it to HMRC for 
                Advance Assurance approval.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Funded</h3>
              <p className="text-gray-600">
                Create your investor pitch page and connect with verified investors 
                ready to fund your startup.
              </p>
            </div>
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
            Join hundreds of UK founders who have successfully raised funding through our platform.
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
