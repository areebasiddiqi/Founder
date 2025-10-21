-- NUCLEAR RESET - Complete database reset
-- WARNING: This will delete ALL data in your database
-- Only use this if you're okay with losing all existing data

-- Step 1: Drop everything
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Step 2: Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

-- Step 3: Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 4: Create minimal tables without any complexity
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'founder',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    plan_type TEXT DEFAULT 'free',
    status TEXT DEFAULT 'inactive',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: NO RLS for now - just basic access
-- We'll add security later once it's working

-- Step 6: Simple trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
    
    INSERT INTO subscriptions (user_id, plan_type, status)
    VALUES (NEW.id, 'free', 'inactive');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 8: Verify
SELECT 'Database reset complete' as status;
