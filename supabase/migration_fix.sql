-- Migration script to fix the database schema
-- Run this in your Supabase SQL Editor

-- First, check if the database is completely empty and create everything from scratch
-- OR if it has existing data, we'll need to migrate carefully

-- Option 1: If your database is empty (recommended for development)
-- Drop everything and recreate (ONLY if you don't have important data)

-- Uncomment the lines below ONLY if your database is empty:
-- DROP SCHEMA IF EXISTS public CASCADE;
-- CREATE SCHEMA public;
-- GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
-- GRANT ALL ON SCHEMA public TO postgres, service_role;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
-- GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types (updated to include seis_eis_plan)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('founder', 'investor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE investor_type AS ENUM ('hnw', 'sophisticated', 'angel_vc');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Updated plan_type to include seis_eis_plan
DO $$ BEGIN
    CREATE TYPE plan_type AS ENUM ('free', 'ai_enabled', 'seis_eis_plan');
EXCEPTION
    WHEN duplicate_object THEN 
        -- If type exists, add the new value
        ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'seis_eis_plan';
END $$;

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    company_name TEXT,
    role user_role DEFAULT 'founder',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create advance_assurance_applications table
CREATE TABLE IF NOT EXISTS advance_assurance_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    founder_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    company_name TEXT NOT NULL,
    incorporation_date DATE NOT NULL,
    utr_number TEXT,
    registered_address TEXT NOT NULL,
    directors JSONB NOT NULL DEFAULT '[]',
    shareholders JSONB NOT NULL DEFAULT '[]',
    investment_summary TEXT NOT NULL,
    use_of_funds TEXT NOT NULL,
    business_plan_url TEXT,
    pitch_deck_url TEXT,
    status application_status DEFAULT 'draft',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pitch_pages table
CREATE TABLE IF NOT EXISTS pitch_pages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    founder_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    application_id UUID REFERENCES advance_assurance_applications(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    video_url TEXT,
    business_plan_url TEXT,
    overview TEXT NOT NULL,
    target_raise DECIMAL(15,2) NOT NULL,
    valuation DECIMAL(15,2),
    sector TEXT NOT NULL,
    milestones TEXT,
    team_info TEXT,
    secure_url TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create investor_verifications table
CREATE TABLE IF NOT EXISTS investor_verifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    investor_type investor_type NOT NULL,
    verification_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_applications_founder_id ON advance_assurance_applications(founder_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON advance_assurance_applications(status);
CREATE INDEX IF NOT EXISTS idx_pitch_pages_founder_id ON pitch_pages(founder_id);
CREATE INDEX IF NOT EXISTS idx_pitch_pages_secure_url ON pitch_pages(secure_url);
CREATE INDEX IF NOT EXISTS idx_investor_verifications_email ON investor_verifications(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_applications_updated_at ON advance_assurance_applications;
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON advance_assurance_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pitch_pages_updated_at ON pitch_pages;
CREATE TRIGGER update_pitch_pages_updated_at BEFORE UPDATE ON pitch_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_assurance_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Drop existing application policies
DROP POLICY IF EXISTS "Founders can view own applications" ON advance_assurance_applications;
DROP POLICY IF EXISTS "Founders can create applications" ON advance_assurance_applications;
DROP POLICY IF EXISTS "Founders can update own applications" ON advance_assurance_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON advance_assurance_applications;

-- Applications policies
CREATE POLICY "Founders can view own applications" ON advance_assurance_applications FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY "Founders can create applications" ON advance_assurance_applications FOR INSERT WITH CHECK (founder_id = auth.uid());
CREATE POLICY "Founders can update own applications" ON advance_assurance_applications FOR UPDATE USING (founder_id = auth.uid());
CREATE POLICY "Admins can view all applications" ON advance_assurance_applications FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Drop existing pitch page policies
DROP POLICY IF EXISTS "Founders can view own pitch pages" ON pitch_pages;
DROP POLICY IF EXISTS "Founders can create pitch pages" ON pitch_pages;
DROP POLICY IF EXISTS "Founders can update own pitch pages" ON pitch_pages;
DROP POLICY IF EXISTS "Public can view active pitch pages by secure URL" ON pitch_pages;

-- Pitch pages policies
CREATE POLICY "Founders can view own pitch pages" ON pitch_pages FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY "Founders can create pitch pages" ON pitch_pages FOR INSERT WITH CHECK (founder_id = auth.uid());
CREATE POLICY "Founders can update own pitch pages" ON pitch_pages FOR UPDATE USING (founder_id = auth.uid());
CREATE POLICY "Public can view active pitch pages by secure URL" ON pitch_pages FOR SELECT USING (is_active = true);

-- Drop existing investor verification policies
DROP POLICY IF EXISTS "Admins can manage investor verifications" ON investor_verifications;

-- Investor verifications policies (admin only)
CREATE POLICY "Admins can manage investor verifications" ON investor_verifications FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Drop existing subscription policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own subscriptions" ON subscriptions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can view all subscriptions" ON subscriptions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    
    INSERT INTO subscriptions (user_id, status, plan_type)
    VALUES (NEW.id, 'inactive', 'free');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Success message
SELECT 'Database schema successfully applied! You can now run the SEIS/EIS schema.' as status;
