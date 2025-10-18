'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

interface InvestorDashboardProps {
  user: any
  profile: any
}

export function InvestorDashboard({ user, profile }: InvestorDashboardProps) {
  const [conversations, setConversations] = useState<any[]>([])
  const [recentPitches, setRecentPitches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadInvestorData = async () => {
      if (!user) return

      try {
        // Load investor conversations
        const { data: conversationsData } = await supabase
          .from('conversations')
          .select(`
            *,
            pitch_pages (
              id,
              pitch_title,
              advance_assurance_applications (
                company_name
              )
            ),
            founder:profiles!conversations_founder_id_fkey (
              full_name
            )
          `)
          .eq('investor_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(5)

        setConversations(conversationsData || [])

        // Load recent pitch pages
        const { data: pitchesData } = await supabase
          .from('pitch_pages')
          .select(`
            *,
            advance_assurance_applications (
              company_name
            )
          `)
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(6)

        setRecentPitches(pitchesData || [])
      } catch (error) {
        console.error('Error loading investor data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadInvestorData()
  }, [user])

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading investor dashboard...</div>
  }

  const activeConversations = conversations.length
  const unreadMessages = 0 // TODO: Calculate unread messages

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
            <span className="text-lg">💬</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeConversations}</div>
            <p className="text-xs text-muted-foreground">
              {activeConversations > 0 ? 'Ongoing discussions' : 'No active conversations'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Opportunities</CardTitle>
            <span className="text-lg">🚀</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentPitches.length}</div>
            <p className="text-xs text-muted-foreground">
              Published pitch pages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <span className="text-lg">📧</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadMessages}</div>
            <p className="text-xs text-muted-foreground">
              Unread messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile</CardTitle>
            <span className="text-lg">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Investor</div>
            <p className="text-xs text-muted-foreground">
              Active profile
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Conversations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
            <CardDescription>
              Your latest discussions with founders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {conversations.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl block mb-2">💬</span>
                <p className="text-gray-600 mb-4">No conversations yet</p>
                <Button asChild size="sm">
                  <Link href="/browse">
                    <span className="mr-2">🔍</span>
                    Browse Opportunities
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {conversations.map((conversation) => (
                  <div key={conversation.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">🚀</span>
                      <div>
                        <p className="font-medium text-sm">
                          {conversation.founder.full_name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {conversation.pitch_pages.pitch_title || 
                           conversation.pitch_pages.advance_assurance_applications?.company_name}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/dashboard/messages">
                        View
                      </Link>
                    </Button>
                  </div>
                ))}
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/dashboard/messages">
                    View All Messages
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle>Latest Opportunities</CardTitle>
            <CardDescription>
              Recently published investment opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentPitches.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl block mb-2">🚀</span>
                <p className="text-gray-600 mb-4">No opportunities available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPitches.slice(0, 4).map((pitch) => (
                  <div key={pitch.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">🏢</span>
                      <div>
                        <p className="font-medium text-sm">
                          {pitch.advance_assurance_applications?.company_name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {pitch.elevator_pitch?.substring(0, 50)}...
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/pitch/${pitch.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                ))}
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/browse">
                    Browse All Opportunities
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common investor activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild className="h-auto p-4">
              <Link href="/browse">
                <div className="text-center">
                  <span className="text-2xl block mb-2">🔍</span>
                  <p className="font-medium">Browse Opportunities</p>
                  <p className="text-xs opacity-75">Discover new investments</p>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4">
              <Link href="/dashboard/messages">
                <div className="text-center">
                  <span className="text-2xl block mb-2">💬</span>
                  <p className="font-medium">Messages</p>
                  <p className="text-xs opacity-75">Chat with founders</p>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4">
              <Link href="/dashboard/settings">
                <div className="text-center">
                  <span className="text-2xl block mb-2">⚙️</span>
                  <p className="font-medium">Settings</p>
                  <p className="text-xs opacity-75">Manage your profile</p>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
