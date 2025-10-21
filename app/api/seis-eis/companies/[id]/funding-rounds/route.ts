import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: companyId } = params;

    // Verify company ownership
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .eq('founder_id', user.id)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Get funding rounds with related data
    const { data: rounds, error } = await supabase
      .from('funding_rounds')
      .select(`
        *,
        documents (
          id,
          document_type,
          filename,
          is_verified,
          uploaded_at
        ),
        eligibility_checks (
          id,
          scheme,
          result,
          reasons,
          performed_at
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ rounds: rounds || [] });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: companyId } = params;

    // Verify company ownership
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .eq('founder_id', user.id)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      scheme,
      amount_to_raise,
      valuation,
      share_price,
      expected_issue_date,
      use_of_funds,
      risk_to_capital,
      first_time_applicant,
      investor_evidence_type,
      investor_coverage_percent,
    } = body;

    // Validate required fields
    if (!scheme || !amount_to_raise) {
      return NextResponse.json(
        { error: 'Scheme and amount to raise are required' },
        { status: 400 }
      );
    }

    // Create funding round
    const { data: round, error } = await supabase
      .from('funding_rounds')
      .insert({
        company_id: companyId,
        scheme,
        amount_to_raise,
        valuation,
        share_price,
        expected_issue_date,
        use_of_funds,
        risk_to_capital,
        first_time_applicant: first_time_applicant || true,
        investor_evidence_type,
        investor_coverage_percent,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to create funding round' }, { status: 500 });
    }

    return NextResponse.json({ round }, { status: 201 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
