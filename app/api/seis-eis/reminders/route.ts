import { NextRequest, NextResponse } from 'next/server';
import { reminderService } from '@/lib/reminder-service';

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron job request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting automated reminder checks...');
    
    // Mark expired authorisations as invalid
    const expiredCount = await reminderService.markExpiredAuthorisations();
    console.log(`Marked ${expiredCount} authorisations as expired`);

    // Run all reminder checks and send emails
    const results = await reminderService.runReminderChecks();
    
    return NextResponse.json({
      success: true,
      expired_authorisations_marked: expiredCount,
      reminders_sent: results.sent,
      reminders_failed: results.failed,
      total_items_checked: results.items.length,
      items: results.items.map(item => ({
        company: item.company_name,
        type: item.reminder_type,
        due_date: item.due_date,
        overdue_days: item.overdue_days
      }))
    });

  } catch (error) {
    console.error('Reminder service error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// Manual trigger for admins
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get('admin_key');
    
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Manual reminder check triggered by admin...');
    
    const expiredCount = await reminderService.markExpiredAuthorisations();
    const results = await reminderService.runReminderChecks();
    
    return NextResponse.json({
      success: true,
      message: 'Manual reminder check completed',
      expired_authorisations_marked: expiredCount,
      reminders_sent: results.sent,
      reminders_failed: results.failed,
      total_items_checked: results.items.length,
      items: results.items
    });

  } catch (error) {
    console.error('Manual reminder check error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
