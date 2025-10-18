import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { email, investorType, pitchId, userAgent } = await req.json()

    if (!email || !investorType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get client IP address
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip')

    // Store investor verification
    const { data, error } = await supabase
      .from('investor_verifications')
      .insert({
        email,
        investor_type: investorType,
        verification_date: new Date().toISOString(),
        ip_address: ip,
        user_agent: userAgent,
      })
      .select()
      .single()

    if (error) {
      console.error('Error storing verification:', error)
      return NextResponse.json(
        { error: 'Failed to store verification' },
        { status: 500 }
      )
    }

    // Log the access for compliance
    console.log(`Investor verification: ${email} (${investorType}) accessed pitch ${pitchId}`)

    return NextResponse.json({ 
      success: true, 
      verificationId: data.id 
    })

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
