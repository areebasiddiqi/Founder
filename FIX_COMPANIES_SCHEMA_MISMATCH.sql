-- ===================================================================
-- FIX COMPANIES TABLE SCHEMA MISMATCH
-- The table has 'company_name' but code expects 'name'
-- ===================================================================

-- Check current companies table structure
SELECT 'Current companies table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'companies' 
ORDER BY ordinal_position;

-- Check for NOT NULL constraints
SELECT 'NOT NULL constraints:' as info;
SELECT column_name, is_nullable
FROM information_schema.columns 
WHERE table_name = 'companies' 
AND is_nullable = 'NO';

-- Option 1: Add 'name' column as an alias/duplicate of 'company_name'
ALTER TABLE companies ADD COLUMN IF NOT EXISTS name TEXT;

-- Option 2: Create a view or update existing data
-- If company_name exists but name doesn't, copy the data
UPDATE companies 
SET name = company_name 
WHERE name IS NULL AND company_name IS NOT NULL;

-- Option 3: Add missing columns that code expects
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
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Create a trigger to keep 'name' and 'company_name' in sync
CREATE OR REPLACE FUNCTION sync_company_name()
RETURNS TRIGGER AS $$
BEGIN
    -- If name is updated, update company_name
    IF NEW.name IS NOT NULL AND NEW.name != OLD.name THEN
        NEW.company_name = NEW.name;
    END IF;
    
    -- If company_name is updated, update name
    IF NEW.company_name IS NOT NULL AND NEW.company_name != OLD.company_name THEN
        NEW.name = NEW.company_name;
    END IF;
    
    -- Ensure at least one is not null
    IF NEW.name IS NULL AND NEW.company_name IS NOT NULL THEN
        NEW.name = NEW.company_name;
    END IF;
    
    IF NEW.company_name IS NULL AND NEW.name IS NOT NULL THEN
        NEW.company_name = NEW.name;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to sync the columns
DROP TRIGGER IF EXISTS sync_company_name_trigger ON companies;
CREATE TRIGGER sync_company_name_trigger
    BEFORE INSERT OR UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION sync_company_name();

-- Grant permissions
GRANT ALL ON companies TO authenticated;
GRANT ALL ON companies TO service_role;
GRANT ALL ON companies TO anon;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_company_name ON companies(company_name);
CREATE INDEX IF NOT EXISTS idx_companies_founder_id ON companies(founder_id);
CREATE INDEX IF NOT EXISTS idx_companies_crn ON companies(crn);

-- Verify the final structure
SELECT 'Companies table after schema fix:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'companies' 
ORDER BY ordinal_position;

-- Success message
SELECT '✅ Companies table schema mismatch fixed!' as status;
