-- ===================================================================
-- FIX AUTHORISATIONS TABLE ISSUES
-- This fixes missing columns in the authorisations table
-- ===================================================================

-- 1. Check if authorisations table exists and its structure
SELECT 'Current authorisations table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'authorisations' 
ORDER BY ordinal_position;

-- 2. Create authorisations table if it doesn't exist
CREATE TABLE IF NOT EXISTS authorisations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add all missing columns to authorisations table
ALTER TABLE authorisations ADD COLUMN IF NOT EXISTS is_valid BOOLEAN DEFAULT false;
ALTER TABLE authorisations ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE authorisations ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;
ALTER TABLE authorisations ADD COLUMN IF NOT EXISTS director_name TEXT;
ALTER TABLE authorisations ADD COLUMN IF NOT EXISTS director_email TEXT;
ALTER TABLE authorisations ADD COLUMN IF NOT EXISTS director_title TEXT DEFAULT 'Director';
ALTER TABLE authorisations ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE authorisations ADD COLUMN IF NOT EXISTS document_content TEXT;
ALTER TABLE authorisations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE authorisations ADD COLUMN IF NOT EXISTS docusign_envelope_id TEXT;

-- 4. Add status check constraint
ALTER TABLE authorisations DROP CONSTRAINT IF EXISTS authorisations_status_check;
ALTER TABLE authorisations ADD CONSTRAINT authorisations_status_check 
    CHECK (status IN ('draft', 'sent', 'signed', 'completed', 'expired'));

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_authorisations_company_id ON authorisations(company_id);
CREATE INDEX IF NOT EXISTS idx_authorisations_is_valid ON authorisations(is_valid);
CREATE INDEX IF NOT EXISTS idx_authorisations_expires_at ON authorisations(expires_at);
CREATE INDEX IF NOT EXISTS idx_authorisations_status ON authorisations(status);

-- 6. Enable RLS
ALTER TABLE authorisations ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
DROP POLICY IF EXISTS "Users can view own authorisations" ON authorisations;
DROP POLICY IF EXISTS "Users can manage own authorisations" ON authorisations;
DROP POLICY IF EXISTS "Service role can manage all authorisations" ON authorisations;

CREATE POLICY "Users can view own authorisations" ON authorisations
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM companies WHERE founder_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own authorisations" ON authorisations
    FOR ALL USING (
        company_id IN (
            SELECT id FROM companies WHERE founder_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage all authorisations" ON authorisations
    FOR ALL USING (auth.role() = 'service_role');

-- 8. Grant permissions
GRANT ALL ON authorisations TO authenticated;
GRANT ALL ON authorisations TO service_role;

-- 9. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_authorisations_updated_at ON authorisations;
CREATE TRIGGER update_authorisations_updated_at
    BEFORE UPDATE ON authorisations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Verify the updated table structure
SELECT 'Updated authorisations table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'authorisations' 
ORDER BY ordinal_position;

-- Success message
SELECT '✅ Authorisations table fixed!' as result;
