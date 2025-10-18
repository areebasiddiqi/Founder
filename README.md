# FoundersPitch.co.uk - MVP

A "No Win, No Fee," AI-enabled fundraising platform designed to help UK startup founders become investor-ready and connect directly with verified investors.

## Features

### Phase 1 (MVP) - Completed
- ✅ User registration & authentication with Supabase
- ✅ Landing page with professional design
- ✅ Dashboard for founders
- ✅ Advance Assurance application form
- ✅ Admin dashboard for application review
- ✅ Stripe integration for £9/month AI-enabled plan
- ✅ File upload system for business plans
- ✅ Responsive design with TailwindCSS

### Upcoming Phases
- **Phase 2**: Pitch Page Builder & Investor verification
- **Phase 3**: AI integration & automation
- **Phase 4**: Optimization & scale

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: TailwindCSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Payments**: Stripe
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd founderspitch
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Fill in your environment variables:
   - Supabase URL and keys
   - Stripe keys
   - Email service keys

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql`
   - Configure Row Level Security policies

5. **Configure Stripe**
   - Create products and prices in Stripe dashboard
   - Update price IDs in `lib/stripe.ts`
   - Set up webhooks for subscription events

6. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js 13+ app directory
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── admin/             # Admin panel
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   └── ui/               # UI components (shadcn/ui)
├── lib/                  # Utility functions
│   ├── supabase.ts       # Supabase client
│   ├── stripe.ts         # Stripe configuration
│   └── utils.ts          # Helper functions
├── supabase/             # Database schema
└── public/               # Static assets
```

## Database Schema

The application uses the following main tables:
- `profiles` - User profiles and roles
- `advance_assurance_applications` - SEIS/EIS applications
- `pitch_pages` - Investor-facing pitch pages
- `investor_verifications` - Investor certification records
- `subscriptions` - User subscription management

## Key Features

### Authentication
- Supabase Auth with email/password
- Role-based access (founder, investor, admin)
- Secure session management

### Application Process
1. **Make Ready**: Complete Advance Assurance application
2. **Admin Review**: Applications reviewed by admin team
3. **HMRC Submission**: Approved applications sent to HMRC
4. **Get Funded**: Create pitch pages for verified investors

### Billing
- Free tier with basic features
- £9/month AI-enabled plan
- 7.5% success fee on raised funds
- Stripe integration for secure payments

## Security & Compliance

- HTTPS/TLS encryption
- Row Level Security (RLS) in Supabase
- GDPR compliant data handling
- Secure file uploads
- Audit logging for compliance

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
1. Build the application: `npm run build`
2. Start production server: `npm start`
3. Configure reverse proxy (nginx/Apache)
4. Set up SSL certificates

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=noreply@founderspitch.co.uk

# App
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For technical support or questions:
- Email: support@founderspitch.co.uk
- Documentation: [Link to docs]

## License

Private - All rights reserved

---

**FoundersPitch** - Raise Smart. Raise Fast. We only win when you do.
