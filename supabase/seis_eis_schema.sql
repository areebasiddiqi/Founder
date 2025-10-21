-- SEIS/EIS Advance Assurance Workflow Schema
-- This extends the existing schema with comprehensive SEIS/EIS functionality

-- Add new enums for SEIS/EIS workflow
CREATE TYPE scheme_type AS ENUM ('SEIS', 'EIS', 'BOTH');
CREATE TYPE round_status AS ENUM ('draft', 'ready', 'submitted', 'query', 'approved', 'rejected');
CREATE TYPE document_type AS ENUM (
    'business_plan', 'financial_forecast', 'articles_of_association', 
    'share_register', 'accounts', 'bank_statement', 'investor_list', 
    'platform_letter', 'hmrc_checklist', 'cover_letter', 
    'authorisation_letter', 'compiled_pack'
);
CREATE TYPE eligibility_result AS ENUM ('eligible', 'possibly_eligible', 'not_eligible');
CREATE TYPE submission_status AS ENUM ('pending', 'info_requested', 'approved', 'rejected');
CREATE TYPE investor_evidence_type AS ENUM ('named_investor_list', 'crowdfunding_letter');

-- Update plan_type to include SEIS/EIS plan
ALTER TYPE plan_type ADD VALUE 'seis_eis_plan';

-- Companies table (enhanced from existing advance_assurance_applications)
CREATE TABLE companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    founder_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    crn TEXT UNIQUE NOT NULL, -- Companies House Registration Number
    incorporation_date DATE NOT NULL,
    registered_address TEXT NOT NULL,
    utr_number TEXT,
    website TEXT,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    is_seis_candidate BOOLEAN DEFAULT false,
    is_eis_candidate BOOLEAN DEFAULT false,
    previous_seis_rounds INTEGER DEFAULT 0,
    previous_eis_rounds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Authorisations table
CREATE TABLE authorisations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    director_name TEXT NOT NULL,
    director_email TEXT NOT NULL,
    signed_pdf_url TEXT,
    signed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE, -- signed_at + 90 days
    is_valid BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Funding Rounds table
CREATE TABLE funding_rounds (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    scheme scheme_type NOT NULL,
    amount_to_raise DECIMAL(15,2) NOT NULL,
    valuation DECIMAL(15,2),
    share_price DECIMAL(10,4),
    expected_issue_date DATE,
    use_of_funds TEXT,
    risk_to_capital TEXT,
    first_time_applicant BOOLEAN DEFAULT true,
    investor_evidence_type investor_evidence_type,
    investor_coverage_percent DECIMAL(5,2), -- percentage of round covered by evidence
    status round_status DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    round_id UUID REFERENCES funding_rounds(id) ON DELETE CASCADE,
    document_type document_type NOT NULL,
    filename TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT false,
    verification_notes TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Eligibility Checks table
CREATE TABLE eligibility_checks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    round_id UUID REFERENCES funding_rounds(id) ON DELETE CASCADE NOT NULL,
    scheme scheme_type NOT NULL,
    result eligibility_result NOT NULL,
    reasons JSONB NOT NULL DEFAULT '[]', -- Array of reasons/issues
    checks_performed JSONB NOT NULL DEFAULT '{}', -- Detailed check results
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    performed_by UUID REFERENCES profiles(id)
);

-- Submissions table
CREATE TABLE submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    round_id UUID REFERENCES funding_rounds(id) ON DELETE CASCADE NOT NULL,
    submitted_by UUID REFERENCES profiles(id) NOT NULL,
    hmrc_reference TEXT,
    acknowledgment_file_url TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_followup_at TIMESTAMP WITH TIME ZONE, -- 30 days after submission
    status submission_status DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance tracking table
CREATE TABLE compliance_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    round_id UUID REFERENCES funding_rounds(id) ON DELETE CASCADE NOT NULL,
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE NOT NULL,
    share_issue_date DATE,
    seis1_eis1_submitted_at TIMESTAMP WITH TIME ZONE,
    seis3_eis3_received_at TIMESTAMP WITH TIME ZONE,
    next_reminder_due TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reminder logs table
CREATE TABLE reminder_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    reminder_type TEXT NOT NULL, -- 'authorisation_expiry', 'followup_30', 'compliance_90', etc.
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recipient_email TEXT NOT NULL,
    subject TEXT,
    message TEXT,
    related_id UUID -- Can reference various tables depending on reminder type
);

-- Create indexes for performance
CREATE INDEX idx_companies_founder_id ON companies(founder_id);
CREATE INDEX idx_companies_crn ON companies(crn);
CREATE INDEX idx_authorisations_company_id ON authorisations(company_id);
CREATE INDEX idx_authorisations_expires_at ON authorisations(expires_at);
CREATE INDEX idx_funding_rounds_company_id ON funding_rounds(company_id);
CREATE INDEX idx_funding_rounds_status ON funding_rounds(status);
CREATE INDEX idx_documents_company_id ON documents(company_id);
CREATE INDEX idx_documents_round_id ON documents(round_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_eligibility_checks_company_id ON eligibility_checks(company_id);
CREATE INDEX idx_submissions_company_id ON submissions(company_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_compliance_tracking_company_id ON compliance_tracking(company_id);
CREATE INDEX idx_reminder_logs_company_id ON reminder_logs(company_id);

-- Add updated_at triggers for new tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_authorisations_updated_at BEFORE UPDATE ON authorisations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_funding_rounds_updated_at BEFORE UPDATE ON funding_rounds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_tracking_updated_at BEFORE UPDATE ON compliance_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on new tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Companies
CREATE POLICY "Founders can view own companies" ON companies FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY "Founders can create companies" ON companies FOR INSERT WITH CHECK (founder_id = auth.uid());
CREATE POLICY "Founders can update own companies" ON companies FOR UPDATE USING (founder_id = auth.uid());
CREATE POLICY "Admins can view all companies" ON companies FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for Authorisations
CREATE POLICY "Founders can view own authorisations" ON authorisations FOR SELECT USING (
    EXISTS (SELECT 1 FROM companies WHERE id = authorisations.company_id AND founder_id = auth.uid())
);
CREATE POLICY "Founders can create authorisations" ON authorisations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE id = authorisations.company_id AND founder_id = auth.uid())
);
CREATE POLICY "Founders can update own authorisations" ON authorisations FOR UPDATE USING (
    EXISTS (SELECT 1 FROM companies WHERE id = authorisations.company_id AND founder_id = auth.uid())
);
CREATE POLICY "Admins can manage all authorisations" ON authorisations FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for Funding Rounds
CREATE POLICY "Founders can view own funding rounds" ON funding_rounds FOR SELECT USING (
    EXISTS (SELECT 1 FROM companies WHERE id = funding_rounds.company_id AND founder_id = auth.uid())
);
CREATE POLICY "Founders can create funding rounds" ON funding_rounds FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE id = funding_rounds.company_id AND founder_id = auth.uid())
);
CREATE POLICY "Founders can update own funding rounds" ON funding_rounds FOR UPDATE USING (
    EXISTS (SELECT 1 FROM companies WHERE id = funding_rounds.company_id AND founder_id = auth.uid())
);
CREATE POLICY "Admins can manage all funding rounds" ON funding_rounds FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for Documents
CREATE POLICY "Founders can view own documents" ON documents FOR SELECT USING (
    EXISTS (SELECT 1 FROM companies WHERE id = documents.company_id AND founder_id = auth.uid())
);
CREATE POLICY "Founders can create documents" ON documents FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE id = documents.company_id AND founder_id = auth.uid())
);
CREATE POLICY "Founders can update own documents" ON documents FOR UPDATE USING (
    EXISTS (SELECT 1 FROM companies WHERE id = documents.company_id AND founder_id = auth.uid())
);
CREATE POLICY "Admins can manage all documents" ON documents FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for other tables (similar pattern)
CREATE POLICY "Founders can view own eligibility checks" ON eligibility_checks FOR SELECT USING (
    EXISTS (SELECT 1 FROM companies WHERE id = eligibility_checks.company_id AND founder_id = auth.uid())
);
CREATE POLICY "Admins can manage all eligibility checks" ON eligibility_checks FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Founders can view own submissions" ON submissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM companies WHERE id = submissions.company_id AND founder_id = auth.uid())
);
CREATE POLICY "Admins can manage all submissions" ON submissions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Founders can view own compliance tracking" ON compliance_tracking FOR SELECT USING (
    EXISTS (SELECT 1 FROM companies WHERE id = compliance_tracking.company_id AND founder_id = auth.uid())
);
CREATE POLICY "Admins can manage all compliance tracking" ON compliance_tracking FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Founders can view own reminder logs" ON reminder_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM companies WHERE id = reminder_logs.company_id AND founder_id = auth.uid())
);
CREATE POLICY "Admins can manage all reminder logs" ON reminder_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Functions for automation

-- Function to check if authorisation is expired
CREATE OR REPLACE FUNCTION check_authorisation_expiry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.signed_at IS NOT NULL AND NEW.expires_at IS NULL THEN
        NEW.expires_at = NEW.signed_at + INTERVAL '90 days';
    END IF;
    
    IF NEW.expires_at IS NOT NULL AND NEW.expires_at < NOW() THEN
        NEW.is_valid = false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER authorisation_expiry_check
    BEFORE INSERT OR UPDATE ON authorisations
    FOR EACH ROW EXECUTE FUNCTION check_authorisation_expiry();

-- Function to set follow-up dates on submissions
CREATE OR REPLACE FUNCTION set_submission_followup()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.submitted_at IS NOT NULL AND NEW.due_followup_at IS NULL THEN
        NEW.due_followup_at = NEW.submitted_at + INTERVAL '30 days';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER submission_followup_trigger
    BEFORE INSERT OR UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION set_submission_followup();

-- Function to get company eligibility summary
CREATE OR REPLACE FUNCTION get_company_eligibility_summary(company_uuid UUID)
RETURNS TABLE (
    scheme_type scheme_type,
    latest_result eligibility_result,
    check_date TIMESTAMP WITH TIME ZONE,
    key_issues TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (ec.scheme)
        ec.scheme,
        ec.result,
        ec.performed_at,
        ARRAY(SELECT jsonb_array_elements_text(ec.reasons))
    FROM eligibility_checks ec
    WHERE ec.company_id = company_uuid
    ORDER BY ec.scheme, ec.performed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get document checklist status
CREATE OR REPLACE FUNCTION get_document_checklist(round_uuid UUID)
RETURNS TABLE (
    document_type document_type,
    is_uploaded BOOLEAN,
    is_verified BOOLEAN,
    uploaded_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    WITH required_docs AS (
        SELECT unnest(ARRAY['business_plan', 'financial_forecast', 'articles_of_association', 
                           'share_register', 'accounts', 'hmrc_checklist', 'cover_letter', 
                           'authorisation_letter']::document_type[]) as doc_type
    )
    SELECT 
        rd.doc_type,
        d.id IS NOT NULL as is_uploaded,
        COALESCE(d.is_verified, false) as is_verified,
        d.uploaded_at
    FROM required_docs rd
    LEFT JOIN documents d ON d.document_type = rd.doc_type AND d.round_id = round_uuid
    ORDER BY rd.doc_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
