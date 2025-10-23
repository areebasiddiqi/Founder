-- ===================================================================
-- FIX COMPANIES TABLE - Add missing contact_email column
-- ===================================================================

-- Check if companies table exists
SELECT 'Companies table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'companies' 
ORDER BY ordinal_position;

-- Add ALL missing columns that the code expects
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS registered_address TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS incorporation_date DATE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS crn TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS utr_number TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_seis_candidate BOOLEAN DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_eis_candidate BOOLEAN DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS previous_seis_rounds INTEGER DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS previous_eis_rounds INTEGER DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS founder_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for key columns
CREATE INDEX IF NOT EXISTS idx_companies_contact_email ON companies(contact_email);
CREATE INDEX IF NOT EXISTS idx_companies_founder_id ON companies(founder_id);
CREATE INDEX IF NOT EXISTS idx_companies_crn ON companies(crn);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

-- Create or update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the column was added
SELECT 'Companies table after fix:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'companies' 
ORDER BY ordinal_position;

-- Success message
SELECT '✅ Companies table fixed! contact_email column added.' as status;
