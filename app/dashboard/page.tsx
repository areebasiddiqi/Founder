'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InvestorDashboard } from '@/components/investor-dashboard'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Application {
  id: string
  company_name: string
  status: string
  created_at: string
  investment_summary: string
}

interface UserProfile {
  full_name: string
  company_name: string
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [investorInterests, setInvestorInterests] = useState<any[]>([])
  const [userRole, setUserRole] = useState('founder')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Get current user and check authentication
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        console.log('Dashboard - Auth check:', { user: !!user, userError, userId: user?.id })
        
        // If no user, redirect to login
        if (!user || userError) {
          console.log('Dashboard - No user found, redirecting to login')
          setLoading(false)
          router.push('/auth/login')
          return
        }
        
        console.log('Dashboard - User authenticated, loading data...')

        setUser(user)

        // Get user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setProfile(profileData)
        
        // Check localStorage first for role preference
        const savedRole = localStorage.getItem(`user_role_${user.id}`)
        if (savedRole && ['founder', 'investor'].includes(savedRole)) {
          setUserRole(savedRole)
        } else {
          setUserRole(profileData?.active_role || 'founder')
        }

        // Get user applications
        const { data: applicationsData } = await supabase
          .from('advance_assurance_applications')
          .select('*')
          .eq('founder_id', user.id)
          .order('created_at', { ascending: false })
        
        setApplications(applicationsData || [])

        // Get investor interests
        const { data: interestsData } = await supabase
          .from('investor_interests')
          .select(`
            *,
            pitch_pages!inner (
              id,
              pitch_title,
              founder_id
            )
          `)
          .eq('pitch_pages.founder_id', user.id)
          .order('created_at', { ascending: false })
        
        setInvestorInterests(interestsData || [])
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Dashboard - Auth state change:', { event, session: !!session })
        if (event === 'SIGNED_OUT') {
          console.log('Dashboard - User signed out, redirecting to login')
          router.push('/auth/login')
        }
        // Don't reload data on SIGNED_IN to prevent conflicts
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const latestApplication = applications[0]
  const applicationCount = applications.length
  const approvedApplications = applications.filter(app => app.status === 'approved').length
  const newInterests = investorInterests.filter(interest => interest.status === 'new').length
  const totalInterests = investorInterests.length
  // Show investor dashboard if user is in investor mode
  if (userRole === 'investor') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                💰 Investor
              </span>
            </div>
            <p className="text-gray-600">
              Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}! Here's your investment activity.
            </p>
          </div>
          <Button asChild>
            <Link href="/browse">
              <span className="mr-2">🔍</span>
              Browse Opportunities
            </Link>
          </Button>
        </div>
        <InvestorDashboard user={user} profile={profile} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              userRole === 'founder' 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {userRole === 'founder' ? '🚀 Founder' : '💰 Investor'}
            </span>
          </div>
          <p className="text-gray-600">
            Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}! 
            {userRole === 'founder' 
              ? " Here's your fundraising progress." 
              : " Here's your investment activity."
            }
          </p>
        </div>
        {userRole === 'founder' && (
          <Button asChild>
            <Link href="/make-ready">
              {applicationCount > 0 ? 'Continue Application' : 'Start New Application'}
            </Link>
          </Button>
        )}
        {userRole === 'investor' && (
          <Button asChild>
            <Link href="/browse">
              <span className="mr-2">🔍</span>
              Browse Opportunities
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <span className="text-lg">📄</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applicationCount}</div>
            <p className="text-xs text-muted-foreground">
              {latestApplication ? `Latest: ${latestApplication.status}` : 'No applications yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pitch Pages</CardTitle>
            <span className="text-lg">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedApplications}</div>
            <p className="text-xs text-muted-foreground">
              {approvedApplications > 0 ? 'Ready to pitch' : 'Available after approval'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investor Interests</CardTitle>
            <span className="text-lg">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInterests}</div>
            <p className="text-xs text-muted-foreground">
              {newInterests > 0 ? `${newInterests} new interest${newInterests !== 1 ? 's' : ''}` : 'No new interests'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <span className="text-lg">⏰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestApplication ? 
                latestApplication.status.charAt(0).toUpperCase() + latestApplication.status.slice(1) : 
                'Getting Started'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {latestApplication ? 'Current status' : 'Ready to begin'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Get started with your fundraising journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl mb-2">📄</span>
                <div>
                  <p className="font-medium">Advance Assurance Application</p>
                  <p className="text-sm text-gray-600">Complete your SEIS/EIS application</p>
                </div>
              </div>
              <Button size="sm" asChild>
                <Link href="/make-ready">Start</Link>
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg opacity-50">
              <div className="flex items-center space-x-3">
                <span className="text-2xl mb-2">📊</span>
                <div>
                  <p className="font-medium">Create Pitch Page</p>
                  <p className="text-sm text-gray-600">Available after approval</p>
                </div>
              </div>
              <Button size="sm" disabled>
                Locked
              </Button>
            </div>

            {totalInterests > 0 && (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-purple-50 border-purple-200">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl mb-2">💰</span>
                  <div>
                    <p className="font-medium">Investor Interests</p>
                    <p className="text-sm text-gray-600">
                      {newInterests > 0 ? `${newInterests} new interest${newInterests !== 1 ? 's' : ''} waiting` : 'Manage your investor interests'}
                    </p>
                  </div>
                </div>
                <Button size="sm" asChild>
                  <Link href="/dashboard/investor-interests">
                    View {newInterests > 0 && <span className="ml-1 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">{newInterests}</span>}
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest updates and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {applications.length > 0 ? (
                applications.slice(0, 3).map((app) => (
                  <div key={app.id} className="flex items-start space-x-3">
                    <span className="text-lg mt-0.5">
                      {app.status === 'approved' ? '✅' : 
                       app.status === 'submitted' ? '📋' : 
                       app.status === 'under_review' ? '🔍' : 
                       app.status === 'rejected' ? '❌' : '📝'}
                    </span>
                    <div>
                      <p className="text-sm font-medium">
                        Application {app.status === 'draft' ? 'saved as draft' : app.status}
                      </p>
                      <p className="text-xs text-gray-600">
                        {app.company_name} • {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-start space-x-3">
                    <span className="text-lg mt-0.5">✅</span>
                    <div>
                      <p className="text-sm font-medium">Account created successfully</p>
                      <p className="text-xs text-gray-600">Welcome to FoundersPitch!</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <span className="text-lg mt-0.5">⚠️</span>
                    <div>
                      <p className="text-sm font-medium">Complete your application</p>
                      <p className="text-xs text-gray-600">Start your SEIS/EIS application</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your Fundraising Journey</CardTitle>
          <CardDescription>
            Track your progress through the fundraising process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-purple-600">1</span>
                </div>
                <span className="text-sm font-medium">Make Ready</span>
              </div>
              <div className="h-px w-12 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-400">2</span>
                </div>
                <span className="text-sm text-gray-400">Get Approved</span>
              </div>
              <div className="h-px w-12 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-400">3</span>
                </div>
                <span className="text-sm text-gray-400">Get Funded</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
