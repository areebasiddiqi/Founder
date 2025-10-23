'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Rocket, DollarSign, Crown, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export function SimpleProfileSwitcher() {
  const [currentRole, setCurrentRole] = useState('founder')
  const [availableRoles, setAvailableRoles] = useState<string[]>(['founder'])
  const [switching, setSwitching] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          // First check localStorage for role preference
          const savedRole = localStorage.getItem(`user_role_${user.id}`)
          if (savedRole && ['founder', 'investor'].includes(savedRole)) {
            setCurrentRole(savedRole)
          }

          // Check localStorage for available roles
          const savedRoles = localStorage.getItem(`available_roles_${user.id}`)
          if (savedRoles) {
            setAvailableRoles(JSON.parse(savedRoles))
          } else {
            setAvailableRoles(['founder'])
          }

          // Try to get user's active role from profiles (if database is ready)
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('active_role')
              .eq('id', user.id)
              .single()
            
            if (profile?.active_role) {
              setCurrentRole(profile.active_role)
              localStorage.setItem(`user_role_${user.id}`, profile.active_role)
            }
          } catch (profileError) {
            console.log('Profile table not ready yet, using localStorage fallback')
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error)
        setCurrentRole('founder')
        setAvailableRoles(['founder'])
      }
    }

    loadUserData()
  }, [])

  const switchToRole = async (newRole: string) => {
    if (newRole === currentRole || switching) return

    setSwitching(true)
    try {
      // Always save to localStorage first
      if (user) {
        localStorage.setItem(`user_role_${user.id}`, newRole)
      }

      // Try to update database if available
      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ active_role: newRole })
          .eq('id', user?.id)

        if (updateError) {
          console.log('Database update failed, using localStorage only:', updateError)
        }
      } catch (dbError) {
        console.log('Database not ready, using localStorage only:', dbError)
      }

      setCurrentRole(newRole)
      setShowDropdown(false)
      // Refresh the page to update all components
      window.location.reload()
    } catch (error) {
      console.error('Error switching role:', error)
      alert('Failed to switch profile. Please try again.')
    } finally {
      setSwitching(false)
    }
  }

  const addInvestorRole = async () => {
    if (switching || !user) return

    setSwitching(true)
    try {
      // Add investor to available roles in localStorage
      const newRoles = [...availableRoles.filter(r => r !== 'investor'), 'investor']
      localStorage.setItem(`available_roles_${user.id}`, JSON.stringify(newRoles))
      setAvailableRoles(newRoles)

      // Immediately switch to investor role
      await switchToRole('investor')
    } catch (error) {
      console.error('Error adding investor role:', error)
      alert('Failed to add investor profile')
    } finally {
      setSwitching(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'founder': return Rocket
      case 'investor': return DollarSign
      case 'admin': return Crown
      default: return User
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

  if (!user) return null

  return (
    <div className="relative">
      <Button 
        variant="outline" 
        className="flex items-center space-x-2" 
        disabled={switching}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {(() => {
          const IconComponent = getRoleIcon(currentRole)
          return <IconComponent className="w-4 h-4" />
        })()}
        <span>{getRoleLabel(currentRole)}</span>
        <span className="ml-1">▼</span>
      </Button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="py-1">
            <div className="px-3 py-2 text-sm font-medium text-gray-700 border-b">
              Switch Profile
            </div>
            
            {availableRoles.map(role => (
              <button
                key={role}
                onClick={() => switchToRole(role)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                  role === currentRole ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                }`}
                disabled={switching || role === currentRole}
              >
                {(() => {
                  const IconComponent = getRoleIcon(role)
                  return <IconComponent className="w-4 h-4" />
                })()}
                <span>{getRoleLabel(role)}</span>
                {role === currentRole && <span className="ml-auto">✓</span>}
              </button>
            ))}
            
            {!availableRoles.includes('investor') && (
              <>
                <div className="border-t my-1"></div>
                <button
                  onClick={addInvestorRole}
                  disabled={switching}
                  className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center space-x-2"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Add Investor Profile</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        ></div>
      )}
    </div>
  )
}
