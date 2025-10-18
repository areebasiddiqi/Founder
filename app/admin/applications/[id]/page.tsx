'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

interface ApplicationDetail {
  id: string
  company_name: string
  incorporation_date: string
  utr_number: string | null
  registered_address: string
  directors: string
  shareholders: string
  investment_summary: string
  use_of_funds: string
  business_plan_url: string | null
  pitch_deck_url: string | null
  status: string
  admin_notes: string | null
  created_at: string
  updated_at: string
  profiles: {
    full_name: string
    email: string
  }
}

export default function ApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const applicationId = params.id as string
  
  const [application, setApplication] = useState<ApplicationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    const loadApplication = async () => {
      try {
        const { data, error } = await supabase
          .from('advance_assurance_applications')
          .select(`
            *,
            profiles (
              full_name,
              email
            )
          `)
          .eq('id', applicationId)
          .single()

        if (error) throw error
        
        setApplication(data)
        setAdminNotes(data.admin_notes || '')
      } catch (error) {
        console.error('Error loading application:', error)
        router.push('/admin/applications')
      } finally {
        setLoading(false)
      }
    }

    if (applicationId) {
      loadApplication()
    }
  }, [applicationId, router])

  const handleStatusUpdate = async (newStatus: string) => {
    if (!application) return

    setUpdating(true)
    try {
      const { error } = await supabase
        .from('advance_assurance_applications')
        .update({ 
          status: newStatus,
          admin_notes: adminNotes
        })
        .eq('id', application.id)

      if (error) throw error

      setApplication({
        ...application,
        status: newStatus,
        admin_notes: adminNotes
      })

      alert(`Application ${newStatus} successfully!`)
    } catch (error) {
      console.error('Error updating application:', error)
      alert('Failed to update application status')
    } finally {
      setUpdating(false)
    }
  }

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

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading application details...</div>
  }

  if (!application) {
    return <div className="text-center py-8">Application not found</div>
  }

  const directors = JSON.parse(application.directors || '[]')
  const shareholders = JSON.parse(application.shareholders || '[]')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" onClick={() => router.back()}>
            <span className="mr-2">←</span>
            Back to Applications
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">{application.company_name}</h1>
          <p className="text-gray-600">Advance Assurance Application Details</p>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
          {application.status.replace('_', ' ').toUpperCase()}
        </div>
      </div>

      {/* Application Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Application Overview</CardTitle>
          <CardDescription>
            Basic information and current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Founder Information</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {application.profiles?.full_name || 'Not provided'}</p>
                <p><strong>Email:</strong> {application.profiles?.email || 'Not provided'}</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Application Timeline</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Submitted:</strong> {new Date(application.created_at).toLocaleDateString()}</p>
                <p><strong>Last Updated:</strong> {new Date(application.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Details */}
      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Company Name:</strong> {application.company_name}</p>
                <p><strong>Incorporation Date:</strong> {new Date(application.incorporation_date).toLocaleDateString()}</p>
                <p><strong>UTR Number:</strong> {application.utr_number || 'Not provided'}</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Registered Address</h4>
              <div className="text-sm">
                <p className="whitespace-pre-line">{application.registered_address}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Directors & Shareholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Directors</CardTitle>
          </CardHeader>
          <CardContent>
            {directors.length > 0 ? (
              <div className="space-y-4">
                {directors.map((director: any, index: number) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <p className="font-medium">{director.name}</p>
                    <p className="text-sm text-gray-600">{director.position}</p>
                    {director.shareholding && (
                      <p className="text-sm text-gray-600">Shareholding: {director.shareholding}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No directors listed</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shareholders</CardTitle>
          </CardHeader>
          <CardContent>
            {shareholders.length > 0 ? (
              <div className="space-y-4">
                {shareholders.map((shareholder: any, index: number) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <p className="font-medium">{shareholder.name}</p>
                    <p className="text-sm text-gray-600">Shares: {shareholder.shares}</p>
                    <p className="text-sm text-gray-600">Percentage: {shareholder.percentage}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No shareholders listed</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Investment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Investment Summary</h4>
              <p className="text-sm text-gray-700 whitespace-pre-line">{application.investment_summary}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Use of Funds</h4>
              <p className="text-sm text-gray-700 whitespace-pre-line">{application.use_of_funds}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            {application.business_plan_url ? (
              <Button variant="outline" asChild>
                <a href={application.business_plan_url} target="_blank" rel="noopener noreferrer">
                  <span className="mr-2">📥</span>
                  Download Business Plan
                </a>
              </Button>
            ) : (
              <p className="text-gray-500">No business plan uploaded</p>
            )}
            
            {application.pitch_deck_url ? (
              <Button variant="outline" asChild>
                <a href={application.pitch_deck_url} target="_blank" rel="noopener noreferrer">
                  <span className="mr-2">📥</span>
                  Download Pitch Deck
                </a>
              </Button>
            ) : (
              <p className="text-gray-500">No pitch deck uploaded</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
          <CardDescription>
            Review and update application status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label htmlFor="admin_notes" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes
              </label>
              <textarea
                id="admin_notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Add notes about this application..."
              />
            </div>

            <div className="flex items-center space-x-4">
              {application.status === 'submitted' && (
                <>
                  <Button
                    onClick={() => handleStatusUpdate('under_review')}
                    disabled={updating}
                  >
                    <span className="mr-2">🔍</span>
                    Start Review
                  </Button>
                </>
              )}

              {application.status === 'under_review' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={updating}
                  >
                    <span className="mr-2">❌</span>
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate('approved')}
                    disabled={updating}
                  >
                    <span className="mr-2">✅</span>
                    Approve
                  </Button>
                </>
              )}

              {application.status === 'approved' && (
                <>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/pitch/${application.id}`} target="_blank">
                      <span className="mr-2">👁️</span>
                      View Pitch Page
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline">
                    <span className="mr-2">📄</span>
                    Submit to HMRC
                  </Button>
                </>
              )}

              {updating && <span className="text-sm text-gray-500">Updating...</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
