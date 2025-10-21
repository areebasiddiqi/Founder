# SEIS/EIS Advance Assurance System - Deployment Guide

## Overview

This guide covers the deployment of the comprehensive SEIS/EIS Advance Assurance workflow system built for FoundersPitch. The system automates the entire process from founder onboarding to HMRC submission and compliance tracking.

## System Architecture

### Core Components
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Supabase (PostgreSQL with Row Level Security)
- **Payments**: Stripe integration for £9/month subscriptions
- **File Storage**: Supabase Storage for document management
- **Email**: SendGrid for automated notifications
- **External APIs**: Companies House API for company data

### Key Features Implemented
- ✅ Complete database schema for SEIS/EIS workflow
- ✅ Companies House API integration
- ✅ Stripe subscription management
- ✅ Application wizard with step-by-step flow
- ✅ Document upload and validation system
- ✅ PDF generation for submission packs
- ✅ Admin portal for application management
- ✅ Automated reminder and compliance tracking
- ✅ Eligibility checking engine

## Pre-Deployment Setup

### 1. Environment Variables

Create/update your `.env.local` file with the following variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Companies House API
COMPANIES_HOUSE_API_KEY=your_companies_house_api_key

# SendGrid (for emails)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@founderspitch.com

# Cron Job Security
CRON_SECRET=your_secure_random_string
ADMIN_SECRET=your_admin_secret_key
```

### 2. Database Setup

Run the database migrations in order:

```bash
# 1. Apply the existing schema
psql -h your_db_host -U your_db_user -d your_db_name -f supabase/schema.sql

# 2. Apply the SEIS/EIS extensions
psql -h your_db_host -U your_db_user -d your_db_name -f supabase/seis_eis_schema.sql
```

### 3. Supabase Storage Setup

Create the following storage buckets in your Supabase dashboard:

1. **seis-eis-documents** (for uploaded documents)
   - Public: No
   - File size limit: 10MB
   - Allowed MIME types: PDF, Word, Excel

2. **generated-packs** (for compiled submission packs)
   - Public: No
   - File size limit: 50MB
   - Allowed MIME types: PDF

### 4. Stripe Product Setup

Create the following products in your Stripe dashboard:

1. **SEIS/EIS Agent Service**
   - Price: £9.00 GBP
   - Billing: Monthly recurring
   - Price ID: Update `PRICE_IDS.SEIS_EIS_PLAN` in `lib/stripe.ts`

### 5. Companies House API Setup

1. Register for a Companies House API key at: https://developer.company-information.service.gov.uk/
2. Add the API key to your environment variables
3. Test the integration with a known company number

## Deployment Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Build and Test Locally

```bash
# Run development server
npm run dev

# Test the application at http://localhost:3000
# Verify all integrations work correctly
```

### 3. Deploy to Production

#### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

#### Option B: Other Platforms

Follow your platform's deployment guide for Next.js applications.

### 4. Set Up Automated Reminders

Configure a cron job to run the reminder system daily:

```bash
# Add to your cron scheduler (e.g., GitHub Actions, Vercel Cron, or external service)
# Run daily at 9 AM UTC
0 9 * * * curl -X POST "https://your-domain.com/api/seis-eis/reminders" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 5. Configure Webhooks

#### Stripe Webhooks
Set up webhook endpoint: `https://your-domain.com/api/stripe/webhook`
Events to listen for:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## Post-Deployment Configuration

### 1. Admin User Setup

Create an admin user by updating the profiles table:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-admin-email@founderspitch.com';
```

### 2. Test Complete Workflow

1. **Subscription Flow**
   - Create test user
   - Subscribe to SEIS/EIS plan
   - Verify subscription status

2. **Application Flow**
   - Create company via Companies House lookup
   - Upload test documents
   - Generate submission pack
   - Test admin portal functionality

3. **Reminder System**
   - Manually trigger reminder check: `GET /api/seis-eis/reminders?admin_key=YOUR_ADMIN_SECRET`
   - Verify email notifications work

### 3. Monitoring Setup

Set up monitoring for:
- Application uptime
- Database performance
- File upload success rates
- Email delivery rates
- API response times

## Security Considerations

### 1. Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Admins have full access

### 2. File Upload Security
- File type validation
- Size limits enforced
- Virus scanning recommended (external service)

### 3. API Security
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- Secure webhook verification

### 4. Data Protection
- GDPR compliance measures
- Data retention policies (6 years minimum)
- Audit logging for all actions

## Maintenance Tasks

### Daily
- Monitor reminder system execution
- Check for failed email deliveries
- Review error logs

### Weekly
- Review application statuses
- Check for expired authorisations
- Monitor storage usage

### Monthly
- Review subscription metrics
- Update Companies House data cache
- Security audit of access logs

## Troubleshooting

### Common Issues

1. **Companies House API Failures**
   - Check API key validity
   - Verify rate limits not exceeded
   - Implement retry logic for temporary failures

2. **File Upload Issues**
   - Check Supabase storage permissions
   - Verify file size limits
   - Ensure proper MIME type validation

3. **Email Delivery Problems**
   - Verify SendGrid API key
   - Check sender reputation
   - Monitor bounce rates

4. **Subscription Issues**
   - Verify Stripe webhook configuration
   - Check webhook signature validation
   - Monitor failed payment handling

### Support Contacts

- **Technical Issues**: tech@founderspitch.com
- **HMRC Queries**: compliance@founderspitch.com
- **User Support**: support@founderspitch.com

## Future Enhancements

### Phase 2 Features
- Direct HMRC API integration (when available)
- E-signature integration (DocuSign/Adobe Sign)
- Advanced document OCR and validation
- Mobile app for document capture
- Integration with accounting software

### Phase 3 Features
- AI-powered eligibility assessment
- Automated business plan analysis
- Investor matching platform integration
- Advanced analytics and reporting
- Multi-language support

## Compliance Notes

### HMRC Requirements
- Agent authorisation valid for 90 days maximum
- All records must be retained for 6 years minimum
- SEIS1/EIS1 forms must be submitted within 3 months of share issue
- Material changes must be reported to HMRC

### Data Protection
- ICO registration required for data processing
- GDPR compliance mandatory
- Data processing agreements with third parties
- Regular security assessments required

## Performance Optimization

### Database
- Regular VACUUM and ANALYZE operations
- Index optimization for common queries
- Connection pooling configuration

### File Storage
- CDN integration for faster downloads
- Automatic file compression
- Cleanup of temporary files

### Caching
- Redis integration for session management
- API response caching
- Static asset optimization

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database schema applied
- [ ] Supabase storage buckets created
- [ ] Stripe products configured
- [ ] Companies House API key added
- [ ] SendGrid email templates created
- [ ] Application deployed to production
- [ ] Webhooks configured and tested
- [ ] Cron jobs scheduled
- [ ] Admin user created
- [ ] Complete workflow tested
- [ ] Monitoring and alerts configured
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Team training completed

---

**System Status**: Ready for Production Deployment
**Last Updated**: October 2024
**Version**: 1.0.0
