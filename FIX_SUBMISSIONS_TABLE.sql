-- ===================================================================
-- FIX SUBMISSIONS TABLE ISSUES
-- This fixes missing columns in the submissions table
-- ===================================================================

-- 1. Check current submissions table structure
SELECT 'Current submissions table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'submissions' 
ORDER BY ordinal_position;

-- 2. Add missing columns to submissions table
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS due_followup_at TIMESTAMPTZ;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Also add missing columns to documents table for verification
ALTER TABLE documents ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);

-- 4. Update submissions table status check constraint to include all needed statuses
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_status_check;
ALTER TABLE submissions ADD CONSTRAINT submissions_status_check 
    CHECK (status IN ('submitted', 'processing', 'query', 'approved', 'rejected', 'pending', 'info_requested'));

-- 5. Update submission_type check constraint
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_submission_type_check;
ALTER TABLE submissions ADD CONSTRAINT submissions_submission_type_check 
    CHECK (submission_type IN ('SEIS', 'EIS', 'BOTH'));

-- 6. Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_submissions_due_followup_at ON submissions(due_followup_at);
CREATE INDEX IF NOT EXISTS idx_submissions_verified_by ON submissions(verified_by);
CREATE INDEX IF NOT EXISTS idx_documents_verified_by ON documents(verified_by);

-- 7. Verify the updated table structure
SELECT 'Updated submissions table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'submissions' 
ORDER BY ordinal_position;

SELECT 'Updated documents table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'documents' 
ORDER BY ordinal_position;

-- Success message
SELECT '✅ Submissions table fixed!' as result;
