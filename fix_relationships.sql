-- Fix foreign key relationships between tables

-- First, ensure profiles table has proper relationship with auth.users
-- The profiles.id should reference auth.users.id
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update pitch_pages to reference profiles instead of auth.users directly
-- This creates a cleaner relationship chain
ALTER TABLE pitch_pages DROP CONSTRAINT IF EXISTS pitch_pages_founder_id_fkey;
ALTER TABLE pitch_pages ADD CONSTRAINT pitch_pages_founder_id_fkey 
  FOREIGN KEY (founder_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Ensure advance_assurance_applications also references profiles
ALTER TABLE advance_assurance_applications DROP CONSTRAINT IF EXISTS advance_assurance_applications_founder_id_fkey;
ALTER TABLE advance_assurance_applications ADD CONSTRAINT advance_assurance_applications_founder_id_fkey 
  FOREIGN KEY (founder_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update conversations table to reference profiles
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_founder_id_fkey;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_investor_id_fkey;
ALTER TABLE conversations ADD CONSTRAINT conversations_founder_id_fkey 
  FOREIGN KEY (founder_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD CONSTRAINT conversations_investor_id_fkey 
  FOREIGN KEY (investor_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update messages table to reference profiles
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update user_roles table to reference profiles
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Create a trigger to ensure profiles are created for new auth users
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, active_role, roles)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
    NEW.email,
    'founder',
    ARRAY['founder']
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;

-- Create trigger for new users
CREATE TRIGGER create_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_user();

-- Ensure existing users have profiles
INSERT INTO profiles (id, full_name, email, active_role, roles)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
  email,
  'founder' as active_role,
  ARRAY['founder'] as roles
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;
