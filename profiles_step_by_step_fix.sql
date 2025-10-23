-- Step-by-step fix for profiles table
-- Run each section one at a time if you get errors

-- STEP 1: Create basic profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 2: Add missing columns one by one
-- Run these individually if you get column exists errors

-- Add roles column
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'roles') THEN
    ALTER TABLE profiles ADD COLUMN roles TEXT[] DEFAULT ARRAY['founder'];
  END IF;
END $$;

-- Add active_role column  
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'active_role') THEN
    ALTER TABLE profiles ADD COLUMN active_role VARCHAR(20) DEFAULT 'founder';
  END IF;
END $$;

-- Add investor_profile column
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'investor_profile') THEN
    ALTER TABLE profiles ADD COLUMN investor_profile JSONB;
  END IF;
END $$;

-- STEP 3: Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- STEP 4: Drop existing policies (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Service role can read all profiles" ON profiles;

-- STEP 5: Create new RLS policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can read all profiles" ON profiles
  FOR SELECT USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- STEP 6: Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

-- STEP 7: Create or replace the new user handler function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, roles, active_role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'user',
    ARRAY['founder'],
    'founder'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 8: Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 9: Update existing profiles with default values
UPDATE profiles 
SET 
  roles = COALESCE(roles, ARRAY['founder']),
  active_role = COALESCE(active_role, 'founder'),
  role = COALESCE(role, 'user')
WHERE roles IS NULL OR active_role IS NULL OR role IS NULL;

-- STEP 10: Create profiles for existing users who don't have them
INSERT INTO profiles (id, full_name, email, role, roles, active_role)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as full_name,
  au.email,
  'user' as role,
  ARRAY['founder'] as roles,
  'founder' as active_role
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- STEP 11: Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active_role ON profiles(active_role);

-- STEP 12: Grant execute permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;

-- Verification query
SELECT 
  'Setup completed successfully!' as status,
  COUNT(*) as total_profiles
FROM profiles;
