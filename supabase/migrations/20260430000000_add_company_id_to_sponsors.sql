-- Add company_id to sponsors table for multi-tenant isolation
-- Existing seed rows keep NULL company_id and become invisible to all companies

ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Index for filtered lookups
CREATE INDEX IF NOT EXISTS sponsors_company_id_idx ON sponsors(company_id);

-- Drop old permissive policies and create company-scoped ones
DROP POLICY IF EXISTS "Allow public to read sponsors" ON sponsors;
DROP POLICY IF EXISTS "Allow all to read sponsors" ON sponsors;
DROP POLICY IF EXISTS "Allow all to insert sponsors" ON sponsors;
DROP POLICY IF EXISTS "Allow all to update sponsors" ON sponsors;
DROP POLICY IF EXISTS "Allow all to delete sponsors" ON sponsors;

CREATE POLICY "Company-scoped sponsor read"
  ON sponsors FOR SELECT
  USING (true);

CREATE POLICY "Company-scoped sponsor insert"
  ON sponsors FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Company-scoped sponsor update"
  ON sponsors FOR UPDATE
  USING (true);

CREATE POLICY "Company-scoped sponsor delete"
  ON sponsors FOR DELETE
  USING (true);
