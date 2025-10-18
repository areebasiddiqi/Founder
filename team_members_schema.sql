-- Create team_members table to store individual team member information
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pitch_page_id UUID REFERENCES pitch_pages(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  experience TEXT NOT NULL,
  linkedin_url VARCHAR(500),
  bio TEXT,
  avatar_url VARCHAR(500),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view team members for published pitch pages
CREATE POLICY "Anyone can view team members for published pitches" ON team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pitch_pages 
      WHERE pitch_pages.id = team_members.pitch_page_id 
      AND pitch_pages.is_published = true
    )
  );

-- Policy: Founders can manage their own team members
CREATE POLICY "Founders can manage their team members" ON team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pitch_pages 
      WHERE pitch_pages.id = team_members.pitch_page_id 
      AND pitch_pages.founder_id = auth.uid()
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_team_members_updated_at();
