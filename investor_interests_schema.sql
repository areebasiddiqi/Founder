-- Create investor_interests table to store investor interest submissions
CREATE TABLE investor_interests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pitch_page_id UUID REFERENCES pitch_pages(id) ON DELETE CASCADE,
  investor_name VARCHAR(255) NOT NULL,
  investor_email VARCHAR(255) NOT NULL,
  investor_company VARCHAR(255),
  investment_amount VARCHAR(100),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for investor_interests
ALTER TABLE investor_interests ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert investor interests (for public pitch pages)
CREATE POLICY "Anyone can submit investor interests" ON investor_interests
  FOR INSERT WITH CHECK (true);

-- Policy: Founders can view interests for their own pitch pages
CREATE POLICY "Founders can view interests for their pitches" ON investor_interests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pitch_pages 
      WHERE pitch_pages.id = investor_interests.pitch_page_id 
      AND pitch_pages.founder_id = auth.uid()
    )
  );

-- Policy: Founders can update interest status for their own pitch pages
CREATE POLICY "Founders can update interests for their pitches" ON investor_interests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM pitch_pages 
      WHERE pitch_pages.id = investor_interests.pitch_page_id 
      AND pitch_pages.founder_id = auth.uid()
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_investor_interests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_investor_interests_updated_at
  BEFORE UPDATE ON investor_interests
  FOR EACH ROW
  EXECUTE FUNCTION update_investor_interests_updated_at();

-- Add index for better performance
CREATE INDEX idx_investor_interests_pitch_page_id ON investor_interests(pitch_page_id);
CREATE INDEX idx_investor_interests_status ON investor_interests(status);
CREATE INDEX idx_investor_interests_created_at ON investor_interests(created_at DESC);
