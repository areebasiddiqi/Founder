import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Use Node.js runtime to avoid Edge Runtime compatibility issues with Supabase realtime
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Subscription check removed for testing

    // Get user's companies
    const { data: companies, error } = await supabase
      .from('companies')
      .select(`
        *,
        funding_rounds (
          id,
          scheme,
          amount_to_raise,
          status,
          created_at
        ),
        authorisations (
          id,
          is_valid,
          expires_at
        )
      `)
      .eq('founder_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ companies: companies || [] });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Subscription check removed for testing

    const body = await request.json();
    const {
      name,
      crn,
      incorporation_date,
      registered_address,
      utr_number,
      website,
      contact_name,
      contact_email,
      contact_phone,
      is_seis_candidate,
      is_eis_candidate,
    } = body;

    // Validate required fields
    if (!name || !crn || !incorporation_date || !registered_address || !contact_name || !contact_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if company already exists for this user
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('crn', crn)
      .eq('founder_id', user.id)
      .single();

    if (existingCompany) {
      return NextResponse.json(
        { error: 'Company already exists' },
        { status: 409 }
      );
    }

    // Create company
    const { data: company, error } = await supabase
      .from('companies')
      .insert({
        founder_id: user.id,
        company_name: name, // Use company_name instead of name
        crn,
        incorporation_date,
        registered_address,
        utr_number,
        website,
        contact_name,
        contact_email,
        contact_phone,
        is_seis_candidate: is_seis_candidate || false,
        is_eis_candidate: is_eis_candidate || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
    }

    return NextResponse.json({ company }, { status: 201 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
