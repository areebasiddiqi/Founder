import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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

    // Check if round is ready for submission
    if (round.status === 'submitted') {
      return NextResponse.json(
        { error: 'Application has already been submitted' },
        { status: 400 }
      );
    }

    // Get all documents for this round
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('company_id', company_id)
      .or(`round_id.eq.${round_id},round_id.is.null`);

    // Check if all required documents are present
    const requiredDocTypes = [
      'business_plan',
      'financial_forecast',
      'articles_of_association',
      'share_register',
      'accounts',
      'investor_list',
      'hmrc_checklist',
      'cover_letter',
      'authorisation_letter',
    ];

    const uploadedDocTypes = (documents || []).map(doc => doc.document_type);
    const missingDocs = requiredDocTypes.filter(type => !uploadedDocTypes.includes(type));

    if (missingDocs.length > 0) {
      return NextResponse.json({
        error: 'Missing required documents',
        missing_documents: missingDocs
      }, { status: 400 });
    }

    // Update round status to submitted
    const { error: updateError } = await supabase
      .from('funding_rounds')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', round_id);

    if (updateError) {
      console.error('Failed to update round status:', updateError);
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }

    // Create submission record
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        company_id,
        round_id,
        submitted_by: user.id,
        status: 'submitted',
        submission_type: round.scheme,
      })
      .select()
      .single();

    if (submissionError) {
      console.error('Failed to create submission record:', submissionError);
      // Continue anyway as the round status has been updated
    }

    // TODO: In a real implementation, you would:
    // 1. Generate the final submission pack
    // 2. Send it to HMRC via their API or email
    // 3. Create tracking records
    // 4. Send confirmation emails

    return NextResponse.json({
      success: true,
      submission_id: submission?.id,
      message: 'Application submitted successfully. You will receive updates on the application status.',
    });

  } catch (error) {
    console.error('Submit API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
