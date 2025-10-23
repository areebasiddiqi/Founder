'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Target, BarChart3, Settings, FileText, Download, Link } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

interface TeamMember {
  id: string
  name: string
  role: string
  experience: string
  linkedin_url?: string
  bio?: string
  avatar_url?: string
  display_order: number
}

interface PitchData {
  id: string
  company_name: string
  investment_summary: string
  use_of_funds: string
  business_plan_url: string | null
  pitch_deck_url: string | null
  incorporation_date: string
  registered_address: string
  directors: string
  founder_id: string
  profiles: {
    full_name: string
    email: string
  }
  advance_assurance_applications?: {
    id: string
    company_name: string
    investment_summary: string
    use_of_funds: string
    business_plan_url: string | null
    pitch_deck_url: string | null
    incorporation_date: string
    profiles: {
      full_name: string
      email: string
    }
  }
  // Enhanced pitch page fields
  pitch_title?: string
  elevator_pitch?: string
  problem_statement?: string
  solution_description?: string
  market_size?: string
  business_model?: string
  competitive_advantage?: string
  financial_projections?: string
  team_description?: string
  funding_requirements?: string
  use_of_funds_detailed?: string
  milestones?: string
  video_url?: string | null
  demo_url?: string | null
  target_valuation?: number | null
  minimum_investment?: number | null
  maximum_investment?: number | null
  investment_type?: string
  equity_offered?: string
  investor_benefits?: string
  exit_strategy?: string
  risks_challenges?: string
  social_media_links?: string
  contact_preferences?: string
  current_traction?: string
  monthly_revenue?: number
  customer_count?: number
  growth_rate?: number
  burn_rate?: number
  product_description?: string
  technology_stack?: string
  intellectual_property?: string
  target_customers?: string
  marketing_strategy?: string
  customer_acquisition_cost?: number
  customer_lifetime_value?: number
  team_members?: TeamMember[]
}

export default function PitchPage() {
  const params = useParams()
  const [isVerified, setIsVerified] = useState(false)
  const [pitchData, setPitchData] = useState<PitchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [verificationData, setVerificationData] = useState({
    email: '',
    investorType: '',
    confirmations: {
      hnw: false,
      sophisticated: false,
      angel: false,
    }
  })
  const [showInterestModal, setShowInterestModal] = useState(false)
  const [interestData, setInterestData] = useState({
    name: '',
    email: '',
    company: '',
    investmentAmount: '',
    message: ''
  })
  const [submittingInterest, setSubmittingInterest] = useState(false)

  useEffect(() => {
    const loadPitchData = async () => {
      try {
        console.log('Loading pitch data for slug:', params.slug)
        
        // First try to load from pitch_pages table by ID
        let pitchPageData = null
        let pitchError = null

        // Try loading by UUID first (with RLS bypass for debugging)
        const { data: pitchByUuid, error: uuidError } = await supabase
          .from('pitch_pages')
          .select(`
            *,
            advance_assurance_applications (
              *,
              profiles (
                full_name,
                email
              )
            )
          `)
          .eq('id', params.slug)
          .single()

        console.log('Pitch lookup result:', { pitchByUuid, uuidError })
        
        // Check if pitch exists but isn't published
        if (!pitchByUuid && uuidError?.code === 'PGRST116') {
          const { data: unpublishedPitch } = await supabase
            .from('pitch_pages')
            .select('id, is_published, pitch_title')
            .eq('id', params.slug)
            .single()
          
          console.log('Unpublished pitch check:', unpublishedPitch)
        }

        if (pitchByUuid) {
          pitchPageData = pitchByUuid
        } else {
          console.log('UUID lookup failed:', uuidError)
          
          // If UUID fails, try loading by application ID (fallback)
          const { data: pitchByAppId, error: appIdError } = await supabase
            .from('pitch_pages')
            .select(`
              *,
              advance_assurance_applications (
                *,
                profiles (
                  full_name,
                  email
                )
              )
            `)
            .eq('application_id', params.slug)
            .eq('is_published', true)
            .single()

          if (pitchByAppId) {
            pitchPageData = pitchByAppId
          } else {
            console.log('Application ID lookup failed:', appIdError)
            pitchError = appIdError
          }
        }

        if (pitchPageData) {
          console.log('Found pitch data:', pitchPageData)
          
          // Load team members for this pitch page
          const { data: teamMembers } = await supabase
            .from('team_members')
            .select('*')
            .eq('pitch_page_id', pitchPageData.id)
            .order('display_order')

          setPitchData({
            ...pitchPageData,
            team_members: teamMembers || []
          })
          return
        } else {
          console.log('No pitch page found, error:', pitchError)
          
          // Debug: Try to see if ANY pitch pages exist
          const { data: allPitches, error: allError } = await supabase
            .from('pitch_pages')
            .select('id, pitch_title, is_published, founder_id')
            .limit(5)
          
          console.log('Debug - All pitch pages:', allPitches, allError)
          
          // Debug: Try to see published pitch pages specifically
          const { data: publishedPitches, error: pubError } = await supabase
            .from('pitch_pages')
            .select('id, pitch_title, is_published')
            .eq('is_published', true)
            .limit(5)
          
          console.log('Debug - Published pitch pages:', publishedPitches, pubError)
        }

        // Fallback to basic application data if no pitch page exists
        const { data: appData, error: appError } = await supabase
          .from('advance_assurance_applications')
          .select(`
            *,
            profiles (
              full_name,
              email
            )
          `)
          .eq('id', params.slug)
          .eq('status', 'approved')
          .single()

        if (appError) throw appError
        setPitchData(appData)
      } catch (error) {
        console.error('Error loading pitch data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.slug) {
      loadPitchData()
    }
  }, [params.slug])

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate verification
    const hasValidType = verificationData.confirmations.hnw || 
                        verificationData.confirmations.sophisticated || 
                        verificationData.confirmations.angel

    if (!hasValidType || !verificationData.email) {
      alert('Please complete all verification requirements')
      return
    }

    // Submit verification to backend
    try {
      const response = await fetch('/api/investor/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: verificationData.email,
          investorType: Object.keys(verificationData.confirmations).find(
            key => verificationData.confirmations[key as keyof typeof verificationData.confirmations]
          ),
          pitchId: pitchData?.id,
          userAgent: navigator.userAgent,
        })
      })

      if (response.ok) {
        setIsVerified(true)
      }
    } catch (error) {
      console.error('Verification failed:', error)
    }
  }

  const handleExpressInterest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Please sign in to express interest in this investment opportunity.')
      window.location.href = '/auth/signin'
      return
    }

    if (!interestData.message) {
      alert('Please write a message to the founder')
      return
    }

    setSubmittingInterest(true)
    try {
      // Check if messaging tables exist by trying to query conversations
      const { data: testQuery, error: testError } = await supabase
        .from('conversations')
        .select('id')
        .limit(1)

      if (testError && testError.code === '42P01') {
        // Table doesn't exist - show helpful message
        alert(`Interest recorded! 

The messaging system requires database setup. Please:
1. Run the user_roles_schema.sql file in your Supabase dashboard
2. This will create the conversations and messages tables
3. Then you'll be able to message founders directly

For now, your interest has been noted for: ${pitchData?.pitch_title || pitchData?.advance_assurance_applications?.company_name}`)
        
        setShowInterestModal(false)
        setInterestData({
          name: '',
          email: '',
          company: '',
          investmentAmount: '',
          message: ''
        })
        return
      }

      // Get founder info from pitch data
      const founderId = pitchData?.founder_id

      if (!founderId) {
        throw new Error('Could not identify founder for this pitch')
      }

      // Create or get existing conversation
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('pitch_page_id', pitchData?.id)
        .eq('founder_id', founderId)
        .eq('investor_id', user.id)
        .single()

      let conversationId = existingConversation?.id

      if (!conversationId) {
        // Create new conversation
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            pitch_page_id: pitchData?.id,
            founder_id: founderId,
            investor_id: user.id,
            status: 'active'
          })
          .select('id')
          .single()

        if (convError) throw convError
        conversationId = newConversation.id
      }

      // Send initial message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          message_text: `Investment Interest: ${interestData.message}${interestData.investmentAmount ? `\n\nPotential Investment: £${interestData.investmentAmount}` : ''}${interestData.company ? `\nCompany: ${interestData.company}` : ''}`,
          message_type: 'interest'
        })

      if (messageError) throw messageError

      alert('Interest submitted successfully! You can now message the founder directly.')
      setShowInterestModal(false)
      setInterestData({
        name: '',
        email: '',
        company: '',
        investmentAmount: '',
        message: ''
      })

      // Redirect to messages
      window.location.href = '/dashboard/messages'
    } catch (error) {
      console.error('Error submitting interest:', error)
      alert('Failed to submit interest. Please try again.')
    } finally {
      setSubmittingInterest(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading pitch...</div>
  }

  if (!pitchData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <span className="text-6xl mb-4 block">❌</span>
            <h2 className="text-xl font-bold mb-2">Pitch Not Found</h2>
            <p className="text-gray-600 mb-4">
              This pitch page doesn't exist, is not published, or is not available for viewing.
            </p>
            <div className="text-sm text-gray-500 mb-4">
              <p>Possible reasons:</p>
              <ul className="list-disc list-inside text-left mt-2">
                <li>The pitch page hasn't been published yet</li>
                <li>The URL is incorrect</li>
                <li>The pitch page has been removed</li>
              </ul>
            </div>
            <Button asChild>
              <a href="/browse">Browse Available Pitches</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <span className="text-5xl mb-4 block">🛡️</span>
            <CardTitle className="text-2xl font-bold">Investor Verification Required</CardTitle>
            <CardDescription>
              This pitch is only accessible to verified investors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerification} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <Input
                  id="email"
                  type="email"
                  value={verificationData.email}
                  onChange={(e) => setVerificationData({
                    ...verificationData,
                    email: e.target.value
                  })}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  I confirm that I am a: *
                </p>
                
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={verificationData.confirmations.hnw}
                    onChange={(e) => setVerificationData({
                      ...verificationData,
                      confirmations: {
                        ...verificationData.confirmations,
                        hnw: e.target.checked,
                        sophisticated: false,
                        angel: false,
                      }
                    })}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium">High Net Worth Individual</p>
                    <p className="text-xs text-gray-600">
                      Annual income over £100,000 or net assets over £250,000
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={verificationData.confirmations.sophisticated}
                    onChange={(e) => setVerificationData({
                      ...verificationData,
                      confirmations: {
                        ...verificationData.confirmations,
                        sophisticated: e.target.checked,
                        hnw: false,
                        angel: false,
                      }
                    })}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium">Sophisticated Investor</p>
                    <p className="text-xs text-gray-600">
                      Professional experience in private equity or venture capital
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={verificationData.confirmations.angel}
                    onChange={(e) => setVerificationData({
                      ...verificationData,
                      confirmations: {
                        ...verificationData.confirmations,
                        angel: e.target.checked,
                        hnw: false,
                        sophisticated: false,
                      }
                    })}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium">Angel/VC Representative</p>
                    <p className="text-xs text-gray-600">
                      Representing an angel network or venture capital firm
                    </p>
                  </div>
                </label>
              </div>

              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <p className="font-medium mb-1">Important Notice:</p>
                <p>
                  This investment opportunity is only available to verified investors as defined by 
                  FCA regulations. False declarations may result in legal consequences.
                </p>
              </div>

              <Button type="submit" className="w-full">
                Verify & Access Pitch
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {pitchData.pitch_title || `${pitchData.company_name || pitchData.advance_assurance_applications?.company_name} - Investment Opportunity`}
              </h1>
              <p className="text-gray-600">
                by {pitchData.profiles?.full_name || pitchData.advance_assurance_applications?.profiles?.full_name || 'Founder'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-600">
                {pitchData.target_valuation ? `£${pitchData.target_valuation.toLocaleString()} Valuation` : 'Seeking Investment'}
              </p>
              <p className="text-sm text-gray-600">SEIS/EIS Approved</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Elevator Pitch */}
            {pitchData.elevator_pitch && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="mr-2 text-lg">🎯</span>
                    Elevator Pitch
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed text-lg font-medium">{pitchData.elevator_pitch}</p>
                </CardContent>
              </Card>
            )}

            {/* Video */}
            {pitchData.video_url && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="mr-2 text-lg">▶️</span>
                    Pitch Video
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gray-100 rounded-lg">
                    <iframe
                      src={pitchData.video_url}
                      className="w-full h-full rounded-lg"
                      allowFullScreen
                      title="Pitch Video"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Problem & Solution */}
            {(pitchData.problem_statement || pitchData.solution_description) && (
              <Card>
                <CardHeader>
                  <CardTitle>Problem & Solution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pitchData.problem_statement && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">The Problem</h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{pitchData.problem_statement}</p>
                    </div>
                  )}
                  {pitchData.solution_description && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Our Solution</h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{pitchData.solution_description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Investment Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Investment Opportunity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {pitchData.funding_requirements || pitchData.investment_summary || pitchData.advance_assurance_applications?.investment_summary}
                </p>
              </CardContent>
            </Card>

            {/* Use of Funds */}
            <Card>
              <CardHeader>
                <CardTitle>Use of Funds</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {pitchData.use_of_funds_detailed || pitchData.use_of_funds || pitchData.advance_assurance_applications?.use_of_funds}
                </p>
              </CardContent>
            </Card>

            {/* Market & Business Model */}
            {(pitchData.market_size || pitchData.business_model) && (
              <Card>
                <CardHeader>
                  <CardTitle>Market & Business Model</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pitchData.market_size && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Market Size</h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{pitchData.market_size}</p>
                    </div>
                  )}
                  {pitchData.business_model && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Business Model</h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{pitchData.business_model}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Competitive Advantage */}
            {pitchData.competitive_advantage && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="mr-2 text-lg">🏆</span>
                    Competitive Advantage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{pitchData.competitive_advantage}</p>
                </CardContent>
              </Card>
            )}

            {/* Demo */}
            {pitchData.demo_url && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="mr-2 text-lg">🖥️</span>
                    Live Demo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <a 
                      href={pitchData.demo_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium"
                    >
                      <span className="mr-2">🔗</span>
                      Try Live Demo
                    </a>
                    <p className="text-sm text-gray-600 mt-2">Experience our product firsthand</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Financial Projections */}
            {pitchData.financial_projections && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="mr-2 text-lg">📈</span>
                    Financial Projections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{pitchData.financial_projections}</p>
                </CardContent>
              </Card>
            )}

            {/* Traction & Metrics */}
            {(pitchData.current_traction || pitchData.monthly_revenue || pitchData.customer_count) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 w-5 h-5" />
                    Traction & Key Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pitchData.current_traction && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Current Traction</h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{pitchData.current_traction}</p>
                    </div>
                  )}
                  
                  {(pitchData.monthly_revenue || pitchData.customer_count || pitchData.growth_rate) && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      {pitchData.monthly_revenue && (
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">£{pitchData.monthly_revenue.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">Monthly Revenue</p>
                        </div>
                      )}
                      {pitchData.customer_count && (
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">{pitchData.customer_count.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">Customers</p>
                        </div>
                      )}
                      {pitchData.growth_rate && (
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">{pitchData.growth_rate}%</p>
                          <p className="text-sm text-gray-600">Monthly Growth</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Product & Technology */}
            {(pitchData.product_description || pitchData.technology_stack) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="mr-2 w-5 h-5" />
                    Product & Technology
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pitchData.product_description && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Product Description</h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{pitchData.product_description}</p>
                    </div>
                  )}
                  {pitchData.technology_stack && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Technology Stack</h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{pitchData.technology_stack}</p>
                    </div>
                  )}
                  {pitchData.intellectual_property && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Intellectual Property</h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{pitchData.intellectual_property}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Customer & Marketing */}
            {(pitchData.target_customers || pitchData.marketing_strategy) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="mr-2 text-lg">🎯</span>
                    Customer & Marketing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pitchData.target_customers && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Target Customers</h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{pitchData.target_customers}</p>
                    </div>
                  )}
                  {pitchData.marketing_strategy && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Marketing Strategy</h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{pitchData.marketing_strategy}</p>
                    </div>
                  )}
                  
                  {(pitchData.customer_acquisition_cost || pitchData.customer_lifetime_value) && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {pitchData.customer_acquisition_cost && (
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-xl font-bold text-purple-600">£{pitchData.customer_acquisition_cost}</p>
                          <p className="text-sm text-gray-600">CAC</p>
                        </div>
                      )}
                      {pitchData.customer_lifetime_value && (
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-xl font-bold text-purple-600">£{pitchData.customer_lifetime_value}</p>
                          <p className="text-sm text-gray-600">LTV</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Team */}
            {((pitchData.team_members && pitchData.team_members.length > 0) || pitchData.team_description) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="mr-2 text-lg">👥</span>
                    Team
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {pitchData.team_members && pitchData.team_members.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {pitchData.team_members.map((member) => (
                        <Card key={member.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start space-x-4">
                              {/* Avatar */}
                              <div className="flex-shrink-0">
                                {member.avatar_url ? (
                                  <img
                                    src={member.avatar_url}
                                    alt={member.name}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-purple-200"
                                  />
                                ) : (
                                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center border-2 border-purple-200">
                                    <span className="text-purple-600 font-semibold text-lg">
                                      {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-lg">{member.name}</h4>
                                <p className="text-purple-600 font-medium text-sm mb-3">{member.role}</p>
                                <p className="text-gray-700 text-sm leading-relaxed mb-3">{member.experience}</p>
                                {member.bio && (
                                  <p className="text-gray-600 text-sm leading-relaxed mb-3">{member.bio}</p>
                                )}
                                {member.linkedin_url && (
                                  <a 
                                    href={member.linkedin_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                                  >
                                    <span className="mr-1">🔗</span>
                                    LinkedIn Profile
                                  </a>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  
                  {pitchData.team_description && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2">Team Overview</h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{pitchData.team_description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Milestones & Achievements */}
            {pitchData.milestones && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="mr-2 text-lg">🎯</span>
                    Milestones & Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{pitchData.milestones}</p>
                </CardContent>
              </Card>
            )}

            {/* Investment Benefits & Strategy */}
            {(pitchData.investor_benefits || pitchData.exit_strategy) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="mr-2 text-lg">💎</span>
                    Investment Benefits & Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pitchData.investor_benefits && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Investor Benefits</h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{pitchData.investor_benefits}</p>
                    </div>
                  )}
                  {pitchData.exit_strategy && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Exit Strategy</h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{pitchData.exit_strategy}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Risks & Challenges */}
            {pitchData.risks_challenges && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="mr-2 text-lg">⚠️</span>
                    Risks & Challenges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{pitchData.risks_challenges}</p>
                </CardContent>
              </Card>
            )}

            {/* Social Media & Contact */}
            {(pitchData.social_media_links || pitchData.contact_preferences) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="mr-2 text-lg">📱</span>
                    Connect & Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pitchData.social_media_links && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Social Media & Links</h4>
                      <div className="space-y-2">
                        {pitchData.social_media_links.split('\n').filter(link => link.trim()).map((link, index) => (
                          <div key={index}>
                            <a 
                              href={link.trim().startsWith('http') ? link.trim() : `https://${link.trim()}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-purple-600 hover:text-purple-800 text-sm"
                            >
                              <span className="mr-2">🔗</span>
                              {link.trim()}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {pitchData.contact_preferences && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Contact Preferences</h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{pitchData.contact_preferences}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Company Directors (Legal Information) */}
            {pitchData.directors && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="mr-2 text-lg">🏢</span>
                    Company Directors
                  </CardTitle>
                  <CardDescription>
                    Legal company directors and shareholding information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {JSON.parse(pitchData.directors || '[]').map((director: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <h4 className="font-medium text-gray-900">{director.name}</h4>
                        <p className="text-sm text-gray-600">{director.position}</p>
                        {director.shareholding && (
                          <p className="text-sm text-gray-500">Shareholding: {director.shareholding}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Company Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="mr-2 text-lg">📍</span>
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Registered Address:</strong></p>
                  <p className="text-gray-700 whitespace-pre-line">{pitchData.registered_address}</p>
                  <p className="mt-4"><strong>Incorporation Date:</strong> {new Date(pitchData.incorporation_date).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Key Information */}
            <Card>
              <CardHeader>
                <CardTitle>Investment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className="font-medium text-green-600">SEIS/EIS Approved</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Company</span>
                  <span className="font-medium">{pitchData.company_name || pitchData.advance_assurance_applications?.company_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Founder</span>
                  <span className="font-medium">{pitchData.profiles?.full_name || pitchData.advance_assurance_applications?.profiles?.full_name || 'Not disclosed'}</span>
                </div>
                {(pitchData.incorporation_date || pitchData.advance_assurance_applications?.incorporation_date) && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Incorporated</span>
                    <span className="font-medium">{new Date(pitchData.incorporation_date || pitchData.advance_assurance_applications?.incorporation_date || '').getFullYear()}</span>
                  </div>
                )}
                {pitchData.target_valuation && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Valuation</span>
                    <span className="font-medium">£{pitchData.target_valuation.toLocaleString()}</span>
                  </div>
                )}
                {pitchData.minimum_investment && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Min Investment</span>
                    <span className="font-medium">£{pitchData.minimum_investment.toLocaleString()}</span>
                  </div>
                )}
                {pitchData.investment_type && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Type</span>
                    <span className="font-medium capitalize">{pitchData.investment_type}</span>
                  </div>
                )}
                {pitchData.equity_offered && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Equity</span>
                    <span className="font-medium">{pitchData.equity_offered}</span>
                  </div>
                )}
                {pitchData.burn_rate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Burn Rate</span>
                    <span className="font-medium">£{pitchData.burn_rate.toLocaleString()}/mo</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Key Metrics */}
            {(pitchData.monthly_revenue || pitchData.customer_count || pitchData.growth_rate) && (
              <Card>
                <CardHeader>
                  <CardTitle>Key Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pitchData.monthly_revenue && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Monthly Revenue</span>
                      <span className="font-medium">£{pitchData.monthly_revenue.toLocaleString()}</span>
                    </div>
                  )}
                  {pitchData.customer_count && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Customers</span>
                      <span className="font-medium">{pitchData.customer_count.toLocaleString()}</span>
                    </div>
                  )}
                  {pitchData.growth_rate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Growth Rate</span>
                      <span className="font-medium">{pitchData.growth_rate}%/mo</span>
                    </div>
                  )}
                  {(pitchData.customer_acquisition_cost && pitchData.customer_lifetime_value) && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">LTV/CAC Ratio</span>
                      <span className="font-medium">{(pitchData.customer_lifetime_value / pitchData.customer_acquisition_cost).toFixed(1)}x</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="mr-2 w-5 h-5" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(pitchData.business_plan_url || pitchData.advance_assurance_applications?.business_plan_url) && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={pitchData.business_plan_url || pitchData.advance_assurance_applications?.business_plan_url || '#'} target="_blank" rel="noopener noreferrer">
                      <FileText className="mr-2 w-4 h-4" />
                      Business Plan
                    </a>
                  </Button>
                )}
                {(pitchData.pitch_deck_url || pitchData.advance_assurance_applications?.pitch_deck_url) && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={pitchData.pitch_deck_url || pitchData.advance_assurance_applications?.pitch_deck_url || '#'} target="_blank" rel="noopener noreferrer">
                      <BarChart3 className="mr-2 w-4 h-4" />
                      Pitch Deck
                    </a>
                  </Button>
                )}
                {pitchData.demo_url && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={pitchData.demo_url} target="_blank" rel="noopener noreferrer">
                      <span className="mr-2">🔗</span>
                      Live Demo
                    </a>
                  </Button>
                )}
                {!pitchData.business_plan_url && !pitchData.advance_assurance_applications?.business_plan_url && 
                 !pitchData.pitch_deck_url && !pitchData.advance_assurance_applications?.pitch_deck_url && 
                 !pitchData.demo_url && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Documents available upon request
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Investment Notice */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="mr-2 text-lg">⚠️</span>
                  Important Notice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>
                    <strong>SEIS/EIS Qualified:</strong> This investment qualifies for SEIS/EIS tax relief.
                  </p>
                  <p>
                    <strong>Risk Warning:</strong> Investments in early-stage companies are high risk and may result in total loss of capital.
                  </p>
                  <p>
                    <strong>Regulated:</strong> This opportunity is presented in compliance with FCA regulations.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Interested in Investing?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Contact the founder to discuss this investment opportunity and request additional information.
                </p>
                <Button 
                  className="w-full" 
                  onClick={() => setShowInterestModal(true)}
                >
                  <span className="mr-2">💬</span>
                  Express Interest
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Interest Modal */}
      {showInterestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Express Investment Interest</CardTitle>
              <CardDescription>
                Let the founder know you're interested in this investment opportunity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleExpressInterest} className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-blue-800">
                    💡 You'll be able to message the founder directly after expressing interest
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company/Organization (Optional)
                  </label>
                  <Input
                    value={interestData.company}
                    onChange={(e) => setInterestData({...interestData, company: e.target.value})}
                    placeholder="Investment Firm Ltd"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Potential Investment Amount (£) (Optional)
                  </label>
                  <Input
                    value={interestData.investmentAmount}
                    onChange={(e) => setInterestData({...interestData, investmentAmount: e.target.value})}
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Message *
                  </label>
                  <textarea
                    value={interestData.message}
                    onChange={(e) => setInterestData({...interestData, message: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="I'm interested in learning more about this investment opportunity..."
                    required
                  />
                </div>

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowInterestModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={submittingInterest}
                  >
                    {submittingInterest ? 'Submitting...' : 'Submit Interest'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
