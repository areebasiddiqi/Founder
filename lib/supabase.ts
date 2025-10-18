import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company_name: string | null
          role: 'founder' | 'investor' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          company_name?: string | null
          role?: 'founder' | 'investor' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          company_name?: string | null
          role?: 'founder' | 'investor' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      advance_assurance_applications: {
        Row: {
          id: string
          founder_id: string
          company_name: string
          incorporation_date: string
          utr_number: string | null
          registered_address: string
          directors: any
          shareholders: any
          investment_summary: string
          use_of_funds: string
          business_plan_url: string | null
          pitch_deck_url: string | null
          status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          founder_id: string
          company_name: string
          incorporation_date: string
          utr_number?: string | null
          registered_address: string
          directors: any
          shareholders: any
          investment_summary: string
          use_of_funds: string
          business_plan_url?: string | null
          pitch_deck_url?: string | null
          status?: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          founder_id?: string
          company_name?: string
          incorporation_date?: string
          utr_number?: string | null
          registered_address?: string
          directors?: any
          shareholders?: any
          investment_summary?: string
          use_of_funds?: string
          business_plan_url?: string | null
          pitch_deck_url?: string | null
          status?: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pitch_pages: {
        Row: {
          id: string
          founder_id: string
          application_id: string
          title: string
          video_url: string | null
          business_plan_url: string | null
          overview: string
          target_raise: number
          valuation: number | null
          sector: string
          milestones: string | null
          team_info: string | null
          secure_url: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          founder_id: string
          application_id: string
          title: string
          video_url?: string | null
          business_plan_url?: string | null
          overview: string
          target_raise: number
          valuation?: number | null
          sector: string
          milestones?: string | null
          team_info?: string | null
          secure_url: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          founder_id?: string
          application_id?: string
          title?: string
          video_url?: string | null
          business_plan_url?: string | null
          overview?: string
          target_raise?: number
          valuation?: number | null
          sector?: string
          milestones?: string | null
          team_info?: string | null
          secure_url?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      investor_verifications: {
        Row: {
          id: string
          email: string
          investor_type: 'hnw' | 'sophisticated' | 'angel_vc'
          verification_date: string
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          investor_type: 'hnw' | 'sophisticated' | 'angel_vc'
          verification_date: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          investor_type?: 'hnw' | 'sophisticated' | 'angel_vc'
          verification_date?: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          status: 'active' | 'inactive' | 'cancelled'
          plan_type: 'free' | 'ai_enabled'
          current_period_start: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: 'active' | 'inactive' | 'cancelled'
          plan_type?: 'free' | 'ai_enabled'
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: 'active' | 'inactive' | 'cancelled'
          plan_type?: 'free' | 'ai_enabled'
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
