-- ===================================================================
-- FIX FUNDING_ROUNDS TABLE ISSUES
-- This fixes missing columns and constraint issues
-- ===================================================================

-- 1. Check current funding_rounds table structure
SELECT 'Current funding_rounds table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'funding_rounds' 
ORDER BY ordinal_position;

-- 2. Drop the table and recreate it properly (safer approach)
DROP TABLE IF EXISTS funding_rounds CASCADE;

-- 3. Recreate funding_rounds table with correct structure
CREATE TABLE funding_rounds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    scheme TEXT CHECK (scheme IN ('SEIS', 'EIS', 'BOTH')),
    amount_to_raise INTEGER,
    use_of_funds TEXT,
    first_time_applicant BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'submitted', 'query', 'approved', 'rejected')),
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_funding_rounds_company_id ON funding_rounds(company_id);
CREATE INDEX IF NOT EXISTS idx_funding_rounds_status ON funding_rounds(status);

-- 5. Enable RLS
ALTER TABLE funding_rounds ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
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

-- 7. Grant permissions
GRANT ALL ON funding_rounds TO authenticated;
GRANT ALL ON funding_rounds TO service_role;

-- 8. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_funding_rounds_updated_at ON funding_rounds;
CREATE TRIGGER update_funding_rounds_updated_at
    BEFORE UPDATE ON funding_rounds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Also fix documents table to reference funding_rounds properly
-- Drop and recreate foreign key constraint
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_round_id_fkey;
ALTER TABLE documents ADD CONSTRAINT documents_round_id_fkey 
    FOREIGN KEY (round_id) REFERENCES funding_rounds(id) ON DELETE CASCADE;

-- 10. Fix eligibility_checks table foreign key
ALTER TABLE eligibility_checks DROP CONSTRAINT IF EXISTS eligibility_checks_round_id_fkey;
ALTER TABLE eligibility_checks ADD CONSTRAINT eligibility_checks_round_id_fkey 
    FOREIGN KEY (round_id) REFERENCES funding_rounds(id) ON DELETE CASCADE;

-- 11. Fix submissions table foreign key
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_round_id_fkey;
ALTER TABLE submissions ADD CONSTRAINT submissions_round_id_fkey 
    FOREIGN KEY (round_id) REFERENCES funding_rounds(id) ON DELETE CASCADE;

-- 12. Verify the table structure
SELECT 'Fixed funding_rounds table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'funding_rounds' 
ORDER BY ordinal_position;

-- Success message
SELECT '✅ Funding rounds table fixed!' as result;
