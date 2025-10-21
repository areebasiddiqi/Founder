import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { reminderService } from '@/lib/reminder-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { company_id, round_id, share_issue_date, seis1_eis1_submitted } = body;

    if (!company_id || !round_id) {
      return NextResponse.json(
        { error: 'Company ID and Round ID are required' },
        { status: 400 }
      );
    }

    // Verify company ownership
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('id', company_id)
      .eq('founder_id', user.id)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Update compliance tracking
    const updateData: any = {};
    
    if (share_issue_date) {
      updateData.share_issue_date = share_issue_date;
      // Set reminder for 90 days after share issue
      const reminderDate = new Date(new Date(share_issue_date).getTime() + 90 * 24 * 60 * 60 * 1000);
      updateData.next_reminder_due = reminderDate.toISOString();
    }

    if (seis1_eis1_submitted) {
      updateData.seis1_eis1_submitted_at = new Date().toISOString();
      updateData.next_reminder_due = null; // Clear reminder as compliance is complete
    }

    const { data: compliance, error } = await supabase
      .from('compliance_tracking')
      .upsert({
        company_id,
        round_id,
        ...updateData
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to update compliance tracking' }, { status: 500 });
    }

    // If share issue date was provided, also update the reminder service
    if (share_issue_date) {
      await reminderService.updateComplianceTracking(
        company_id, 
        round_id, 
        new Date(share_issue_date)
      );
    }

    return NextResponse.json({ 
      success: true, 
      compliance,
      message: seis1_eis1_submitted 
        ? 'SEIS1/EIS1 submission recorded - compliance complete'
        : 'Share issue date recorded - reminder set for 90 days'
    });

  } catch (error) {
    console.error('Compliance update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
