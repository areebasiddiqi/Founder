-- ===================================================================
-- FIX COMPANIES-PROFILES RELATIONSHIP
-- This creates the missing foreign key relationship
-- ===================================================================

-- 1. Check current table structures
SELECT 'Current companies table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'companies' 
ORDER BY ordinal_position;

SELECT 'Current profiles table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. Check existing foreign key constraints
SELECT 'Existing foreign key constraints on companies:' as info;
SELECT conname, conrelid::regclass AS table_name, confrelid::regclass AS referenced_table
FROM pg_constraint 
WHERE contype = 'f' AND conrelid = 'companies'::regclass;

-- 3. Ensure profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'user',
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Ensure companies table has founder_id column
ALTER TABLE companies ADD COLUMN IF NOT EXISTS founder_id UUID;

-- 5. Drop existing foreign key constraint if it exists (to recreate it properly)
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_founder_id_fkey;

-- 6. Create the foreign key relationship between companies.founder_id and profiles.id
ALTER TABLE companies ADD CONSTRAINT companies_founder_id_fkey 
    FOREIGN KEY (founder_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 7. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_companies_founder_id ON companies(founder_id);

-- 8. Enable RLS on profiles if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" ON profiles
    FOR ALL USING (auth.role() = 'service_role');

-- 10. Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

-- 11. Create trigger for updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 12. Verify the relationship was created
SELECT 'Foreign key relationships for companies:' as info;
SELECT conname, conrelid::regclass AS table_name, confrelid::regclass AS referenced_table
FROM pg_constraint 
WHERE contype = 'f' AND conrelid = 'companies'::regclass;

-- 13. Test the relationship with a sample query (this should not error)
SELECT 'Testing relationship query:' as info;
SELECT COUNT(*) as company_count
FROM companies c
LEFT JOIN profiles p ON c.founder_id = p.id;

-- Success message
SELECT '✅ Companies-Profiles relationship fixed!' as result;
