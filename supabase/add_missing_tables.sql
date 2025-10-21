-- Add missing tables to complete the schema
-- Run this in Supabase SQL Editor

-- Create missing enums first
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

-- Create advance_assurance_applications table (from original schema)
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

-- Create pitch_pages table (from original schema)
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

-- Create investor_verifications table (from original schema)
CREATE TABLE IF NOT EXISTS investor_verifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    investor_type investor_type NOT NULL,
    verification_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for the new tables
CREATE INDEX IF NOT EXISTS idx_applications_founder_id ON advance_assurance_applications(founder_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON advance_assurance_applications(status);
CREATE INDEX IF NOT EXISTS idx_pitch_pages_founder_id ON pitch_pages(founder_id);
CREATE INDEX IF NOT EXISTS idx_pitch_pages_secure_url ON pitch_pages(secure_url);
CREATE INDEX IF NOT EXISTS idx_investor_verifications_email ON investor_verifications(email);

-- Create updated_at triggers for new tables
DROP TRIGGER IF EXISTS update_applications_updated_at ON advance_assurance_applications;
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON advance_assurance_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pitch_pages_updated_at ON pitch_pages;
CREATE TRIGGER update_pitch_pages_updated_at BEFORE UPDATE ON pitch_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on new tables
ALTER TABLE advance_assurance_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_verifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for advance_assurance_applications
CREATE POLICY "Founders can view own applications" ON advance_assurance_applications FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY "Founders can create applications" ON advance_assurance_applications FOR INSERT WITH CHECK (founder_id = auth.uid());
CREATE POLICY "Founders can update own applications" ON advance_assurance_applications FOR UPDATE USING (founder_id = auth.uid());
CREATE POLICY "Admins can view all applications" ON advance_assurance_applications FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create RLS policies for pitch_pages
CREATE POLICY "Founders can view own pitch pages" ON pitch_pages FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY "Founders can create pitch pages" ON pitch_pages FOR INSERT WITH CHECK (founder_id = auth.uid());
CREATE POLICY "Founders can update own pitch pages" ON pitch_pages FOR UPDATE USING (founder_id = auth.uid());
CREATE POLICY "Public can view active pitch pages by secure URL" ON pitch_pages FOR SELECT USING (is_active = true);

-- Create RLS policies for investor_verifications (admin only)
CREATE POLICY "Admins can manage investor verifications" ON investor_verifications FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Update the plan_type enum to include seis_eis_plan if not already there
DO $$ BEGIN
    ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'seis_eis_plan';
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

SELECT 'Missing tables created successfully!' as status;
