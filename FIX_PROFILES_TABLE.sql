-- ===================================================================
-- FIX PROFILES TABLE - Step by Step
-- Run each section separately if you get errors
-- ===================================================================

-- STEP 1: Check current profiles table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- STEP 2: Add stripe_customer_id column (run this separately)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;
        RAISE NOTICE 'Added stripe_customer_id column';
    ELSE
        RAISE NOTICE 'stripe_customer_id column already exists';
    END IF;
END $$;

-- STEP 3: Add updated_at column (run this separately)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    ELSE
        RAISE NOTICE 'updated_at column already exists';
    END IF;
END $$;

-- STEP 4: Create indexes (run this after columns are added)
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at);

-- STEP 5: Set updated_at for existing records
UPDATE profiles 
SET updated_at = COALESCE(updated_at, created_at, NOW())
WHERE updated_at IS NULL;

-- STEP 6: Verify the columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('stripe_customer_id', 'updated_at')
ORDER BY column_name;
