# Fix Profiles Table Permissions Error

## 🚨 **Error**: `permission denied for table profiles`

This error occurs because the `profiles` table doesn't have proper Row Level Security (RLS) policies set up in your Supabase database.

## 🔧 **Quick Fix Steps**

### **Step 1: Run the Profiles Setup SQL**

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste the entire contents of `profiles_permissions_fix.sql`**
4. **Click "Run"** to execute the SQL

This will:
- ✅ Create the profiles table (if it doesn't exist)
- ✅ Set up proper RLS policies
- ✅ Grant necessary permissions
- ✅ Create automatic profile creation for new users
- ✅ Add profiles for existing users

### **Step 2: Verify the Fix**

After running the SQL, test the application:

```bash
npm run dev
```

1. **Sign in to your app**
2. **Navigate around** - no more permission errors
3. **Check browser console** - should see successful auth state logs

## 🛠 **What the Fix Does**

### **Creates Proper RLS Policies:**
```sql
-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can only insert their own profile  
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### **Grants Proper Permissions:**
```sql
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON profiles TO authenticated;
```

### **Auto-Creates Profiles:**
```sql
-- Trigger function to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, roles, active_role)
  VALUES (NEW.id, ..., 'user', ARRAY['founder'], 'founder');
  RETURN NEW;
END;
```

## 🔍 **Root Cause**

The error happened because:

1. **Missing RLS Policies**: The profiles table had RLS enabled but no policies
2. **No Permissions**: Authenticated users couldn't access the table
3. **Middleware Access**: The middleware tried to check admin roles but got blocked

## ✅ **After the Fix**

- ✅ **Authentication works**: Users can sign in without errors
- ✅ **Navigation works**: No more permission denied errors
- ✅ **Profiles auto-created**: New users get profiles automatically
- ✅ **Admin access**: Proper role checking for admin routes
- ✅ **Role switching**: The role switcher component will work

## 🧪 **Test the Fix**

### **Test Authentication:**
1. Sign out and sign back in
2. Check that no console errors appear
3. Navigate to different pages

### **Test Profile Creation:**
1. Register a new user
2. Check that profile is created automatically
3. Verify role is set to 'founder'

### **Test Admin Access:**
1. Try accessing `/admin` routes
2. Should redirect to dashboard (unless you're admin)
3. No permission errors in console

## 🚨 **If You Still Get Errors**

### **Check Supabase Logs:**
1. Go to Supabase Dashboard → Logs
2. Look for any RLS policy violations
3. Check if the SQL ran successfully

### **Verify Table Structure:**
```sql
-- Run this in SQL Editor to check
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';
```

### **Check RLS Policies:**
```sql
-- Run this to see active policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';
```

## 📝 **Manual Alternative**

If the automated fix doesn't work, you can manually create a profile:

```sql
-- Replace 'your-user-id' with your actual user ID from auth.users
INSERT INTO profiles (id, full_name, email, role, roles, active_role)
VALUES (
  'your-user-id',
  'Your Name',
  'your-email@example.com',
  'user',
  ARRAY['founder'],
  'founder'
);
```

Run the `profiles_permissions_fix.sql` file and the permission error should be resolved! 🎉
