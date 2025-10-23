-- ===================================================================
-- SAFE SEIS/EIS DATABASE SETUP
-- This version handles existing tables and missing columns safely
-- ===================================================================

-- 1. First, ensure the update function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Create or update companies table with all required columns
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY
);

-- Add columns one by one to handle existing tables
ALTER TABLE companies ADD COLUMN IF NOT EXISTS founder_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS crn TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS incorporation_date DATE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS registered_address TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS utr_number TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_seis_candidate BOOLEAN DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_eis_candidate BOOLEAN DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS previous_seis_rounds INTEGER DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS previous_eis_rounds INTEGER DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'companies_crn_key'
    ) THEN
        ALTER TABLE companies ADD CONSTRAINT companies_crn_key UNIQUE (crn);
    END IF;
END $$;

-- 3. Create funding_rounds table
CREATE TABLE IF NOT EXISTS funding_rounds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY
);

-- Add columns one by one to handle existing tables
ALTER TABLE funding_rounds ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE funding_rounds ADD COLUMN IF NOT EXISTS scheme TEXT;
ALTER TABLE funding_rounds ADD COLUMN IF NOT EXISTS amount_to_raise INTEGER;
ALTER TABLE funding_rounds ADD COLUMN IF NOT EXISTS use_of_funds TEXT;
ALTER TABLE funding_rounds ADD COLUMN IF NOT EXISTS first_time_applicant BOOLEAN DEFAULT true;
ALTER TABLE funding_rounds ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE funding_rounds ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE funding_rounds ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE funding_rounds ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add foreign key constraint safely
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'funding_rounds_company_id_fkey'
    ) THEN
        ALTER TABLE funding_rounds ADD CONSTRAINT funding_rounds_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add check constraints safely
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'funding_rounds_scheme_check'
    ) THEN
        ALTER TABLE funding_rounds ADD CONSTRAINT funding_rounds_scheme_check 
        CHECK (scheme IN ('SEIS', 'EIS', 'BOTH'));
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'funding_rounds_status_check'
    ) THEN
        ALTER TABLE funding_rounds ADD CONSTRAINT funding_rounds_status_check 
        CHECK (status IN ('draft', 'ready', 'submitted', 'query', 'approved', 'rejected'));
    END IF;
END $$;

-- 4. Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY
);

-- Add columns one by one to handle existing tables
ALTER TABLE documents ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS round_id UUID;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_type TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS filename TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS verification_notes TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE documents ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add foreign key constraints safely (after columns exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'documents_company_id_fkey'
    ) THEN
        ALTER TABLE documents ADD CONSTRAINT documents_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'documents_round_id_fkey'
    ) THEN
        ALTER TABLE documents ADD CONSTRAINT documents_round_id_fkey 
        FOREIGN KEY (round_id) REFERENCES funding_rounds(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Create eligibility_checks table
CREATE TABLE IF NOT EXISTS eligibility_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY
);

-- Add columns one by one to handle existing tables
ALTER TABLE eligibility_checks ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE eligibility_checks ADD COLUMN IF NOT EXISTS round_id UUID;
ALTER TABLE eligibility_checks ADD COLUMN IF NOT EXISTS scheme TEXT;
ALTER TABLE eligibility_checks ADD COLUMN IF NOT EXISTS result TEXT;
ALTER TABLE eligibility_checks ADD COLUMN IF NOT EXISTS reasons TEXT[];
ALTER TABLE eligibility_checks ADD COLUMN IF NOT EXISTS checks_performed JSONB;
ALTER TABLE eligibility_checks ADD COLUMN IF NOT EXISTS performed_by UUID;
ALTER TABLE eligibility_checks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add foreign key constraints safely
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'eligibility_checks_company_id_fkey'
    ) THEN
        ALTER TABLE eligibility_checks ADD CONSTRAINT eligibility_checks_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'eligibility_checks_round_id_fkey'
    ) THEN
        ALTER TABLE eligibility_checks ADD CONSTRAINT eligibility_checks_round_id_fkey 
        FOREIGN KEY (round_id) REFERENCES funding_rounds(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 6. Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY
);

-- Add columns one by one to handle existing tables
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS round_id UUID;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submitted_by UUID;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'submitted';
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submission_type TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS hmrc_reference TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS response_received_at TIMESTAMPTZ;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add foreign key constraints safely
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'submissions_company_id_fkey'
    ) THEN
        ALTER TABLE submissions ADD CONSTRAINT submissions_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'submissions_round_id_fkey'
    ) THEN
        ALTER TABLE submissions ADD CONSTRAINT submissions_round_id_fkey 
        FOREIGN KEY (round_id) REFERENCES funding_rounds(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 7. Create agent_appointments table
CREATE TABLE IF NOT EXISTS agent_appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY
);

-- Add columns one by one to handle existing tables
ALTER TABLE agent_appointments ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE agent_appointments ADD COLUMN IF NOT EXISTS director_name TEXT;
ALTER TABLE agent_appointments ADD COLUMN IF NOT EXISTS director_email TEXT;
ALTER TABLE agent_appointments ADD COLUMN IF NOT EXISTS director_title TEXT DEFAULT 'Director';
ALTER TABLE agent_appointments ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE agent_appointments ADD COLUMN IF NOT EXISTS document_content TEXT;
ALTER TABLE agent_appointments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE agent_appointments ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;
ALTER TABLE agent_appointments ADD COLUMN IF NOT EXISTS docusign_envelope_id TEXT;
ALTER TABLE agent_appointments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE agent_appointments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add foreign key constraint safely
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'agent_appointments_company_id_fkey'
    ) THEN
        ALTER TABLE agent_appointments ADD CONSTRAINT agent_appointments_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 8. Create indexes
CREATE INDEX IF NOT EXISTS idx_companies_founder_id ON companies(founder_id);
CREATE INDEX IF NOT EXISTS idx_companies_crn ON companies(crn);
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

-- 9. Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_appointments ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies (drop existing first)
DROP POLICY IF EXISTS "Users can view own companies" ON companies;
DROP POLICY IF EXISTS "Users can manage own companies" ON companies;
DROP POLICY IF EXISTS "Service role can manage all companies" ON companies;

CREATE POLICY "Users can view own companies" ON companies
    FOR SELECT USING (founder_id = auth.uid());

CREATE POLICY "Users can manage own companies" ON companies
    FOR ALL USING (founder_id = auth.uid());

CREATE POLICY "Service role can manage all companies" ON companies
    FOR ALL USING (auth.role() = 'service_role');

-- Funding rounds policies
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

-- Documents policies
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

-- Similar policies for other tables...
DROP POLICY IF EXISTS "Users can view own eligibility checks" ON eligibility_checks;
DROP POLICY IF EXISTS "Service role can manage all eligibility checks" ON eligibility_checks;

CREATE POLICY "Users can view own eligibility checks" ON eligibility_checks
    FOR ALL USING (
        company_id IN (
            SELECT id FROM companies WHERE founder_id = auth.uid()
        ) OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS "Users can view own submissions" ON submissions;
DROP POLICY IF EXISTS "Service role can manage all submissions" ON submissions;

CREATE POLICY "Users can view own submissions" ON submissions
    FOR ALL USING (
        company_id IN (
            SELECT id FROM companies WHERE founder_id = auth.uid()
        ) OR auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS "Users can view own agent appointments" ON agent_appointments;
DROP POLICY IF EXISTS "Service role can manage all agent appointments" ON agent_appointments;

CREATE POLICY "Users can view own agent appointments" ON agent_appointments
    FOR ALL USING (
        company_id IN (
            SELECT id FROM companies WHERE founder_id = auth.uid()
        ) OR auth.role() = 'service_role'
    );

-- 11. Grant permissions
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

-- 12. Create triggers for updated_at
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

-- 13. Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('seis-eis-documents', 'seis-eis-documents', true)
ON CONFLICT (id) DO NOTHING;

-- 14. Create storage policies
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
        bucket_id = 'seis-eis-documents'
    );

CREATE POLICY "Users can delete documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'seis-eis-documents' AND
        auth.role() = 'authenticated'
    );

-- 15. Final verification
SELECT 'SEIS/EIS Database Setup Complete!' as status;

SELECT 'Tables created:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('companies', 'funding_rounds', 'documents', 'eligibility_checks', 'submissions', 'agent_appointments')
AND table_schema = 'public'
ORDER BY table_name;

SELECT '✅ Database is ready for SEIS/EIS workflow!' as result;
