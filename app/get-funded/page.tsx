'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navigation } from '@/components/navigation'

export default function GetFundedPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Get Funded</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect with verified investors through secure, professional pitch pages. 
            Available after your Advance Assurance approval.
          </p>
        </div>

        {/* Process Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <span className="text-3xl">📄</span>
              </div>
              <CardTitle>1. Get Approved</CardTitle>
              <CardDescription>
                Complete your Advance Assurance application and receive approval
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <span className="text-3xl">📊</span>
              </div>
              <CardTitle>2. Create Pitch Page</CardTitle>
              <CardDescription>
                Build your investor-facing pitch page with video, documents, and key metrics
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <span className="text-3xl">👥</span>
              </div>
              <CardTitle>3. Connect with Investors</CardTitle>
              <CardDescription>
                Share your secure pitch URL with verified investors and start fundraising
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Investor Network */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Investor Network</h2>
            <p className="text-lg text-gray-600">
              Connect with verified investors actively looking for opportunities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <span className="text-5xl mb-4">🛡️</span>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">High Net Worth Individuals</h3>
              <p className="text-gray-600">
                Verified HNW individuals with £250k+ net assets or £100k+ annual income
              </p>
            </div>

            <div className="text-center">
              <span className="text-5xl mb-4">📈</span>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sophisticated Investors</h3>
              <p className="text-gray-600">
                Professional investors with extensive experience in private equity and VC
              </p>
            </div>

            <div className="text-center">
              <span className="text-5xl mb-4">👥</span>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Angel Networks & VCs</h3>
              <p className="text-gray-600">
                Representatives from established angel networks and venture capital firms
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Secure Pitch Pages</CardTitle>
              <CardDescription>
                Professional, secure pages designed for investor engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <span className="mr-3">✅</span>
                  <span className="text-gray-700">Unique secure URLs for each pitch</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-3">✅</span>
                  <span className="text-gray-700">Investor verification required</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-3">✅</span>
                  <span className="text-gray-700">Professional design and layout</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-3">✅</span>
                  <span className="text-gray-700">Mobile-optimized viewing</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compliance & Security</CardTitle>
              <CardDescription>
                FCA-compliant investor verification and data protection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <span className="mr-3">✅</span>
                  <span className="text-gray-700">FCA-compliant investor verification</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-3">✅</span>
                  <span className="text-gray-700">GDPR-compliant data handling</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-3">✅</span>
                  <span className="text-gray-700">Secure document storage</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-3">✅</span>
                  <span className="text-gray-700">Audit trail for compliance</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Success Fee */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-white text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">No Win, No Fee</h2>
          <p className="text-xl mb-6">
            We only succeed when you do. No upfront costs, just a 7.5% success fee on funds raised.
          </p>
          <div className="flex items-center justify-center space-x-8">
            <div>
              <p className="text-2xl font-bold">0%</p>
              <p className="text-purple-100">Upfront Fees</p>
            </div>
            <div>
              <p className="text-2xl font-bold">7.5%</p>
              <p className="text-purple-100">Success Fee Only</p>
            </div>
            <div>
              <p className="text-2xl font-bold">100%</p>
              <p className="text-purple-100">Aligned Interests</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Begin your fundraising journey with your Advance Assurance application
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Button size="lg" asChild>
              <Link href="/make-ready">
                Start Application
                <span className="ml-2">➡️</span>
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
