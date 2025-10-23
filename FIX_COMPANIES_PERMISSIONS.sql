-- ===================================================================
-- FIX COMPANIES TABLE PERMISSIONS
-- Run this to fix permission issues and add missing columns
-- ===================================================================

-- First, check what tables exist and their permissions
SELECT 'Current tables:' as info;
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'companies';

-- Check current companies table structure
SELECT 'Companies table current structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'companies' 
ORDER BY ordinal_position;

-- Enable RLS on companies table if not already enabled
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own companies" ON companies;
DROP POLICY IF EXISTS "Users can insert own companies" ON companies;
DROP POLICY IF EXISTS "Users can update own companies" ON companies;
DROP POLICY IF EXISTS "Service role can manage all companies" ON companies;

-- Grant basic permissions to roles
GRANT ALL ON companies TO authenticated;
GRANT ALL ON companies TO service_role;
GRANT ALL ON companies TO anon;

-- Add missing columns (this should work now with proper permissions)
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

-- Create RLS policies for proper access control
CREATE POLICY "Users can view own companies" ON companies
    FOR SELECT USING (auth.uid() = founder_id);

CREATE POLICY "Users can insert own companies" ON companies
    FOR INSERT WITH CHECK (auth.uid() = founder_id);

CREATE POLICY "Users can update own companies" ON companies
    FOR UPDATE USING (auth.uid() = founder_id);

CREATE POLICY "Service role can manage all companies" ON companies
    FOR ALL USING (auth.role() = 'service_role');

-- Create or update trigger function for updated_at
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

-- Verify the final table structure
SELECT 'Companies table after fix:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'companies' 
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 'RLS Policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'companies';

-- Success message
SELECT '✅ Companies table permissions and columns fixed!' as status;
