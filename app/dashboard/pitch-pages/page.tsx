'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

interface PitchPage {
  id: string
  pitch_title: string
  is_published: boolean
  created_at: string
  updated_at: string
  elevator_pitch: string
  target_valuation: number | null
  advance_assurance_applications: {
    id: string
    company_name: string
    status: string
  }
}

export default function PitchPagesPage() {
  const [pitchPages, setPitchPages] = useState<PitchPage[]>([])
  const [approvedApplications, setApprovedApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadPitchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          // Load existing pitch pages
          const { data: pitchData } = await supabase
            .from('pitch_pages')
            .select(`
              *,
              advance_assurance_applications (
                id,
                company_name,
                status
              )
            `)
            .eq('founder_id', user.id)
            .order('updated_at', { ascending: false })
          
          setPitchPages(pitchData || [])

          // Load approved applications without pitch pages
          const { data: allApproved } = await supabase
            .from('advance_assurance_applications')
            .select('*')
            .eq('founder_id', user.id)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
          
          // Filter out applications that already have pitch pages
          const existingAppIds = (pitchData || []).map(p => p.advance_assurance_applications.id)
          const availableApps = (allApproved || []).filter(app => !existingAppIds.includes(app.id))
          setApprovedApplications(availableApps)
        }
      } catch (error) {
        console.error('Error loading pitch data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPitchData()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading pitch pages...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pitch Pages</h1>
          <p className="text-gray-600">Create and manage your investor pitch pages</p>
        </div>
        <Button asChild>
          <Link href="/create-pitch">
            <span className="mr-2">➕</span>
            Create Pitch Page
          </Link>
        </Button>
      </div>

      {/* Existing Pitch Pages */}
      {pitchPages.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Pitch Pages</h2>
          <div className="space-y-4">
            {pitchPages.map((pitch) => (
              <Card key={pitch.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl">{pitch.is_published ? '🚀' : '📝'}</span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {pitch.pitch_title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {pitch.elevator_pitch.substring(0, 100)}...
                          </p>
                          <p className="text-sm text-gray-500">
                            {pitch.is_published ? 'Published' : 'Draft'} • Last updated {new Date(pitch.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        pitch.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {pitch.is_published ? 'Live' : 'Draft'}
                      </div>
                      {pitch.target_valuation && (
                        <div className="text-right">
                          <p className="font-semibold">£{pitch.target_valuation.toLocaleString()}</p>
                          <p className="text-xs text-gray-600">Valuation</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-600">
                        <p><strong>Company:</strong> {pitch.advance_assurance_applications.company_name}</p>
                        <p><strong>Status:</strong> {pitch.is_published ? 'Available to investors' : 'Draft in progress'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/create-pitch?edit=${pitch.id}`}>
                          <span className="mr-2">✏️</span>
                          Edit
                        </Link>
                      </Button>
                      {pitch.is_published && (
                        <>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/pitch/${pitch.id}`} target="_blank">
                              <span className="mr-2">👁️</span>
                              View Live
                            </Link>
                          </Button>
                          <Button size="sm" onClick={() => {
                            const pitchUrl = `${window.location.origin}/pitch/${pitch.id}`
                            navigator.clipboard.writeText(pitchUrl)
                            alert('Pitch page URL copied to clipboard!')
                          }}>
                            <span className="mr-2">📋</span>
                            Copy Link
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available Applications for New Pitch Pages */}
      {approvedApplications.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Create New Pitch Pages</h2>
          <div className="space-y-4">
            {approvedApplications.map((application) => (
              <Card key={application.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl">🎯</span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {application.company_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {application.investment_summary.substring(0, 100)}...
                          </p>
                          <p className="text-sm text-gray-500">
                            Approved {new Date(application.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        Ready for pitch page
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-600">
                        <p><strong>Status:</strong> Approved for fundraising</p>
                        <p><strong>Next step:</strong> Create your investor pitch page</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button size="sm" asChild>
                        <Link href={`/create-pitch?app=${application.id}`}>
                          <span className="mr-2">🚀</span>
                          Create Pitch Page
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/pitch/${application.id}`} target="_blank">
                          <span className="mr-2">👁️</span>
                          Preview Basic
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {pitchPages.length === 0 && approvedApplications.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">🎯</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No approved applications</h3>
              <p className="text-gray-600 mb-6">
                Pitch pages are available once your Advance Assurance application is approved. 
                Submit your application to get started.
              </p>
              <div className="space-y-4">
                <Button asChild>
                  <Link href="/make-ready">
                    <span className="mr-2">📝</span>
                    Submit Application
                  </Link>
                </Button>
                <div className="text-sm text-gray-500">
                  <p>Once approved, you'll be able to:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Create professional pitch pages</li>
                    <li>• Connect with verified investors</li>
                    <li>• Track investor engagement</li>
                    <li>• Manage fundraising campaigns</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Pitch Page Features</CardTitle>
          <CardDescription>
            What you'll get with your investor pitch page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <span className="text-3xl mb-2 block">🔒</span>
              <h4 className="font-medium mb-1">Secure Access</h4>
              <p className="text-sm text-gray-600">Investor verification required</p>
            </div>
            <div className="text-center">
              <span className="text-3xl mb-2 block">📊</span>
              <h4 className="font-medium mb-1">Analytics</h4>
              <p className="text-sm text-gray-600">Track page views and engagement</p>
            </div>
            <div className="text-center">
              <span className="text-3xl mb-2 block">💼</span>
              <h4 className="font-medium mb-1">Professional Design</h4>
              <p className="text-sm text-gray-600">Beautiful, mobile-optimized layout</p>
            </div>
            <div className="text-center">
              <span className="text-3xl mb-2 block">📧</span>
              <h4 className="font-medium mb-1">Direct Contact</h4>
              <p className="text-sm text-gray-600">Secure investor communication</p>
            </div>
            <div className="text-center">
              <span className="text-3xl mb-2 block">📈</span>
              <h4 className="font-medium mb-1">Progress Tracking</h4>
              <p className="text-sm text-gray-600">Monitor fundraising progress</p>
            </div>
            <div className="text-center">
              <span className="text-3xl mb-2 block">🎯</span>
              <h4 className="font-medium mb-1">Targeted Sharing</h4>
              <p className="text-sm text-gray-600">Share with specific investor groups</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
