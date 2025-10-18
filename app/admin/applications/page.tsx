'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

interface Application {
  id: string
  company_name: string
  status: string
  created_at: string
  founder_id: string
  investment_summary: string
  business_plan_url: string | null
  pitch_deck_url: string | null
  profiles: {
    full_name: string
    email: string
  }
}

export default function AdminApplicationsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const { data } = await supabase
          .from('advance_assurance_applications')
          .select(`
            *,
            profiles (
              full_name,
              email
            )
          `)
          .order('created_at', { ascending: false })
        
        setApplications(data || [])
      } catch (error) {
        console.error('Error loading applications:', error)
      } finally {
        setLoading(false)
      }
    }

    loadApplications()
  }, [])

  // Remove mock data - now using real data from database

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('advance_assurance_applications')
        .update({ status: newStatus })
        .eq('id', applicationId)
      
      if (error) throw error
      
      // Reload applications
      const { data } = await supabase
        .from('advance_assurance_applications')
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
      
      setApplications(data || [])
    } catch (error) {
      console.error('Error updating application status:', error)
      alert('Failed to update application status')
    }
  }

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (app.profiles?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading applications...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600">Review and manage Advance Assurance applications</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                <Input
                  placeholder="Search by company or founder name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.map((application) => (
          <Card key={application.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {application.company_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        by {application.profiles?.full_name || 'Unknown'} • {application.profiles?.email || 'No email'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Submitted {new Date(application.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-semibold text-lg">
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </p>
                    <p className="text-sm text-gray-600">Status</p>
                  </div>

                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                    {application.status.replace('_', ' ')}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/applications/${application.id}`}>
                      <span className="mr-2">👁️</span>
                      View Details
                    </Link>
                  </Button>
                  
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

                {application.status === 'submitted' && (
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(application.id, 'under_review')}
                    >
                      <span className="mr-2">⏰</span>
                      Start Review
                    </Button>
                  </div>
                )}

                {application.status === 'under_review' && (
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusUpdate(application.id, 'rejected')}
                    >
                      <span className="mr-2">❌</span>
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(application.id, 'approved')}
                    >
                      <span className="mr-2">✅</span>
                      Approve
                    </Button>
                  </div>
                )}

                {application.status === 'approved' && (
                  <Button size="sm" variant="outline">
                    <span className="mr-2">📄</span>
                    Submit to HMRC
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredApplications.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <span className="text-5xl mb-4">📄</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Applications will appear here once founders start submitting them'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
