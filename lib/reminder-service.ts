// Automated Reminder and Compliance Tracking Service
import { createClient } from '@supabase/supabase-js';

interface ReminderConfig {
  type: string;
  title: string;
  message: string;
  urgency: 'low' | 'medium' | 'high';
  actionRequired: boolean;
}

interface ComplianceItem {
  company_id: string;
  company_name: string;
  contact_email: string;
  reminder_type: string;
  due_date: Date;
  overdue_days?: number;
}

export class ReminderService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  // Check for expired authorisations
  async checkExpiredAuthorisations(): Promise<ComplianceItem[]> {
    const { data: expiredAuths, error } = await this.supabase
      .from('authorisations')
      .select(`
        id,
        expires_at,
        companies (
          id,
          name,
          contact_email
        )
      `)
      .lt('expires_at', new Date().toISOString())
      .eq('is_valid', true);

    if (error) {
      console.error('Error checking expired authorisations:', error);
      return [];
    }

    return (expiredAuths || []).map((auth: any) => ({
      company_id: auth.companies?.id,
      company_name: auth.companies?.name,
      contact_email: auth.companies?.contact_email,
      reminder_type: 'authorisation_expired',
      due_date: new Date(auth.expires_at),
      overdue_days: Math.floor((Date.now() - new Date(auth.expires_at).getTime()) / (1000 * 60 * 60 * 24))
    }));
  }

  // Check for authorisations expiring soon (within 7 days)
  async checkExpiringAuthorisations(): Promise<ComplianceItem[]> {
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const { data: expiringAuths, error } = await this.supabase
      .from('authorisations')
      .select(`
        id,
        expires_at,
        companies (
          id,
          name,
          contact_email
        )
      `)
      .lt('expires_at', sevenDaysFromNow.toISOString())
      .gt('expires_at', new Date().toISOString())
      .eq('is_valid', true);

    if (error) {
      console.error('Error checking expiring authorisations:', error);
      return [];
    }

    return (expiringAuths || []).map((auth: any) => ({
      company_id: auth.companies?.id,
      company_name: auth.companies?.name,
      contact_email: auth.companies?.contact_email,
      reminder_type: 'authorisation_expiring',
      due_date: new Date(auth.expires_at)
    }));
  }

  // Check for overdue follow-ups
  async checkOverdueFollowups(): Promise<ComplianceItem[]> {
    const { data: overdueSubmissions, error } = await this.supabase
      .from('submissions')
      .select(`
        id,
        due_followup_at,
        hmrc_reference,
        companies (
          id,
          name,
          contact_email
        ),
        funding_rounds (
          scheme
        )
      `)
      .lt('due_followup_at', new Date().toISOString())
      .in('status', ['pending', 'info_requested']);

    if (error) {
      console.error('Error checking overdue follow-ups:', error);
      return [];
    }

    return (overdueSubmissions || []).map((submission: any) => ({
      company_id: submission.companies?.id,
      company_name: submission.companies?.name,
      contact_email: submission.companies?.contact_email,
      reminder_type: 'followup_overdue',
      due_date: new Date(submission.due_followup_at),
      overdue_days: Math.floor((Date.now() - new Date(submission.due_followup_at).getTime()) / (1000 * 60 * 60 * 24))
    }));
  }

  // Check for compliance reminders (post-approval)
  async checkComplianceReminders(): Promise<ComplianceItem[]> {
    const { data: complianceItems, error } = await this.supabase
      .from('compliance_tracking')
      .select(`
        id,
        next_reminder_due,
        share_issue_date,
        seis1_eis1_submitted_at,
        companies (
          id,
          name,
          contact_email
        ),
        funding_rounds (
          scheme
        )
      `)
      .lt('next_reminder_due', new Date().toISOString())
      .is('seis1_eis1_submitted_at', null);

    if (error) {
      console.error('Error checking compliance reminders:', error);
      return [];
    }

    return (complianceItems || []).map((item: any) => ({
      company_id: item.companies?.id,
      company_name: item.companies?.name,
      contact_email: item.companies?.contact_email,
      reminder_type: 'compliance_reminder',
      due_date: new Date(item.next_reminder_due)
    }));
  }

  // Get reminder configuration for different types
  getReminderConfig(type: string): ReminderConfig {
    const configs: { [key: string]: ReminderConfig } = {
      authorisation_expired: {
        type: 'authorisation_expired',
        title: 'Authorisation Letter Expired',
        message: 'Your agent authorisation letter has expired. Please sign a new authorisation letter to continue with your SEIS/EIS application.',
        urgency: 'high',
        actionRequired: true
      },
      authorisation_expiring: {
        type: 'authorisation_expiring',
        title: 'Authorisation Letter Expiring Soon',
        message: 'Your agent authorisation letter will expire within 7 days. Please sign a new authorisation letter to avoid delays.',
        urgency: 'medium',
        actionRequired: true
      },
      followup_overdue: {
        type: 'followup_overdue',
        title: 'HMRC Follow-up Overdue',
        message: 'Your SEIS/EIS application follow-up with HMRC is overdue. We will contact HMRC on your behalf to check the status.',
        urgency: 'high',
        actionRequired: false
      },
      compliance_reminder: {
        type: 'compliance_reminder',
        title: 'Post-Approval Compliance Due',
        message: 'You need to submit your SEIS1/EIS1 form to HMRC within 3 months of issuing shares. Please provide your share issue date.',
        urgency: 'medium',
        actionRequired: true
      }
    };

    return configs[type] || {
      type: 'unknown',
      title: 'Reminder',
      message: 'You have a pending action required.',
      urgency: 'low',
      actionRequired: false
    };
  }

  // Send email reminder
  async sendEmailReminder(item: ComplianceItem): Promise<boolean> {
    try {
      const config = this.getReminderConfig(item.reminder_type);
      
      // In production, this would integrate with your email service (SendGrid, etc.)
      const emailData = {
        to: item.contact_email,
        subject: `${config.title} - ${item.company_name}`,
        html: this.generateEmailTemplate(item, config),
        from: 'noreply@founderspitch.com'
      };

      // Log the reminder
      await this.logReminder(item, config);

      // For now, just log the email that would be sent
      console.log('Email reminder would be sent:', emailData);
      
      return true;
    } catch (error) {
      console.error('Error sending email reminder:', error);
      return false;
    }
  }

  // Generate email template
  private generateEmailTemplate(item: ComplianceItem, config: ReminderConfig): string {
    const overdueText = item.overdue_days ? `(${item.overdue_days} days overdue)` : '';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${config.title}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .urgency-high { border-left: 4px solid #dc3545; }
        .urgency-medium { border-left: 4px solid #ffc107; }
        .urgency-low { border-left: 4px solid #28a745; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header urgency-${config.urgency}">
            <h2>${config.title} ${overdueText}</h2>
            <p><strong>Company:</strong> ${item.company_name}</p>
            <p><strong>Due Date:</strong> ${item.due_date.toLocaleDateString()}</p>
        </div>
        
        <div class="content">
            <p>Dear Founder,</p>
            <p>${config.message}</p>
            
            ${config.actionRequired ? `
            <p><strong>Action Required:</strong> Please log into your FoundersPitch dashboard to complete the required action.</p>
            <a href="https://founderspitch.com/dashboard/seis-eis" class="button">View Dashboard</a>
            ` : `
            <p>No action is required from you at this time. We will handle this on your behalf and keep you updated.</p>
            `}
        </div>
        
        <div class="footer">
            <p>This is an automated reminder from FoundersPitch Ltd, your authorised SEIS/EIS agent.</p>
            <p>If you have any questions, please contact us at support@founderspitch.com</p>
        </div>
    </div>
</body>
</html>`;
  }

  // Log reminder in database
  private async logReminder(item: ComplianceItem, config: ReminderConfig): Promise<void> {
    try {
      await this.supabase
        .from('reminder_logs')
        .insert({
          company_id: item.company_id,
          reminder_type: item.reminder_type,
          recipient_email: item.contact_email,
          subject: `${config.title} - ${item.company_name}`,
          message: config.message,
          related_id: null // Could be linked to specific records
        });
    } catch (error) {
      console.error('Error logging reminder:', error);
    }
  }

  // Main function to run all reminder checks
  async runReminderChecks(): Promise<{
    sent: number;
    failed: number;
    items: ComplianceItem[];
  }> {
    console.log('Running reminder checks...');
    
    const allItems: ComplianceItem[] = [
      ...(await this.checkExpiredAuthorisations()),
      ...(await this.checkExpiringAuthorisations()),
      ...(await this.checkOverdueFollowups()),
      ...(await this.checkComplianceReminders())
    ];

    let sent = 0;
    let failed = 0;

    for (const item of allItems) {
      const success = await this.sendEmailReminder(item);
      if (success) {
        sent++;
      } else {
        failed++;
      }
    }

    console.log(`Reminder check complete: ${sent} sent, ${failed} failed`);
    
    return { sent, failed, items: allItems };
  }

  // Update compliance tracking after share issue
  async updateComplianceTracking(companyId: string, roundId: string, shareIssueDate: Date): Promise<void> {
    try {
      // Set reminder for 90 days after share issue (3 months for SEIS1/EIS1 submission)
      const reminderDate = new Date(shareIssueDate.getTime() + 90 * 24 * 60 * 60 * 1000);
      
      await this.supabase
        .from('compliance_tracking')
        .upsert({
          company_id: companyId,
          round_id: roundId,
          share_issue_date: shareIssueDate.toISOString(),
          next_reminder_due: reminderDate.toISOString()
        });
    } catch (error) {
      console.error('Error updating compliance tracking:', error);
    }
  }

  // Mark authorisation as invalid when expired
  async markExpiredAuthorisations(): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('authorisations')
        .update({ is_valid: false })
        .lt('expires_at', new Date().toISOString())
        .eq('is_valid', true)
        .select('id');

      if (error) {
        console.error('Error marking expired authorisations:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error marking expired authorisations:', error);
      return 0;
    }
  }
}

export const reminderService = new ReminderService();
