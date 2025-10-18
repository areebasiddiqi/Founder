'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

interface RoleSwitcherProps {
  currentRole: string
  onRoleChange: (role: string) => void
}

export function RoleSwitcher({ currentRole, onRoleChange }: RoleSwitcherProps) {
  const [availableRoles, setAvailableRoles] = useState<string[]>([])
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    const loadUserRoles = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)

          const rolesList = roles?.map(r => r.role) || ['founder']
          setAvailableRoles(rolesList)
        }
      } catch (error) {
        console.error('Error loading roles:', error)
      }
    }

    loadUserRoles()
  }, [])

  const switchRole = async (newRole: string) => {
    setSwitching(true)
    try {
      const { error } = await supabase.rpc('switch_user_role', { 
        new_role: newRole 
      })

      if (error) throw error

      onRoleChange(newRole)
      window.location.reload() // Refresh to update UI
    } catch (error) {
      console.error('Error switching role:', error)
      alert('Failed to switch role')
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

        if (error) throw error

        setAvailableRoles(prev => [...prev, 'investor'])
      }
    } catch (error) {
      console.error('Error adding investor role:', error)
      alert('Failed to add investor role')
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
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Active Role:</span>
            <div className="flex items-center space-x-1">
              <span>{getRoleIcon(currentRole)}</span>
              <span className="font-medium">{getRoleLabel(currentRole)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {availableRoles.length > 1 && (
              <div className="flex space-x-1">
                {availableRoles.map(role => (
                  <Button
                    key={role}
                    size="sm"
                    variant={role === currentRole ? "default" : "outline"}
                    onClick={() => switchRole(role)}
                    disabled={switching || role === currentRole}
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
              >
                <span className="mr-1">💰</span>
                Become Investor
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
