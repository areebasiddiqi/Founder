-- Complete SEIS/EIS System Tables
-- Run this after the profiles table is working
-- Copy and paste into Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums for SEIS/EIS system
DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE investor_type AS ENUM ('hnw', 'sophisticated', 'angel_vc');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE eligibility_status AS ENUM ('pending', 'eligible', 'ineligible', 'requires_review');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    crn TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    incorporation_date DATE,
    registered_address JSONB,
    directors JSONB DEFAULT '[]',
    shareholders JSONB DEFAULT '[]',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Authorisations table
CREATE TABLE IF NOT EXISTS authorisations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    authorisation_code TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Funding rounds table
CREATE TABLE IF NOT EXISTS funding_rounds (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    round_name TEXT NOT NULL,
    scheme TEXT NOT NULL CHECK (scheme IN ('SEIS', 'EIS')),
    target_amount DECIMAL(15,2) NOT NULL,
    min_investment DECIMAL(15,2),
    max_investment DECIMAL(15,2),
    status TEXT DEFAULT 'draft',
    submission_date DATE,
    hmrc_response_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    funding_round_id UUID REFERENCES funding_rounds(id) ON DELETE CASCADE NOT NULL,
    document_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    status document_status DEFAULT 'pending',
    uploaded_by UUID REFERENCES profiles(id),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Eligibility checks table
CREATE TABLE IF NOT EXISTS eligibility_checks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    funding_round_id UUID REFERENCES funding_rounds(id) ON DELETE CASCADE NOT NULL,
    company_age_years INTEGER,
    gross_assets DECIMAL(15,2),
    employee_count INTEGER,
    is_knowledge_intensive BOOLEAN,
    qualifies_for_seis BOOLEAN,
    qualifies_for_eis BOOLEAN,
    ineligibility_reasons JSONB DEFAULT '[]',
    status eligibility_status DEFAULT 'pending',
    checked_by UUID REFERENCES profiles(id),
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    funding_round_id UUID REFERENCES funding_rounds(id) ON DELETE CASCADE NOT NULL,
    submission_pack_url TEXT,
    hmrc_reference TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'prepared',
    admin_notes TEXT
);

-- Compliance tracking table
CREATE TABLE IF NOT EXISTS compliance_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    funding_round_id UUID REFERENCES funding_rounds(id) ON DELETE CASCADE NOT NULL,
    compliance_type TEXT NOT NULL,
    due_date DATE,
    completed_date DATE,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reminder logs table
CREATE TABLE IF NOT EXISTS reminder_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    funding_round_id UUID REFERENCES funding_rounds(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email_content TEXT,
    status TEXT DEFAULT 'sent'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_crn ON companies(crn);
CREATE INDEX IF NOT EXISTS idx_authorisations_user_id ON authorisations(user_id);
CREATE INDEX IF NOT EXISTS idx_authorisations_company_id ON authorisations(company_id);
CREATE INDEX IF NOT EXISTS idx_funding_rounds_company_id ON funding_rounds(company_id);
CREATE INDEX IF NOT EXISTS idx_funding_rounds_user_id ON funding_rounds(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_funding_round_id ON documents(funding_round_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_checks_funding_round_id ON eligibility_checks(funding_round_id);
CREATE INDEX IF NOT EXISTS idx_submissions_funding_round_id ON submissions(funding_round_id);
CREATE INDEX IF NOT EXISTS idx_compliance_tracking_funding_round_id ON compliance_tracking(funding_round_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_user_id ON reminder_logs(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_funding_rounds_updated_at ON funding_rounds;
CREATE TRIGGER update_funding_rounds_updated_at BEFORE UPDATE ON funding_rounds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_compliance_tracking_updated_at ON compliance_tracking;
CREATE TRIGGER update_compliance_tracking_updated_at BEFORE UPDATE ON compliance_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Companies policies
CREATE POLICY "Users can view own companies" ON companies FOR SELECT USING (
    id IN (SELECT company_id FROM authorisations WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create companies" ON companies FOR INSERT WITH CHECK (true);

-- Authorisations policies
CREATE POLICY "Users can view own authorisations" ON authorisations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create authorisations" ON authorisations FOR INSERT WITH CHECK (user_id = auth.uid());

-- Funding rounds policies
CREATE POLICY "Users can view own funding rounds" ON funding_rounds FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create funding rounds" ON funding_rounds FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own funding rounds" ON funding_rounds FOR UPDATE USING (user_id = auth.uid());

-- Documents policies
CREATE POLICY "Users can view documents for their funding rounds" ON documents FOR SELECT USING (
    funding_round_id IN (SELECT id FROM funding_rounds WHERE user_id = auth.uid())
);

CREATE POLICY "Users can upload documents for their funding rounds" ON documents FOR INSERT WITH CHECK (
    funding_round_id IN (SELECT id FROM funding_rounds WHERE user_id = auth.uid())
);

-- Eligibility checks policies
CREATE POLICY "Users can view eligibility for their funding rounds" ON eligibility_checks FOR SELECT USING (
    funding_round_id IN (SELECT id FROM funding_rounds WHERE user_id = auth.uid())
);

-- Submissions policies
CREATE POLICY "Users can view submissions for their funding rounds" ON submissions FOR SELECT USING (
    funding_round_id IN (SELECT id FROM funding_rounds WHERE user_id = auth.uid())
);

-- Compliance tracking policies
CREATE POLICY "Users can view compliance for their funding rounds" ON compliance_tracking FOR SELECT USING (
    funding_round_id IN (SELECT id FROM funding_rounds WHERE user_id = auth.uid())
);

-- Reminder logs policies
CREATE POLICY "Users can view own reminder logs" ON reminder_logs FOR SELECT USING (user_id = auth.uid());

-- Admins can view everything
CREATE POLICY "Admins can view all companies" ON companies FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can manage all funding rounds" ON funding_rounds FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can manage all documents" ON documents FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can manage all submissions" ON submissions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Success message
SELECT 'All SEIS/EIS tables created successfully!' as status;
