
Project Scope: Development of FoundersPitch.co.uk
Header Navigation Example 
Home | Make Ready | Get Funded | Dashboard | Billing

1. Overview
FoundersPitch.co.uk will be a “No Win, No Fee,” AI-enabled fundraising platform designed to help UK startup founders become investor-ready and connect directly with verified High Net Worth (HNW), Sophisticated, and Angel Investors.
The platform must be secure, scalable, and compliant with HMRC and FCA regulations relating to SEIS/EIS fundraising.
The platform will have two primary components:
⦁	Advance Assurance Submission Portal – enables founders to complete and submit SEIS/EIS Advance Assurance applications via the platform.
⦁	Pitch Page Builder & Investor Access Module – allows founders to create investor-facing pitch pages (video, business plan, key details) accessible only to verified investors.

2. Core User Flow
2.1 Founder Registration & Login
⦁	Secure registration using email + password (with optional 2FA).
⦁	Data stored in a secure relational database.
⦁	Once logged in, founders can:
⦁	Complete the Advance Assurance (AA) application form.
⦁	Access AI-powered tools, templates, and investor-readiness resources.
⦁	Create and manage their Pitch Page.
⦁	Manage their subscription and billing (Stripe integration).
⦁	View application progress from their dashboard.

2.2 Advance Assurance Application – I will supply this form later 
⦁	Access limited to logged-in founders.
⦁	Application form must collect all HMRC-required information:
⦁	Company details (name, incorporation date, UTR, registered address).
⦁	Directors and shareholders.
⦁	Investment summary and use of funds.
⦁	Uploads: Business Plan (required) and Pitch Deck (optional).
⦁	Include embedded forms for:
Advance Assurance Application (HMRC-compliant layout). – I will supply this form later 
Authorisation Form appointing SurgeAI Ltd as HMRC agent. – I will supply this form later 
⦁	Submission process:
0.	Application saved to database.
1.	Notification sent to admin dashboard for review.
2.	Admin approves, rejects, or requests amendments.
3.	Approved submissions are sent to HMRC by the admin team.
⦁	Automated email updates for each stage (received, under review, approved, sent).

2.3 Pitch Page Creation
⦁	Available after Advance Assurance approval.
⦁	Founders can create a Pitch Page featuring:
⦁	Embedded video (YouTube/Vimeo).
⦁	Uploaded business plan or summary deck (PDF).
⦁	Key details: overview, target raise, valuation, sector, milestones, team.
⦁	Each pitch has a unique secure URL, viewable only by verified investors.
⦁	Clean, professional layout designed for investor readability.

2.4 Investor Access & Verification
⦁	Investors must verify status before viewing pitch pages.
⦁	When an investor accesses a pitch link:
⦁	A self-certification waiver form appears.
⦁	Investor must confirm one of:
⦁	High Net Worth Individual
⦁	Sophisticated Investor
⦁	Angel / VC Representative
⦁	On confirmation, pitch access granted.
⦁	If not certified, access denied with retry option after 24 hours.
⦁	Verification records are timestamped and stored securely for FCA compliance.

3. Platform Model
The platform operates under a No Win, No Fee, AI-Enabled Success Model:
⦁	Free to start: Founders can register, access guides, and apply for Advance Assurance at no cost.
⦁	AI cost cover: £9/month subscription applies once AI-powered features (e.g., form autofill, pitch optimisation) are used.
⦁	Success fee: 7.5% fee on funds successfully raised through the platform.
⦁	No upfront consultancy or legal fees.

4. Technical Requirements
4.1 Development Stack
⦁	Developer to select the appropriate stack (recommended: React / Next.js frontend + Node.js / Django / Laravel backend).
⦁	Relational database (e.g., PostgreSQL or MySQL).
⦁	REST or GraphQL API architecture.
⦁	Responsive frontend optimised for mobile and desktop.
⦁	Deployed to a secure, scalable environment (e.g., AWS, Azure, or DigitalOcean).

4.2 Integrations
⦁	Stripe API: Subscription billing and success-fee collection.
⦁	Email gateway (SendGrid / Mailgun): Transactional notifications and alerts.
⦁	File storage: AWS S3, Cloudflare R2, or equivalent for secure uploads.
⦁	HMRC submission: Initially via secure admin review and manual forwarding; future API integration possible.
⦁	AI services: Integration with OpenAI or similar (Phase 2).

4.3 Security & Compliance
⦁	Full GDPR compliance for user and company data.
⦁	Role-based access control (Founder / Investor / Admin).
⦁	HTTPS/TLS encryption for all traffic.
⦁	Password hashing (bcrypt or equivalent).
⦁	Secure audit logs for investor verification and HMRC submissions.

4.4 Admin Dashboard
Internal management dashboard for SurgeAI staff, including:
⦁	Review and approve Advance Assurance submissions.
⦁	Manage founder and investor accounts.
⦁	Track HMRC submission statuses.
⦁	View investor verification records.
⦁	Manage billing and success-fee settlements.

5. AI Integration (Phase 2)
Planned AI features for post-launch development:
⦁	Form Autofill & Validation: AI assists founders in completing AA forms.
⦁	Document Review: AI analyses business plans for completeness and consistency.
⦁	Pitch Optimisation: Automated text and layout suggestions.
⦁	Chatbot Assistant: Real-time AI advisor for fundraising, SEIS/EIS, and compliance queries.

6. Design & User Experience
⦁	Visual style: Clean, professional SaaS aesthetic.
⦁	Brand palette: Gradient purple/blue (aligned with Founders Pitch branding).
⦁	UX Goals:
⦁	Minimal friction across stages.
⦁	Simple dashboard for tracking progress.
⦁	Clear calls-to-action (Submit, Approve, Pitch).
⦁	Smooth transitions between stages (Make Ready → Get Funded).
⦁	Tone of voice: Supportive, founder-first.
Key Taglines:
⦁	“Raise Smart. Raise Fast.”
⦁	“No Win, No Fee. AI-Enabled.”
⦁	“We only win when you do.”

7. Deliverables
⦁	Fully deployed and secure FoundersPitch.co.uk platform.
⦁	Authentication and account management (founders, investors, admins).
⦁	Advance Assurance submission workflow.
⦁	Pitch Page Builder and Investor Access system.
⦁	Stripe billing integration.
⦁	Admin dashboard for approvals and oversight.
⦁	AI integration ready for Phase 2.
⦁	Full technical documentation (API structure, database schema, and deployment process).

8. Development Phasing Map
Phase 1: MVP (Core Launch)
Goal: Establish functional workflow and proof of concept.
Deliverables:
⦁	User registration & login.
⦁	Advance Assurance submission form and document upload.
⦁	Admin dashboard (basic review + approval).
⦁	Stripe integration for £9/month plan.
⦁	Static pitch page generation (manual verification).
⦁	Email notifications (submission received, approved).
Outcome: Founders can apply for Advance Assurance and pay the subscription.

Phase 2: Investor & Pitch System
Goal: Enable investor-facing functionality and dynamic pitch creation.
Deliverables:
⦁	Pitch Page Builder (video, docs, highlights).
⦁	Investor registration & self-certification workflow.
⦁	Secure pitch access (HNW/Sophisticated investors only).
⦁	Admin moderation tools for investor access logs.
⦁	Expanded dashboard for founders (track pitch engagement).
Outcome: Founders can publish investor-ready pitches; verified investors can view them securely.

Phase 3: AI Integration & Automation
Goal: Add AI-powered capabilities and HMRC automation.
Deliverables:
⦁	AI autofill for Advance Assurance forms.
⦁	AI document review and pitch improvement suggestions.
⦁	Chatbot for founder support.
⦁	Optional integration with HMRC API or document submission gateway.
⦁	Enhanced analytics dashboard (conversion and performance tracking).
Outcome: Platform operates as a fully automated, intelligent fundraising ecosystem.

Phase 4: Optimisation & Scale
Goal: Improve performance, UI, and compliance readiness.
Deliverables:
⦁	UI/UX refinement.
⦁	Full FCA and GDPR audit compliance.
⦁	Investor engagement metrics and dashboards.
⦁	Integration of alternative payment/escrow options.
⦁	Load testing and scalability upgrades.
Outcome: Stable, scalable, investor-ready SaaS platform capable of growth.

✅ Final Note for Developer:
Please architect the system with modular scalability, enabling future integration of AI features, third-party APIs, and investor analytics tools without major restructuring.