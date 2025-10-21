-- Test user creation and debug issues
-- Run this in Supabase SQL Editor

-- 1. Check if RLS is enabled and causing issues
SELECT schemaname, tablename,
       CASE WHEN rowsecurity THEN 'RLS ENABLED' ELSE 'RLS DISABLED' END as rls_status
FROM pg_tables
WHERE tablename = 'profiles';

-- 2. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';

-- 3. Temporarily disable RLS if it's causing issues
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 4. Test direct insert
INSERT INTO profiles (id, email, full_name)
VALUES ('test-user-123', 'test@example.com', 'Test User');

-- 5. Check if insert worked
SELECT * FROM profiles WHERE email = 'test@example.com';

-- 6. Clean up test data
DELETE FROM profiles WHERE email = 'test@example.com';

-- 7. Re-enable RLS with a simple policy
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable all for authenticated users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a simple policy that allows everything for now
CREATE POLICY "Allow all authenticated operations" ON profiles
    FOR ALL USING (auth.role() = 'authenticated');

SELECT 'Debug setup complete' as status;
