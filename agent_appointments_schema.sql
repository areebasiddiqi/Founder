-- Agent Appointments Table for SEIS/EIS Applications
-- This table stores the agent appointment documents and their signing status

-- Create agent_appointments table
CREATE TABLE IF NOT EXISTS agent_appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Company Information
  company_name TEXT NOT NULL,
  company_number TEXT NOT NULL,
  registered_address TEXT NOT NULL,
  
  -- Director Information
  director_name TEXT NOT NULL,
  director_email TEXT NOT NULL,
  director_title TEXT DEFAULT 'Director',
  
  -- Agreement Details
  start_date DATE NOT NULL,
  
  -- DocuSign Integration
  envelope_id TEXT, -- DocuSign envelope ID
  status TEXT CHECK (status IN ('draft', 'sent', 'delivered', 'signed', 'completed', 'declined')) DEFAULT 'draft',
  
  -- Document Storage
  document_text TEXT, -- Full text of the agreement
  signed_document_url TEXT, -- URL to signed document (if stored)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_appointments_user_id ON agent_appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_appointments_company_number ON agent_appointments(company_number);
CREATE INDEX IF NOT EXISTS idx_agent_appointments_status ON agent_appointments(status);
CREATE INDEX IF NOT EXISTS idx_agent_appointments_envelope_id ON agent_appointments(envelope_id);

-- Enable RLS (Row Level Security)
ALTER TABLE agent_appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own agent appointments
CREATE POLICY "Users can view own agent appointments" ON agent_appointments
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own agent appointments
CREATE POLICY "Users can insert own agent appointments" ON agent_appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own agent appointments
CREATE POLICY "Users can update own agent appointments" ON agent_appointments
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own agent appointments (if needed)
CREATE POLICY "Users can delete own agent appointments" ON agent_appointments
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_agent_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_agent_appointments_updated_at
  BEFORE UPDATE ON agent_appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_appointments_updated_at();

-- Function to update status timestamps
CREATE OR REPLACE FUNCTION update_agent_appointment_status_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Update sent_at when status changes to 'sent'
  IF NEW.status = 'sent' AND OLD.status != 'sent' THEN
    NEW.sent_at = NOW();
  END IF;
  
  -- Update signed_at when status changes to 'signed'
  IF NEW.status = 'signed' AND OLD.status != 'signed' THEN
    NEW.signed_at = NOW();
  END IF;
  
  -- Update completed_at when status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for status timestamp updates
CREATE TRIGGER update_agent_appointment_status_timestamps
  BEFORE UPDATE ON agent_appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_appointment_status_timestamps();

-- Function to get agent appointment status for a company
CREATE OR REPLACE FUNCTION get_agent_appointment_status(company_crn TEXT, user_uuid UUID)
RETURNS TABLE (
  appointment_id UUID,
  status TEXT,
  signed_at TIMESTAMPTZ,
  document_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aa.id,
    aa.status,
    aa.signed_at,
    aa.signed_document_url
  FROM agent_appointments aa
  WHERE aa.company_number = company_crn 
    AND aa.user_id = user_uuid
  ORDER BY aa.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON agent_appointments TO authenticated;
GRANT EXECUTE ON FUNCTION get_agent_appointment_status TO authenticated;

-- Insert sample data (optional - remove in production)
-- This is just for testing purposes
/*
INSERT INTO agent_appointments (
  user_id,
  company_name,
  company_number,
  registered_address,
  director_name,
  director_email,
  director_title,
  start_date,
  status,
  document_text
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- Replace with actual user ID for testing
  'Example Company Ltd',
  '12345678',
  '123 Example Street, London, EC1A 1BB',
  'John Smith',
  'john.smith@example.com',
  'Director',
  CURRENT_DATE,
  'signed',
  'AGENT APPOINTMENT AGREEMENT...' -- Full document text would go here
);
*/
