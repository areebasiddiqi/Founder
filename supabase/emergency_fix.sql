-- Emergency fix for transaction and RLS issues
-- Run each section separately in Supabase SQL Editor

-- SECTION 1: Clear any failed transactions
ROLLBACK;
COMMIT;

-- SECTION 2: Check what exists
SELECT 
    tablename, 
    schemaname,
    tableowner 
FROM pg_tables 
WHERE tablename = 'profiles';

-- SECTION 3: Check RLS policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- SECTION 4: Fix RLS policies (run this if profiles table exists)
-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can access own profile" ON profiles;

-- Disable and re-enable RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, working policies
CREATE POLICY "Enable all for authenticated users based on user_id" ON profiles
    FOR ALL USING (auth.uid() = id);

-- SECTION 5: Check if trigger function exists and fix it
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert into profiles
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    
    -- Insert into subscriptions if table exists
    BEGIN
        INSERT INTO public.subscriptions (user_id, status, plan_type)
        VALUES (NEW.id, 'inactive', 'free');
    EXCEPTION
        WHEN undefined_table THEN
            -- Subscriptions table doesn't exist yet, skip
            NULL;
    END;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail user creation
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION handle_new_user();

-- SECTION 6: Test the setup
SELECT 'Setup complete. Profiles table exists: ' || 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
            THEN 'YES' 
            ELSE 'NO' 
       END as status;
