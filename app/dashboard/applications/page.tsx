'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

interface Application {
  id: string
  company_name: string
  status: string
  created_at: string
  investment_summary: string
  business_plan_url: string | null
  pitch_deck_url: string | null
}

export default function UserApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          const { data } = await supabase
            .from('advance_assurance_applications')
            .select('*')
            .eq('founder_id', user.id)
            .order('created_at', { ascending: false })
          
          setApplications(data || [])
        }
      } catch (error) {
        console.error('Error loading applications:', error)
      } finally {
        setLoading(false)
      }
    }

    loadApplications()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800'
      case 'under_review':
        return 'bg-blue-100 text-blue-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return '📝'
      case 'submitted':
        return '📋'
      case 'under_review':
        return '🔍'
      case 'approved':
        return '✅'
      case 'rejected':
        return '❌'
      default:
        return '📄'
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading applications...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-600">Track your Advance Assurance applications</p>
        </div>
        <Button asChild>
          <Link href="/make-ready">
            <span className="mr-2">➕</span>
            New Application
          </Link>
        </Button>
      </div>

      {/* Applications List */}
      {applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((application) => (
            <Card key={application.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{getStatusIcon(application.status)}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {application.company_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {application.investment_summary.substring(0, 100)}...
                        </p>
                        <p className="text-sm text-gray-500">
                          Created {new Date(application.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                      {application.status.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {application.business_plan_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={application.business_plan_url} target="_blank" rel="noopener noreferrer">
                          <span className="mr-2">📥</span>
                          Business Plan
                        </a>
                      </Button>
                    )}
                    
                    {application.pitch_deck_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={application.pitch_deck_url} target="_blank" rel="noopener noreferrer">
                          <span className="mr-2">📥</span>
                          Pitch Deck
                        </a>
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {application.status === 'draft' && (
                      <Button size="sm" asChild>
                        <Link href="/make-ready">
                          <span className="mr-2">✏️</span>
                          Continue
                        </Link>
                      </Button>
                    )}
                    
                    {application.status === 'approved' && (
                      <Button size="sm" asChild>
                        <Link href="/get-funded">
                          <span className="mr-2">🚀</span>
                          Get Funded
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📄</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
              <p className="text-gray-600 mb-6">
                Start your fundraising journey by creating your first Advance Assurance application
              </p>
              <Button asChild>
                <Link href="/make-ready">
                  <span className="mr-2">🚀</span>
                  Start Application
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
