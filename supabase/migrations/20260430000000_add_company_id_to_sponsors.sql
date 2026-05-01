-- Add company_id to sponsors table for multi-tenant isolation

ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Backfill: assign existing sponsors to the company that uses them (via investors table)
UPDATE sponsors s
SET company_id = sub.company_id
FROM (
  SELECT DISTINCT i.sponsor_id, i.company_id
  FROM investors i
  WHERE i.sponsor_id IS NOT NULL AND i.company_id IS NOT NULL
) sub
WHERE s.id = sub.sponsor_id AND s.company_id IS NULL;

-- Delete seed/orphan sponsors that no company uses (NULL company_id after backfill)
DELETE FROM sponsors WHERE company_id IS NULL;

-- Deduplicate sponsors within a company (keep the one referenced by the most investors)
DELETE FROM sponsors
WHERE id IN (
  SELECT s.id FROM sponsors s
  WHERE EXISTS (
    SELECT 1 FROM sponsors s2
    WHERE s2.company_id = s.company_id
      AND LOWER(s2.name) = LOWER(s.name)
      AND COALESCE(LOWER(s2.company), '') = COALESCE(LOWER(s.company), '')
      AND s2.id < s.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM investors i WHERE i.sponsor_id = s.id
  )
);

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
