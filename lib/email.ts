import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export interface EmailTemplate {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(template: EmailTemplate): Promise<boolean> {
  try {
    const msg = {
      to: template.to,
      from: process.env.FROM_EMAIL!,
      subject: template.subject,
      html: template.html,
      text: template.text || template.html.replace(/<[^>]*>/g, ''),
    }

    await sgMail.send(msg)
    return true
  } catch (error) {
    console.error('Email sending failed:', error)
    return false
  }
}

export const emailTemplates = {
  welcomeFounder: (founderName: string, companyName: string): EmailTemplate => ({
    to: '',
    subject: 'Welcome to FoundersPitch!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to FoundersPitch!</h1>
        </div>
        
        <div style="padding: 40px 20px; background: white;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Hi ${founderName},</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            Welcome to FoundersPitch! We're excited to help ${companyName} on your fundraising journey.
          </p>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            Here's what you can do next:
          </p>
          
          <ul style="color: #4b5563; line-height: 1.6; margin-bottom: 30px;">
            <li>Complete your Advance Assurance application</li>
            <li>Upload your business plan and pitch deck</li>
            <li>Track your application progress in the dashboard</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" 
               style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Remember: We only win when you do. No upfront fees, just a 7.5% success fee on funds raised.
          </p>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>© 2024 FoundersPitch. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  applicationSubmitted: (founderName: string, companyName: string): EmailTemplate => ({
    to: '',
    subject: 'Application Submitted Successfully',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #10b981; padding: 30px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Application Submitted!</h1>
        </div>
        
        <div style="padding: 30px 20px; background: white;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Hi ${founderName},</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            Great news! Your Advance Assurance application for ${companyName} has been successfully submitted.
          </p>
          
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: #166534; margin: 0 0 10px 0;">What happens next?</h3>
            <ol style="color: #166534; margin: 0; padding-left: 20px;">
              <li>Our team will review your application (typically 2-3 business days)</li>
              <li>We'll contact you if we need any additional information</li>
              <li>Once approved, we'll submit to HMRC on your behalf</li>
              <li>You'll be notified when you can create your investor pitch page</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" 
               style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Track Progress
            </a>
          </div>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>© 2024 FoundersPitch. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  applicationApproved: (founderName: string, companyName: string): EmailTemplate => ({
    to: '',
    subject: 'Application Approved - Create Your Pitch Page!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #10b981; padding: 30px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Application Approved!</h1>
        </div>
        
        <div style="padding: 30px 20px; background: white;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Congratulations ${founderName}!</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            Your Advance Assurance application for ${companyName} has been approved and submitted to HMRC.
          </p>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            You can now create your investor pitch page to start connecting with verified investors!
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard/pitch-pages" 
               style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Create Pitch Page
            </a>
          </div>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>© 2024 FoundersPitch. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  adminNotification: (companyName: string, founderName: string): EmailTemplate => ({
    to: '',
    subject: 'New Application Requires Review',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; padding: 30px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">New Application Submitted</h1>
        </div>
        
        <div style="padding: 30px 20px; background: white;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Review Required</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            A new Advance Assurance application has been submitted:
          </p>
          
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;"><strong>Company:</strong> ${companyName}</p>
            <p style="margin: 10px 0 0 0; color: #991b1b;"><strong>Founder:</strong> ${founderName}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/admin/applications" 
               style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Review Application
            </a>
          </div>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>© 2024 FoundersPitch. All rights reserved.</p>
        </div>
      </div>
    `
  })
}
