-- Initial setup for FoundersPitch database
-- Run this first to create the basic structure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
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

DO $$ BEGIN
    CREATE TYPE plan_type AS ENUM ('free', 'ai_enabled');
EXCEPTION
    WHEN duplicate_object THEN null;
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

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_assurance_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- RLS policies for advance_assurance_applications
DROP POLICY IF EXISTS "Users can view own applications" ON advance_assurance_applications;
CREATE POLICY "Users can view own applications" ON advance_assurance_applications 
FOR SELECT USING (auth.uid() = founder_id);

DROP POLICY IF EXISTS "Users can insert own applications" ON advance_assurance_applications;
CREATE POLICY "Users can insert own applications" ON advance_assurance_applications 
FOR INSERT WITH CHECK (auth.uid() = founder_id);

DROP POLICY IF EXISTS "Users can update own applications" ON advance_assurance_applications;
CREATE POLICY "Users can update own applications" ON advance_assurance_applications 
FOR UPDATE USING (auth.uid() = founder_id);

-- RLS policies for subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions 
FOR SELECT USING (auth.uid() = user_id);

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

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('documents', 'documents', false, 10485760, '{"application/pdf"}')
ON CONFLICT (id) DO NOTHING;

-- Pitch Pages table
CREATE TABLE pitch_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    founder_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    application_id UUID REFERENCES advance_assurance_applications(id) ON DELETE CASCADE NOT NULL,
    pitch_title TEXT NOT NULL,
    elevator_pitch TEXT NOT NULL,
    problem_statement TEXT NOT NULL,
    solution_description TEXT NOT NULL,
    market_size TEXT,
    business_model TEXT,
    competitive_advantage TEXT,
    financial_projections TEXT,
    team_description TEXT,
    funding_requirements TEXT NOT NULL,
    use_of_funds_detailed TEXT,
    milestones TEXT,
    video_url TEXT,
    demo_url TEXT,
    target_valuation BIGINT,
    minimum_investment BIGINT,
    maximum_investment BIGINT,
    investment_type TEXT DEFAULT 'equity',
    equity_offered TEXT,
    investor_benefits TEXT,
    exit_strategy TEXT,
    risks_challenges TEXT,
    social_media_links TEXT,
    contact_preferences TEXT,
    is_published BOOLEAN DEFAULT false,

    current_traction TEXT,
    monthly_revenue BIGINT,
    custo    -- New fields for enhanced pitch datamer_count INTEGER,
    growth_rate DECIMAL(5,2),
    burn_rate BIGINT,
    product_description TEXT,
    technology_stack TEXT,
    intellectual_property TEXT,
    target_customers TEXT,
    marketing_strategy TEXT,
    customer_acquisition_cost BIGINT,
    customer_lifetime_value BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on pitch_pages
ALTER TABLE pitch_pages ENABLE ROW LEVEL SECURITY;

-- RLS policies for pitch_pages
DROP POLICY IF EXISTS "Users can view own pitch pages" ON pitch_pages;
CREATE POLICY "Users can view own pitch pages" ON pitch_pages 
FOR SELECT USING (auth.uid() = founder_id);

DROP POLICY IF EXISTS "Users can insert own pitch pages" ON pitch_pages;
CREATE POLICY "Users can insert own pitch pages" ON pitch_pages 
FOR INSERT WITH CHECK (auth.uid() = founder_id);

DROP POLICY IF EXISTS "Users can update own pitch pages" ON pitch_pages;
CREATE POLICY "Users can update own pitch pages" ON pitch_pages 
FOR UPDATE USING (auth.uid() = founder_id);

DROP POLICY IF EXISTS "Published pitch pages are viewable by all" ON pitch_pages;
CREATE POLICY "Published pitch pages are viewable by all" ON pitch_pages 
FOR SELECT USING (is_published = true);

-- Note: Storage policies must be created via Supabase Dashboard
-- Go to Storage → Policies in your Supabase dashboard to set up:
-- 1. Allow authenticated users to INSERT into 'documents' bucket
-- 2. Allow authenticated users to SELECT from 'documents' bucket
-- 3. Allow authenticated users to UPDATE in 'documents' bucket  
-- 4. Allow authenticated users to DELETE from 'documents' bucket
