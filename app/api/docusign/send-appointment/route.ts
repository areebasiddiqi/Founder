import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { sendAgentAppointmentForSigning } from '@/lib/docusign';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      companyName, 
      companyNumber, 
      registeredAddress, 
      directorName, 
      directorEmail, 
      directorTitle, 
      startDate 
    } = body;

    // Validate required fields
    if (!companyName || !companyNumber || !registeredAddress || !directorName || !directorEmail) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Send document via DocuSign
    const result = await sendAgentAppointmentForSigning(
      {
        name: companyName,
        crn: companyNumber,
        registered_address: registeredAddress,
        contact_name: directorName,
        contact_email: directorEmail
      },
      directorTitle || 'Director',
      startDate || new Date().toISOString().split('T')[0]
    );

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Failed to send document' 
      }, { status: 500 });
    }

    // Store the appointment record in database
    // Note: You may want to create a separate table for agent appointments
    const { error: dbError } = await supabase
      .from('agent_appointments')
      .insert({
        user_id: user.id,
        company_name: companyName,
        company_number: companyNumber,
        registered_address: registeredAddress,
        director_name: directorName,
        director_email: directorEmail,
        director_title: directorTitle || 'Director',
        start_date: startDate || new Date().toISOString().split('T')[0],
        envelope_id: result.envelopeId,
        status: 'sent',
        created_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Database error:', dbError);
      // Don't fail the request if DB insert fails, as DocuSign was successful
    }

    return NextResponse.json({
      success: true,
      envelopeId: result.envelopeId,
      message: 'Agent appointment document sent successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
