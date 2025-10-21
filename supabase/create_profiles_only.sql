-- Create only the essential tables to get started
-- Run this first in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the user_role enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('founder', 'investor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create subscription_status enum
DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create plan_type enum with all values
DO $$ BEGIN
    CREATE TYPE plan_type AS ENUM ('free', 'ai_enabled', 'seis_eis_plan');
EXCEPTION
    WHEN duplicate_object THEN 
        -- Try to add missing values if type exists
        BEGIN
            ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'seis_eis_plan';
        EXCEPTION
            WHEN OTHERS THEN null;
        END;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    company_name TEXT,
    role user_role DEFAULT 'founder',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status subscription_status DEFAULT 'inactive',
    plan_type plan_type DEFAULT 'free',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create basic RLS policies for subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
CREATE POLICY "Users can update own subscriptions" ON subscriptions FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
CREATE POLICY "Users can insert own subscriptions" ON subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
    
    INSERT INTO subscriptions (user_id, status, plan_type)
    VALUES (NEW.id, 'inactive', 'free');
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- If there's an error, still return NEW to allow user creation
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Verify tables were created
SELECT 'profiles' as table_name, count(*) as exists 
FROM information_schema.tables 
WHERE table_name = 'profiles'
UNION ALL
SELECT 'subscriptions' as table_name, count(*) as exists 
FROM information_schema.tables 
WHERE table_name = 'subscriptions';
