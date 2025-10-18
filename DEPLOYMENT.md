# FoundersPitch.co.uk - Deployment Guide

## Prerequisites

Before deploying, ensure you have:
- Node.js 18+ installed
- Supabase account and project
- Stripe account with test/live keys
- SendGrid account for email notifications
- Domain name (founderspitch.co.uk)

## Environment Setup

### 1. Supabase Configuration

1. **Create a new Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note down your project URL and anon key

2. **Set up the database**
   - Go to SQL Editor in Supabase dashboard
   - Run the schema from `supabase/schema.sql`
   - Verify all tables and policies are created

3. **Configure Storage**
   - Go to Storage in Supabase dashboard
   - Create buckets: `documents`, `pitch-materials`
   - Set appropriate policies for file access

4. **Configure Authentication**
   - Go to Authentication > Settings
   - Configure email templates
   - Set site URL to your domain
   - Enable email confirmations

### 2. Stripe Configuration

1. **Create Products and Prices**
   ```bash
   # AI-Enabled Monthly Plan
   stripe products create --name "AI-Enabled Plan" --description "Monthly subscription with AI features"
   stripe prices create --product prod_xxx --unit-amount 900 --currency gbp --recurring interval=month
   ```

2. **Set up Webhooks**
   - Create webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
   - Listen for events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

3. **Update Price IDs**
   - Update `PRICE_IDS` in `lib/stripe.ts` with your actual Stripe price IDs

### 3. SendGrid Configuration

1. **Create SendGrid account**
2. **Generate API key**
3. **Verify sender email** (noreply@founderspitch.co.uk)
4. **Configure domain authentication** (optional but recommended)

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

2. **Environment Variables**
   Set in Vercel dashboard or via CLI:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   vercel env add STRIPE_SECRET_KEY
   vercel env add STRIPE_WEBHOOK_SECRET
   vercel env add SENDGRID_API_KEY
   vercel env add FROM_EMAIL
   vercel env add NEXTAUTH_URL
   vercel env add NEXTAUTH_SECRET
   ```

3. **Custom Domain**
   - Add founderspitch.co.uk in Vercel dashboard
   - Configure DNS records as instructed

### Option 2: Manual Server Deployment

1. **Server Requirements**
   - Ubuntu 20.04+ or similar
   - Node.js 18+
   - Nginx
   - SSL certificate (Let's Encrypt)

2. **Build and Deploy**
   ```bash
   # Clone repository
   git clone <repository-url>
   cd founderspitch
   
   # Install dependencies
   npm install
   
   # Build application
   npm run build
   
   # Start with PM2
   npm install -g pm2
   pm2 start npm --name "founderspitch" -- start
   pm2 startup
   pm2 save
   ```

3. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name founderspitch.co.uk www.founderspitch.co.uk;
       return 301 https://$server_name$request_uri;
   }
   
   server {
       listen 443 ssl http2;
       server_name founderspitch.co.uk www.founderspitch.co.uk;
       
       ssl_certificate /etc/letsencrypt/live/founderspitch.co.uk/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/founderspitch.co.uk/privkey.pem;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Post-Deployment Checklist

### 1. Functionality Testing
- [ ] User registration and email verification
- [ ] Login/logout functionality
- [ ] Application form submission
- [ ] File uploads working
- [ ] Admin dashboard accessible
- [ ] Stripe payments processing
- [ ] Email notifications sending
- [ ] Investor verification flow
- [ ] Pitch page viewing

### 2. Security Configuration
- [ ] HTTPS enabled and working
- [ ] Environment variables secured
- [ ] Database RLS policies active
- [ ] File upload restrictions in place
- [ ] Rate limiting configured (if needed)

### 3. Monitoring Setup
- [ ] Error tracking (Sentry recommended)
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Database monitoring
- [ ] Email delivery monitoring

### 4. SEO and Analytics
- [ ] Google Analytics configured
- [ ] Search Console verified
- [ ] Sitemap generated
- [ ] Meta tags optimized
- [ ] Open Graph tags set

## Environment Variables Reference

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email
SENDGRID_API_KEY=SG.xxx
FROM_EMAIL=noreply@founderspitch.co.uk

# App
NEXTAUTH_URL=https://founderspitch.co.uk
NEXTAUTH_SECRET=your-secret-key-here
```

## Maintenance

### Regular Tasks
- Monitor application performance
- Review error logs
- Update dependencies monthly
- Backup database weekly
- Monitor email delivery rates
- Review security logs

### Scaling Considerations
- Database connection pooling
- CDN for static assets
- Redis for session storage
- Load balancer for multiple instances
- Database read replicas

## Support

For deployment issues:
- Check logs: `vercel logs` or server logs
- Verify environment variables
- Test database connectivity
- Confirm Stripe webhook endpoints
- Validate email configuration

## Security Notes

- Never commit environment variables
- Use strong passwords for all services
- Enable 2FA on all accounts
- Regularly update dependencies
- Monitor for security vulnerabilities
- Implement proper backup procedures
