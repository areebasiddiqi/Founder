'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function AuthDebug() {
  const [authState, setAuthState] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const { data: { user } } = await supabase.auth.getUser()
      
      setAuthState({
        session: session ? 'exists' : 'null',
        user: user ? 'exists' : 'null',
        userId: user?.id,
        email: user?.email,
      })
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      console.log('Auth state changed:', event, session?.user?.email)
      setAuthState({
        session: session ? 'exists' : 'null',
        user: session?.user ? 'exists' : 'null',
        userId: session?.user?.id,
        email: session?.user?.email,
        event
      })
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!authState) return null

  return (
    <div className="fixed top-4 right-4 bg-black text-white p-4 rounded text-xs z-50">
      <div>Session: {authState.session}</div>
      <div>User: {authState.user}</div>
      <div>Email: {authState.email}</div>
      <div>Event: {authState.event}</div>
    </div>
  )
}
