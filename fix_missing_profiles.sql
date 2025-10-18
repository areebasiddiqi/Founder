-- Fix missing profiles for existing users

-- First, let's see what users exist without profiles
SELECT 
  u.id, 
  u.email,
  u.raw_user_meta_data->>'full_name' as full_name,
  p.id as profile_exists
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Create profiles for all users that don't have them
INSERT INTO profiles (id, full_name, email, active_role, roles, created_at, updated_at)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) as full_name,
  u.email,
  'founder' as active_role,
  ARRAY['founder'] as roles,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
  updated_at = NOW();

-- Also create default user_roles entries for users without them
INSERT INTO user_roles (user_id, role, is_active, created_at)
SELECT 
  p.id,
  'founder' as role,
  true as is_active,
  NOW() as created_at
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id AND ur.role = 'founder'
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO UPDATE SET
  is_active = true;

-- Verify the fix worked
SELECT 
  'Users without profiles' as check_type,
  COUNT(*) as count
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 
  'Users without founder role' as check_type,
  COUNT(*) as count
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id AND ur.role = 'founder'
WHERE ur.user_id IS NULL;
