import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { eligibilityChecker } from '@/lib/eligibility-checker';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { company_id, round_id } = body;

    if (!company_id || !round_id) {
      return NextResponse.json(
        { error: 'Company ID and Round ID are required' },
        { status: 400 }
      );
    }

    // Verify company ownership
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .eq('founder_id', user.id)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Get funding round
    const { data: round } = await supabase
      .from('funding_rounds')
      .select('*')
      .eq('id', round_id)
      .eq('company_id', company_id)
      .single();

    if (!round) {
      return NextResponse.json({ error: 'Funding round not found' }, { status: 404 });
    }

    // Prepare data for eligibility check
    const companyData = {
      incorporation_date: company.incorporation_date,
      gross_assets: body.gross_assets,
      employees: body.employees,
      previous_seis_rounds: company.previous_seis_rounds || 0,
      previous_eis_rounds: company.previous_eis_rounds || 0,
      is_parent_company: body.is_parent_company || false,
      has_subsidiaries: body.has_subsidiaries || false,
      trading_activity: body.trading_activity,
      sic_codes: body.sic_codes || [],
    };

    const roundData = {
      scheme: round.scheme as 'SEIS' | 'EIS' | 'BOTH',
      amount_to_raise: round.amount_to_raise,
      use_of_funds: round.use_of_funds,
      first_time_applicant: round.first_time_applicant,
    };

    // Run eligibility check
    const eligibilityResult = eligibilityChecker.checkEligibility(companyData, roundData);

    // Save eligibility check result
    const { data: savedCheck, error: saveError } = await supabase
      .from('eligibility_checks')
      .insert({
        company_id,
        round_id,
        scheme: round.scheme,
        result: eligibilityResult.result,
        reasons: eligibilityResult.reasons,
        checks_performed: eligibilityResult.checks_performed,
        performed_by: user.id,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save eligibility check:', saveError);
      // Still return the result even if saving fails
    }

    return NextResponse.json({
      eligibility: eligibilityResult,
      check_id: savedCheck?.id,
    });

  } catch (error) {
    console.error('Eligibility check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
