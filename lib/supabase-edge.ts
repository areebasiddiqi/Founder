import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Edge-compatible Supabase client
export const supabaseEdge = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Disable session persistence for edge runtime
    autoRefreshToken: false, // Disable auto refresh for edge runtime
  },
  realtime: {
    params: {
      eventsPerSecond: -1 // Disable realtime for edge runtime
    }
  },
  global: {
    headers: {
      'x-application-name': 'surge-edge'
    }
  }
})

export default supabaseEdge
