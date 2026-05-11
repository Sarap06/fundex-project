-- Migration: Add company_id to deal_investors for multi-tenant isolation
-- The inbox API queries deal_investors with .eq('company_id', ...) but the column
-- was missing, causing the query to silently fail and return no deals.

-- 1. Add company_id column
ALTER TABLE deal_investors ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- 2. Backfill company_id from the associated deal
UPDATE deal_investors di
SET company_id = d.company_id
FROM deals d
WHERE di.deal_id = d.id
  AND di.company_id IS NULL
  AND d.company_id IS NOT NULL;

-- 3. Create index for company-scoped queries
CREATE INDEX IF NOT EXISTS idx_deal_investors_company_id ON deal_investors(company_id);
CREATE INDEX IF NOT EXISTS idx_deal_investors_company_investor ON deal_investors(company_id, investor_id);
