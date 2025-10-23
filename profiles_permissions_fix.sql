-- Fix profiles table permissions
-- Run this in your Supabase SQL Editor

-- First, let's check if the profiles table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT ARRAY['founder'];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_role VARCHAR(20) DEFAULT 'founder';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS investor_profile JSONB;

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;

-- Create comprehensive RLS policies for profiles
-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy 2: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy 4: Allow service role to read all profiles (for admin functions)
CREATE POLICY "Service role can read all profiles" ON profiles
  FOR SELECT USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

-- Create function to handle new user profile creation
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

-- Create trigger to automatically create profile for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active_role ON profiles(active_role);

-- Update existing profiles to have the new columns with default values
UPDATE profiles 
SET 
  roles = COALESCE(roles, ARRAY['founder']),
  active_role = COALESCE(active_role, 'founder')
WHERE roles IS NULL OR active_role IS NULL;

-- Insert or update profiles for existing users (if any)
-- This will create profiles for users who don't have them yet
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

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION update_profiles_updated_at() TO authenticated;

-- Verify the setup
SELECT 'Profiles table setup completed successfully' as status;
