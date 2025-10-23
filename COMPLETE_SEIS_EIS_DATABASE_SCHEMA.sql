-- ===================================================================
-- COMPLETE SEIS/EIS DATABASE SCHEMA
-- Run this to create all required tables for the SEIS/EIS workflow
-- ===================================================================

-- 1. Ensure companies table exists first
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    founder_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    crn TEXT UNIQUE NOT NULL,
    incorporation_date DATE NOT NULL,
    registered_address TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    utr_number TEXT,
    website TEXT,
    is_seis_candidate BOOLEAN DEFAULT false,
    is_eis_candidate BOOLEAN DEFAULT false,
    previous_seis_rounds INTEGER DEFAULT 0,
    previous_eis_rounds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create funding_rounds table
CREATE TABLE IF NOT EXISTS funding_rounds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    scheme TEXT NOT NULL CHECK (scheme IN ('SEIS', 'EIS', 'BOTH')),
    amount_to_raise INTEGER NOT NULL,
    use_of_funds TEXT,
    first_time_applicant BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'submitted', 'query', 'approved', 'rejected')),
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    round_id UUID REFERENCES funding_rounds(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT,
    is_verified BOOLEAN DEFAULT false,
    verification_notes TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create eligibility_checks table
CREATE TABLE IF NOT EXISTS eligibility_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    round_id UUID REFERENCES funding_rounds(id) ON DELETE CASCADE,
    scheme TEXT NOT NULL CHECK (scheme IN ('SEIS', 'EIS', 'BOTH')),
    result TEXT NOT NULL CHECK (result IN ('ELIGIBLE', 'INELIGIBLE', 'REVIEW_REQUIRED')),
    reasons TEXT[],
    checks_performed JSONB,
    performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    round_id UUID REFERENCES funding_rounds(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'processing', 'query', 'approved', 'rejected')),
    submission_type TEXT NOT NULL CHECK (submission_type IN ('SEIS', 'EIS', 'BOTH')),
    hmrc_reference TEXT,
    response_received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create agent_appointments table
CREATE TABLE IF NOT EXISTS agent_appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    director_name TEXT NOT NULL,
    director_email TEXT NOT NULL,
    director_title TEXT DEFAULT 'Director',
    start_date DATE NOT NULL,
    document_content TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'completed')),
    signed_at TIMESTAMPTZ,
    docusign_envelope_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_funding_rounds_company_id ON funding_rounds(company_id);
CREATE INDEX IF NOT EXISTS idx_funding_rounds_status ON funding_rounds(status);
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_round_id ON documents(round_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_eligibility_checks_company_id ON eligibility_checks(company_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_checks_round_id ON eligibility_checks(round_id);
CREATE INDEX IF NOT EXISTS idx_submissions_company_id ON submissions(company_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_agent_appointments_company_id ON agent_appointments(company_id);

-- 7. Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_appointments ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for companies
DROP POLICY IF EXISTS "Users can view own companies" ON companies;
DROP POLICY IF EXISTS "Users can manage own companies" ON companies;
DROP POLICY IF EXISTS "Service role can manage all companies" ON companies;

CREATE POLICY "Users can view own companies" ON companies
    FOR SELECT USING (founder_id = auth.uid());

CREATE POLICY "Users can manage own companies" ON companies
    FOR ALL USING (founder_id = auth.uid());

CREATE POLICY "Service role can manage all companies" ON companies
    FOR ALL USING (auth.role() = 'service_role');

-- 9. Create RLS policies for funding_rounds
DROP POLICY IF EXISTS "Users can view own funding rounds" ON funding_rounds;
DROP POLICY IF EXISTS "Users can manage own funding rounds" ON funding_rounds;
DROP POLICY IF EXISTS "Service role can manage all funding rounds" ON funding_rounds;

CREATE POLICY "Users can view own funding rounds" ON funding_rounds
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM companies WHERE founder_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own funding rounds" ON funding_rounds
    FOR ALL USING (
        company_id IN (
            SELECT id FROM companies WHERE founder_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage all funding rounds" ON funding_rounds
    FOR ALL USING (auth.role() = 'service_role');

-- 9. Create RLS policies for documents
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can manage own documents" ON documents;
DROP POLICY IF EXISTS "Service role can manage all documents" ON documents;

CREATE POLICY "Users can view own documents" ON documents
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM companies WHERE founder_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own documents" ON documents
    FOR ALL USING (
        company_id IN (
            SELECT id FROM companies WHERE founder_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage all documents" ON documents
    FOR ALL USING (auth.role() = 'service_role');

-- 10. Create RLS policies for eligibility_checks
DROP POLICY IF EXISTS "Users can view own eligibility checks" ON eligibility_checks;
DROP POLICY IF EXISTS "Users can manage own eligibility checks" ON eligibility_checks;
DROP POLICY IF EXISTS "Service role can manage all eligibility checks" ON eligibility_checks;

CREATE POLICY "Users can view own eligibility checks" ON eligibility_checks
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM companies WHERE founder_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own eligibility checks" ON eligibility_checks
    FOR ALL USING (
        company_id IN (
            SELECT id FROM companies WHERE founder_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage all eligibility checks" ON eligibility_checks
    FOR ALL USING (auth.role() = 'service_role');

-- 11. Create RLS policies for submissions
DROP POLICY IF EXISTS "Users can view own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can manage own submissions" ON submissions;
DROP POLICY IF EXISTS "Service role can manage all submissions" ON submissions;

CREATE POLICY "Users can view own submissions" ON submissions
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM companies WHERE founder_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own submissions" ON submissions
    FOR ALL USING (
        company_id IN (
            SELECT id FROM companies WHERE founder_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage all submissions" ON submissions
    FOR ALL USING (auth.role() = 'service_role');

-- 12. Create RLS policies for agent_appointments
DROP POLICY IF EXISTS "Users can view own agent appointments" ON agent_appointments;
DROP POLICY IF EXISTS "Users can manage own agent appointments" ON agent_appointments;
DROP POLICY IF EXISTS "Service role can manage all agent appointments" ON agent_appointments;

CREATE POLICY "Users can view own agent appointments" ON agent_appointments
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM companies WHERE founder_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own agent appointments" ON agent_appointments
    FOR ALL USING (
        company_id IN (
            SELECT id FROM companies WHERE founder_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage all agent appointments" ON agent_appointments
    FOR ALL USING (auth.role() = 'service_role');

-- 13. Grant permissions
GRANT ALL ON companies TO authenticated;
GRANT ALL ON companies TO service_role;
GRANT ALL ON funding_rounds TO authenticated;
GRANT ALL ON funding_rounds TO service_role;
GRANT ALL ON documents TO authenticated;
GRANT ALL ON documents TO service_role;
GRANT ALL ON eligibility_checks TO authenticated;
GRANT ALL ON eligibility_checks TO service_role;
GRANT ALL ON submissions TO authenticated;
GRANT ALL ON submissions TO service_role;
GRANT ALL ON agent_appointments TO authenticated;
GRANT ALL ON agent_appointments TO service_role;

-- 14. Create triggers for updated_at timestamps
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_funding_rounds_updated_at ON funding_rounds;
CREATE TRIGGER update_funding_rounds_updated_at
    BEFORE UPDATE ON funding_rounds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_submissions_updated_at ON submissions;
CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agent_appointments_updated_at ON agent_appointments;
CREATE TRIGGER update_agent_appointments_updated_at
    BEFORE UPDATE ON agent_appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 15. Create storage bucket for documents (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('seis-eis-documents', 'seis-eis-documents', true)
ON CONFLICT (id) DO NOTHING;

-- 16. Create storage policies
DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete documents" ON storage.objects;

CREATE POLICY "Users can upload documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'seis-eis-documents' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can view documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'seis-eis-documents' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'seis-eis-documents' AND
        auth.role() = 'authenticated'
    );

-- 17. Verification queries
SELECT 'Database schema setup complete!' as status;

SELECT 'Tables created:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('funding_rounds', 'documents', 'eligibility_checks', 'submissions', 'agent_appointments')
AND table_schema = 'public';

SELECT 'Storage bucket created:' as info;
SELECT name FROM storage.buckets WHERE name = 'seis-eis-documents';

SELECT '✅ SEIS/EIS database schema is ready!' as result;
