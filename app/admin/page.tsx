'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

interface AdminStats {
  totalApplications: number
  pendingReview: number
  approved: number
  totalUsers: number
}

interface Application {
  id: string
  company_name: string
  status: string
  created_at: string
  founder_id: string
  profiles: {
    full_name: string
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalApplications: 0,
    pendingReview: 0,
    approved: 0,
    totalUsers: 0
  })
  const [recentApplications, setRecentApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        // Get application stats
        const { data: applications } = await supabase
          .from('advance_assurance_applications')
          .select('*, profiles(full_name)')
          .order('created_at', { ascending: false })

        // Get user count
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        if (applications) {
          setStats({
            totalApplications: applications.length,
            pendingReview: applications.filter(app => app.status === 'submitted' || app.status === 'under_review').length,
            approved: applications.filter(app => app.status === 'approved').length,
            totalUsers: userCount || 0
          })
          setRecentApplications(applications.slice(0, 5))
        }
      } catch (error) {
        console.error('Error loading admin data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAdminData()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading admin dashboard...</div>
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Monitor and manage FoundersPitch platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <span className="text-lg">📄</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              Total submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <span className="text-lg">⏰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReview}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <span className="text-lg">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              Ready for HMRC
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <span className="text-lg">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
          <CardDescription>
            Latest Advance Assurance applications requiring review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentApplications.length > 0 ? (
              recentApplications.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">{app.company_name}</p>
                      <p className="text-sm text-gray-600">by {app.profiles?.full_name || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      app.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      app.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                      app.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                      app.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {app.status.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No applications yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span className="mr-2 text-xl">⚠️</span>
            System Alerts
          </CardTitle>
          <CardDescription>
            Important notifications and system status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.pendingReview > 0 && (
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <span className="text-lg mt-0.5">⚠️</span>
                <div>
                  <p className="text-sm font-medium">{stats.pendingReview} applications pending review</p>
                  <p className="text-xs text-gray-600">Applications waiting for admin review</p>
                </div>
              </div>
            )}
            
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <span className="text-lg mt-0.5">✅</span>
              <div>
                <p className="text-sm font-medium">System operational</p>
                <p className="text-xs text-gray-600">All systems running normally</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
