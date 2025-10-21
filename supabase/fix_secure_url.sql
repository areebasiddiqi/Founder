-- Fix for missing secure_url column
-- Run this in your Supabase SQL Editor

-- Check if the column exists and add it if missing
DO $$ 
BEGIN
    -- Try to add the secure_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pitch_pages' 
        AND column_name = 'secure_url'
    ) THEN
        ALTER TABLE pitch_pages ADD COLUMN secure_url TEXT UNIQUE;
        
        -- Update existing rows with a generated secure URL if any exist
        UPDATE pitch_pages 
        SET secure_url = 'pitch-' || id::text 
        WHERE secure_url IS NULL;
        
        -- Make it NOT NULL after updating existing rows
        ALTER TABLE pitch_pages ALTER COLUMN secure_url SET NOT NULL;
    END IF;
    
    -- Also check and add other potentially missing columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pitch_pages' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE pitch_pages ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
END $$;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'pitch_pages' 
ORDER BY ordinal_position;
