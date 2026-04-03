-- Add Investor Details Support to Deals
-- Migration: 20260330000006

-- Add investor_notes column to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS investor_notes TEXT;

-- Create deal_investors junction table to track which investors are associated with each deal
-- Stores investors from both 'investors' table and 'user_profiles' table (with role='investor')
CREATE TABLE IF NOT EXISTS deal_investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL,
  investor_source VARCHAR(50) DEFAULT 'user_profiles', -- 'user_profiles' or 'investors'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(deal_id, investor_id, investor_source)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_deal_investors_deal_id ON deal_investors(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_investors_investor_id ON deal_investors(investor_id);
CREATE INDEX IF NOT EXISTS idx_deal_investors_source ON deal_investors(investor_source);
CREATE INDEX IF NOT EXISTS idx_deal_investors_created_at ON deal_investors(created_at DESC);

-- Enable RLS
ALTER TABLE deal_investors ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Allow read access for authenticated users
CREATE POLICY "Enable read access for all users" ON deal_investors
  FOR SELECT
  USING (true);

-- Allow insert for authenticated users
CREATE POLICY "Enable insert for all users" ON deal_investors
  FOR INSERT
  WITH CHECK (true);

-- Allow update for authenticated users
CREATE POLICY "Enable update for all users" ON deal_investors
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow delete for authenticated users
CREATE POLICY "Enable delete for all users" ON deal_investors
  FOR DELETE
  USING (true);

-- Create a view to get deal details with investor information from user_profiles
CREATE OR REPLACE VIEW deal_investor_details AS
SELECT 
  d.id,
  d.deal_id,
  d.name,
  d.type,
  d.status,
  d.target_amount,
  d.raised_amount,
  d.investor_notes,
  COUNT(DISTINCT di.investor_id) as selected_investor_count,
  STRING_AGG(DISTINCT COALESCE(up.full_name, inv.full_name), ', ') as selected_investor_names,
  STRING_AGG(DISTINCT COALESCE(up.email, inv.email), ', ') as selected_investor_emails
FROM deals d
LEFT JOIN deal_investors di ON d.id = di.deal_id
LEFT JOIN user_profiles up ON di.investor_id = up.id AND di.investor_source = 'user_profiles'
LEFT JOIN investors inv ON di.investor_id = inv.id AND di.investor_source = 'investors'
GROUP BY d.id, d.deal_id, d.name, d.type, d.status, d.target_amount, d.raised_amount, d.investor_notes;

-- Query examples for future use in broadcast section:
-- 1. Get all investors for a specific deal (from both sources):
--    SELECT di.investor_id, di.investor_source,
--           COALESCE(up.full_name, inv.full_name) as name,
--           COALESCE(up.email, inv.email) as email
--    FROM deal_investors di
--    LEFT JOIN user_profiles up ON di.investor_id = up.id AND di.investor_source = 'user_profiles'
--    LEFT JOIN investors inv ON di.investor_id = inv.id AND di.investor_source = 'investors'
--    WHERE di.deal_id = 'deal_uuid_here';
--
-- 2. Send broadcast to all investors in a deal:
--    SELECT DISTINCT COALESCE(up.email, inv.email) as email
--    FROM deal_investors di
--    LEFT JOIN user_profiles up ON di.investor_id = up.id AND di.investor_source = 'user_profiles'
--    LEFT JOIN investors inv ON di.investor_id = inv.id AND di.investor_source = 'investors'
--    WHERE di.deal_id = 'deal_uuid_here' AND (up.email IS NOT NULL OR inv.email IS NOT NULL);
