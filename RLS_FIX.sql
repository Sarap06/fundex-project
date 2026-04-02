-- QUICK FIX: Run this immediately in Supabase SQL Editor
-- This will fix the 403 permission error

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated users to read investors" ON investors;
DROP POLICY IF EXISTS "Allow authenticated users to insert investors" ON investors;
DROP POLICY IF EXISTS "Allow authenticated users to update investors" ON investors;
DROP POLICY IF EXISTS "Allow public to read sponsors" ON sponsors;

-- Create permissive policies for development
CREATE POLICY "Allow all to read investors" 
  ON investors FOR SELECT 
  USING (true);

CREATE POLICY "Allow all to insert investors" 
  ON investors FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow all to update investors" 
  ON investors FOR UPDATE 
  USING (true);

CREATE POLICY "Allow all to delete investors" 
  ON investors FOR DELETE 
  USING (true);

CREATE POLICY "Allow all to read sponsors" 
  ON sponsors FOR SELECT 
  USING (true);

CREATE POLICY "Allow all to insert sponsors" 
  ON sponsors FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow all to update sponsors" 
  ON sponsors FOR UPDATE 
  USING (true);
