'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

const getNavigation = (userRole: string) => {
  const baseNav = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊', roles: ['founder', 'investor'] },
    { name: 'Messages', href: '/dashboard/messages', icon: '💬', roles: ['founder', 'investor'] },
  ]

  const founderNav = [
    { name: 'Applications', href: '/dashboard/applications', icon: '📋', roles: ['founder'] },
    { name: 'Pitch Pages', href: '/dashboard/pitch-pages', icon: '🚀', roles: ['founder'] },
    { name: 'Investor Interests', href: '/dashboard/investor-interests', icon: '💰', roles: ['founder'] },
  ]

  const investorNav = [
    { name: 'Browse Pitches', href: '/browse', icon: '🔍', roles: ['investor'] },
    { name: 'My Interests', href: '/dashboard/my-interests', icon: '⭐', roles: ['investor'] },
  ]

  const commonNav = [
    { name: 'Billing', href: '/dashboard/billing', icon: '💳', roles: ['founder', 'investor'] },
    { name: 'Settings', href: '/dashboard/settings', icon: '⚙️', roles: ['founder', 'investor'] },
  ]

  return [
    ...baseNav,
    ...(userRole === 'founder' ? founderNav : investorNav),
    ...commonNav
  ].filter(item => item.roles.includes(userRole))
}

export function DashboardNav() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState('founder')
  const [availableRoles, setAvailableRoles] = useState<string[]>(['founder'])
  const [switching, setSwitching] = useState(false)
  const navigation = getNavigation(userRole)

  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Check localStorage first for role preference
          const savedRole = localStorage.getItem(`user_role_${user.id}`)
          if (savedRole && ['founder', 'investor'].includes(savedRole)) {
            setUserRole(savedRole)
          }

          // Check localStorage for available roles
          const savedRoles = localStorage.getItem(`available_roles_${user.id}`)
          if (savedRoles) {
            setAvailableRoles(JSON.parse(savedRoles))
          }

          // Try to get user's active role from database (if available)
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('active_role')
              .eq('id', user.id)
              .single()
            
            if (profile?.active_role) {
              setUserRole(profile.active_role)
              localStorage.setItem(`user_role_${user.id}`, profile.active_role)
            }
          } catch (profileError) {
            console.log('Profile table not ready, using localStorage fallback')
          }
        }
      } catch (error) {
        console.error('Error loading user role:', error)
      }
    }

    loadUserRole()
  }, [])

  const switchRole = async (newRole: string) => {
    setSwitching(true)
    try {
      const { error } = await supabase.rpc('switch_user_role', { 
        new_role: newRole 
      })

      if (error) throw error

      setUserRole(newRole)
      // Refresh the page to update all components
      window.location.reload()
    } catch (error) {
      console.error('Error switching role:', error)
      alert('Failed to switch profile')
    } finally {
      setSwitching(false)
    }
  }

  const addInvestorRole = async () => {
    setSwitching(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role: 'investor',
            is_active: false
          })

        if (error && error.code !== '23505') { // Ignore duplicate key error
          throw error
        }

        setAvailableRoles(prev => [...prev.filter(r => r !== 'investor'), 'investor'])
      }
    } catch (error) {
      console.error('Error adding investor role:', error)
      alert('Failed to add investor profile')
    } finally {
      setSwitching(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'founder': return '🚀'
      case 'investor': return '💰'
      case 'admin': return '👑'
      default: return '👤'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'founder': return 'Founder'
      case 'investor': return 'Investor'
      case 'admin': return 'Admin'
      default: return role
    }
  }

  return (
    <div className="w-64 bg-white shadow-sm">
      <div className="flex items-center justify-center px-6 py-4 border-b">
        <Image 
          src="/arrow logo.png" 
          alt="FoundersPitch Logo" 
          width={100} 
          height={100} 
          className="h-11"
        />
      </div>

      {/* Profile Switcher */}
      <div className="px-3 py-4 border-b bg-gray-50">
        <div className="mb-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Profile</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getRoleIcon(userRole)}</span>
            <span className="font-medium text-gray-900">{getRoleLabel(userRole)}</span>
          </div>
        </div>
        
        {/* Role Switcher Buttons */}
        <div className="space-y-2">
          {availableRoles.length > 1 && (
            <div className="flex space-x-1">
              {availableRoles.map(role => (
                <Button
                  key={role}
                  size="sm"
                  variant={role === userRole ? "default" : "outline"}
                  onClick={() => switchRole(role)}
                  disabled={switching || role === userRole}
                  className="flex-1 text-xs"
                >
                  <span className="mr-1">{getRoleIcon(role)}</span>
                  {getRoleLabel(role)}
                </Button>
              ))}
            </div>
          )}

          {!availableRoles.includes('investor') && (
            <Button
              size="sm"
              variant="outline"
              onClick={addInvestorRole}
              disabled={switching}
              className="w-full text-xs"
            >
              <span className="mr-1">💰</span>
              Add Investor Profile
            </Button>
          )}
        </div>
      </div>
      
      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {navigation.map((item: any) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                pathname === item.href
                  ? 'bg-purple-50 text-purple-700 border-r-2 border-purple-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>
      </nav>

      <div className="absolute bottom-0 w-64 p-3 border-t">
        <Button variant="ghost" className="w-full justify-start text-gray-600">
          <span className="mr-3">🚪</span>
          Sign Out
        </Button>
      </div>
    </div>
  )
}
