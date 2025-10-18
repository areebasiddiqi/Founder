-- Check current RLS policies on pitch_pages
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'pitch_pages';

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Users can view own pitch pages" ON pitch_pages;
DROP POLICY IF EXISTS "Users can insert own pitch pages" ON pitch_pages;
DROP POLICY IF EXISTS "Users can update own pitch pages" ON pitch_pages;
DROP POLICY IF EXISTS "Published pitch pages are viewable by all" ON pitch_pages;

-- Recreate policies with correct permissions
CREATE POLICY "Users can view own pitch pages" ON pitch_pages 
  FOR SELECT USING (auth.uid() = founder_id);

CREATE POLICY "Users can insert own pitch pages" ON pitch_pages 
  FOR INSERT WITH CHECK (auth.uid() = founder_id);

CREATE POLICY "Users can update own pitch pages" ON pitch_pages 
  FOR UPDATE USING (auth.uid() = founder_id);

-- This is the key policy - allow anyone to view published pitch pages
CREATE POLICY "Anyone can view published pitch pages" ON pitch_pages 
  FOR SELECT USING (is_published = true);

-- Check if policies were created correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'pitch_pages';

-- Test query to see published pitch pages (should work without authentication)
SELECT id, pitch_title, is_published, created_at 
FROM pitch_pages 
WHERE is_published = true 
LIMIT 5;
