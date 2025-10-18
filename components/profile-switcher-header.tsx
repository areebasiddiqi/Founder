'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'

export function ProfileSwitcherHeader() {
  const [currentRole, setCurrentRole] = useState('founder')
  const [availableRoles, setAvailableRoles] = useState<string[]>(['founder'])
  const [switching, setSwitching] = useState(false)
  const [user, setUser] = useState<any>(null)

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

          // Try to get user's active role from profiles
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

          // Try to get available roles from user_roles table
          try {
            const { data: roles } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id)

            if (roles && roles.length > 0) {
              const rolesList = roles.map(r => r.role)
              setAvailableRoles(rolesList)
            } else {
              // Check localStorage for available roles
              const savedRoles = localStorage.getItem(`available_roles_${user.id}`)
              if (savedRoles) {
                setAvailableRoles(JSON.parse(savedRoles))
              } else {
                setAvailableRoles(['founder'])
              }
            }
          } catch (rolesError) {
            console.log('User roles table not ready yet, using localStorage fallback')
            const savedRoles = localStorage.getItem(`available_roles_${user.id}`)
            if (savedRoles) {
              setAvailableRoles(JSON.parse(savedRoles))
            } else {
              setAvailableRoles(['founder'])
            }
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error)
        // Fallback to founder role if there's an error
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

      // Try to use the RPC function if available
      try {
        const { error: rpcError } = await supabase.rpc('switch_user_role', { 
          new_role: newRole 
        })

        if (rpcError) {
          // Fallback: directly update profiles table
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ active_role: newRole })
            .eq('id', user?.id)

          if (updateError) {
            console.log('Database update failed, using localStorage only:', updateError)
          }
        }
      } catch (dbError) {
        console.log('Database not ready, using localStorage only:', dbError)
      }

      setCurrentRole(newRole)
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

      // Try to add investor role to user_roles table
      try {
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role: 'investor',
            is_active: false
          })

        if (error && error.code !== '23505') { // Ignore duplicate key error
          console.log('Could not add to user_roles table:', error)
        }
      } catch (dbError) {
        console.log('Database not ready, using localStorage only:', dbError)
      }

      // Add investor to available roles
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

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2" disabled={switching}>
          <span>{getRoleIcon(currentRole)}</span>
          <span>{getRoleLabel(currentRole)}</span>
          <span className="ml-1">▼</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch Profile</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {availableRoles.map(role => (
          <DropdownMenuItem
            key={role}
            onClick={() => switchToRole(role)}
            className={`flex items-center space-x-2 ${
              role === currentRole ? 'bg-purple-50 text-purple-700' : ''
            }`}
            disabled={switching || role === currentRole}
          >
            <span>{getRoleIcon(role)}</span>
            <span>{getRoleLabel(role)}</span>
            {role === currentRole && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        ))}
        
        {!availableRoles.includes('investor') && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={addInvestorRole}
              disabled={switching}
              className="flex items-center space-x-2 text-blue-600"
            >
              <span>💰</span>
              <span>Add Investor Profile</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
