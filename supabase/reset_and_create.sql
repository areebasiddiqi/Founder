-- Reset transaction and create tables from scratch
-- Run this in your Supabase SQL Editor

-- First, rollback any failed transaction
ROLLBACK;

-- Start fresh
BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (to start clean)
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS plan_type CASCADE;

-- Create enums
CREATE TYPE user_role AS ENUM ('founder', 'investor', 'admin');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled');
CREATE TYPE plan_type AS ENUM ('free', 'ai_enabled', 'seis_eis_plan');

-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    company_name TEXT,
    role user_role DEFAULT 'founder',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE subscriptions (
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

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles 
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions 
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions" ON subscriptions 
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subscriptions" ON subscriptions 
    FOR INSERT WITH CHECK (user_id = auth.uid());

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
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Commit the transaction
COMMIT;

-- Verify tables exist
SELECT 
    schemaname, 
    tablename 
FROM pg_tables 
WHERE tablename IN ('profiles', 'subscriptions')
ORDER BY tablename;
