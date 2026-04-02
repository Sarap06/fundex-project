-- Fix RLS policies to allow proper access

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated users to read investors" ON investors;
DROP POLICY IF EXISTS "Allow authenticated users to insert investors" ON investors;
DROP POLICY IF EXISTS "Allow authenticated users to update investors" ON investors;
DROP POLICY IF EXISTS "Allow public to read sponsors" ON sponsors;

-- Create permissive policies for development
-- In production, you should implement more strict authentication checks

-- Investors: Allow read access
CREATE POLICY "Allow all to read investors" 
  ON investors FOR SELECT 
  USING (true);

-- Investors: Allow insert access (for admin users - can be restricted later)
CREATE POLICY "Allow all to insert investors" 
  ON investors FOR INSERT 
  WITH CHECK (true);

-- Investors: Allow update access
CREATE POLICY "Allow all to update investors" 
  ON investors FOR UPDATE 
  USING (true);

-- Investors: Allow delete access
CREATE POLICY "Allow all to delete investors" 
  ON investors FOR DELETE 
  USING (true);

-- Sponsors: Allow read access
CREATE POLICY "Allow all to read sponsors" 
  ON sponsors FOR SELECT 
  USING (true);

-- Sponsors: Allow insert access
CREATE POLICY "Allow all to insert sponsors" 
  ON sponsors FOR INSERT 
  WITH CHECK (true);

-- Sponsors: Allow update access
CREATE POLICY "Allow all to update sponsors" 
  ON sponsors FOR UPDATE 
  USING (true);
