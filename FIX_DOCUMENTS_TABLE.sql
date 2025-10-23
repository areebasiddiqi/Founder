-- ===================================================================
-- FIX DOCUMENTS TABLE ISSUES
-- This fixes column name mismatches and NOT NULL constraints
-- ===================================================================

-- 1. Check current documents table structure
SELECT 'Current documents table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'documents' 
ORDER BY ordinal_position;

-- 2. Drop the table and recreate it properly (safer approach)
DROP TABLE IF EXISTS documents CASCADE;

-- 3. Recreate documents table with correct structure
CREATE TABLE documents (
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

-- Note: round_id is nullable to allow documents not tied to specific rounds

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_round_id ON documents(round_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);

-- 5. Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
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

-- 7. Grant permissions
GRANT ALL ON documents TO authenticated;
GRANT ALL ON documents TO service_role;

-- 8. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Verify the table structure
SELECT 'Fixed documents table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'documents' 
ORDER BY ordinal_position;

-- Success message
SELECT '✅ Documents table fixed!' as result;
