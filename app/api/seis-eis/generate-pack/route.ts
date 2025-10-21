import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { pdfGenerator } from '@/lib/pdf-generator';

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

    // Get all documents for this round
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('company_id', company_id)
      .or(`round_id.eq.${round_id},round_id.is.null`);

    if (!documents) {
      return NextResponse.json({ error: 'No documents found' }, { status: 404 });
    }

    // Validate all required documents are present
    const validation = pdfGenerator.validateDocuments(documents, round.scheme);
    if (!validation.valid) {
      return NextResponse.json({
        error: 'Missing required documents',
        missing_documents: validation.missing
      }, { status: 400 });
    }

    // Check if round is ready for pack generation
    if (round.status !== 'ready') {
      return NextResponse.json({
        error: 'Round must be in "ready" status to generate pack'
      }, { status: 400 });
    }

    // Generate the submission pack
    const packResult = await pdfGenerator.generateSubmissionPack(
      {
        name: company.name,
        crn: company.crn,
        incorporation_date: company.incorporation_date,
        registered_address: company.registered_address,
        contact_name: company.contact_name,
        contact_email: company.contact_email,
        contact_phone: company.contact_phone,
      },
      {
        scheme: round.scheme,
        amount_to_raise: round.amount_to_raise,
        valuation: round.valuation,
        use_of_funds: round.use_of_funds,
        risk_to_capital: round.risk_to_capital,
        first_time_applicant: round.first_time_applicant,
        investor_evidence_type: round.investor_evidence_type,
        investor_coverage_percent: round.investor_coverage_percent,
      },
      documents.map(doc => ({
        document_type: doc.document_type,
        filename: doc.filename,
        file_url: doc.file_url,
      }))
    );

    if (!packResult.success) {
      return NextResponse.json({
        error: packResult.error || 'Failed to generate pack'
      }, { status: 500 });
    }

    // Save the compiled pack as a document
    const { data: packDocument, error: packError } = await supabase
      .from('documents')
      .insert({
        company_id: company_id,
        round_id: round_id,
        document_type: 'compiled_pack',
        filename: `${company.name}_${round.scheme}_Application_Pack.pdf`,
        file_url: packResult.packUrl!,
        file_size: 0, // Would be actual size in production
        mime_type: 'application/pdf',
        is_verified: true,
      })
      .select()
      .single();

    if (packError) {
      console.error('Failed to save pack document:', packError);
      return NextResponse.json({
        error: 'Failed to save generated pack'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      pack_url: packResult.packUrl,
      document: packDocument
    });

  } catch (error) {
    console.error('Pack generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
