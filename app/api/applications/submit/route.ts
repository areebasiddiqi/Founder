import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendEmail, emailTemplates } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const applicationData = await req.json()

    const {
      founderId,
      companyName,
      incorporationDate,
      utrNumber,
      registeredAddress,
      directors,
      shareholders,
      investmentSummary,
      useOfFunds,
      businessPlanUrl,
      pitchDeckUrl
    } = applicationData

    // Validate required fields
    if (!founderId || !companyName || !incorporationDate || !registeredAddress || 
        !investmentSummary || !useOfFunds || !businessPlanUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert application into database
    const { data: application, error: insertError } = await supabase
      .from('advance_assurance_applications')
      .insert({
        founder_id: founderId,
        company_name: companyName,
        incorporation_date: incorporationDate,
        utr_number: utrNumber,
        registered_address: registeredAddress,
        directors: directors,
        shareholders: shareholders,
        investment_summary: investmentSummary,
        use_of_funds: useOfFunds,
        business_plan_url: businessPlanUrl,
        pitch_deck_url: pitchDeckUrl,
        status: 'submitted'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database error:', insertError)
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      )
    }

    // Get founder details for email
    const { data: founder } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', founderId)
      .single()

    if (founder) {
      // Send confirmation email to founder
      const founderEmail = emailTemplates.applicationSubmitted(
        founder.full_name || 'Founder',
        companyName
      )
      founderEmail.to = founder.email
      await sendEmail(founderEmail)

      // Send notification to admin
      const adminEmail = emailTemplates.adminNotification(
        companyName,
        founder.full_name || 'Unknown'
      )
      adminEmail.to = 'admin@founderspitch.co.uk' // Replace with actual admin email
      await sendEmail(adminEmail)
    }

    return NextResponse.json({ 
      success: true, 
      applicationId: application.id 
    })

  } catch (error) {
    console.error('Application submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
