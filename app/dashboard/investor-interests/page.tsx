'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

interface InvestorInterest {
  id: string
  investor_name: string
  investor_email: string
  investor_company: string | null
  investment_amount: string | null
  message: string
  status: string
  created_at: string
  pitch_pages: {
    id: string
    pitch_title: string
    advance_assurance_applications: {
      company_name: string
    }
  }
}

export default function InvestorInterestsPage() {
  const [interests, setInterests] = useState<InvestorInterest[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadInterests = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          const { data: interestsData, error } = await supabase
            .from('investor_interests')
            .select(`
              *,
              pitch_pages!inner (
                id,
                pitch_title,
                advance_assurance_applications (
                  company_name
                )
              )
            `)
            .eq('pitch_pages.founder_id', user.id)
            .order('created_at', { ascending: false })

          if (error) throw error
          setInterests(interestsData || [])
        }
      } catch (error) {
        console.error('Error loading investor interests:', error)
      } finally {
        setLoading(false)
      }
    }

    loadInterests()
  }, [])

  const updateInterestStatus = async (interestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('investor_interests')
        .update({ status: newStatus })
        .eq('id', interestId)

      if (error) throw error

      // Update local state
      setInterests(prev => 
        prev.map(interest => 
          interest.id === interestId 
            ? { ...interest, status: newStatus }
            : interest
        )
      )
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'contacted': return 'bg-yellow-100 text-yellow-800'
      case 'in_discussion': return 'bg-purple-100 text-purple-800'
      case 'declined': return 'bg-red-100 text-red-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'new': return '🆕'
      case 'contacted': return '📞'
      case 'in_discussion': return '💬'
      case 'declined': return '❌'
      case 'accepted': return '✅'
      default: return '📋'
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Investor Interests</h1>
          <p className="text-gray-600 mt-2">
            Manage investor interests for your pitch pages
          </p>
        </div>

        {interests.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">📭</span>
                <h2 className="text-xl font-bold mb-2">No Investor Interests Yet</h2>
                <p className="text-gray-600 mb-6">
                  When investors express interest in your pitch pages, they'll appear here.
                </p>
                <Button asChild>
                  <a href="/dashboard/pitch-pages">
                    <span className="mr-2">🚀</span>
                    View Your Pitch Pages
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {interests.map((interest) => (
              <Card key={interest.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <span className="mr-2">👤</span>
                        {interest.investor_name}
                        {interest.investor_company && (
                          <span className="text-sm font-normal text-gray-600 ml-2">
                            from {interest.investor_company}
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Interested in: {interest.pitch_pages.pitch_title || interest.pitch_pages.advance_assurance_applications?.company_name}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(interest.status)}`}>
                        {getStatusEmoji(interest.status)} {interest.status.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(interest.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                        <div className="space-y-2">
                          <p className="text-sm">
                            <strong>Email:</strong>{' '}
                            <a 
                              href={`mailto:${interest.investor_email}`}
                              className="text-purple-600 hover:text-purple-800"
                            >
                              {interest.investor_email}
                            </a>
                          </p>
                          {interest.investor_company && (
                            <p className="text-sm">
                              <strong>Company:</strong> {interest.investor_company}
                            </p>
                          )}
                          {interest.investment_amount && (
                            <p className="text-sm">
                              <strong>Potential Investment:</strong> £{interest.investment_amount}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Message</h4>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {interest.message}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">Update Status:</span>
                        <select
                          value={interest.status}
                          onChange={(e) => updateInterestStatus(interest.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="new">🆕 New</option>
                          <option value="contacted">📞 Contacted</option>
                          <option value="in_discussion">💬 In Discussion</option>
                          <option value="accepted">✅ Accepted</option>
                          <option value="declined">❌ Declined</option>
                        </select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`mailto:${interest.investor_email}?subject=Re: Investment Interest in ${interest.pitch_pages.pitch_title || interest.pitch_pages.advance_assurance_applications?.company_name}&body=Hi ${interest.investor_name},%0D%0A%0D%0AThank you for your interest in our investment opportunity.%0D%0A%0D%0ABest regards`)}
                        >
                          <span className="mr-2">📧</span>
                          Email Investor
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a 
                            href={`/pitch/${interest.pitch_pages.id}`} 
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <span className="mr-2">👁️</span>
                            View Pitch
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
