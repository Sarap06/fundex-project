-- Migration: Create allocations table with company_id, investor_id, and deal_id foreign keys
-- This table tracks capital allocations to deals by investors

-- Create allocations table
CREATE TABLE IF NOT EXISTS allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES public.investors(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  sponsor_id UUID REFERENCES public.sponsors(id) ON DELETE SET NULL,
  
  -- Allocation Basics
  allocation_amount DECIMAL(15, 2) NOT NULL,
  allocation_percentage DECIMAL(5, 2) NOT NULL,
  commit_date DATE NOT NULL,
  expected_funding_date DATE NOT NULL,
  
  -- Terms
  annual_rate DECIMAL(5, 2) NOT NULL,
  term_length INTEGER NOT NULL,
  term_unit VARCHAR(50) DEFAULT 'months',
  payment_frequency VARCHAR(50) NOT NULL CHECK (payment_frequency IN ('Monthly', 'Quarterly', 'Semi-Annual', 'Annual')),
  payment_start_date DATE NOT NULL,
  
  -- Internal Details
  funding_status VARCHAR(50) NOT NULL CHECK (funding_status IN ('Funded', 'Pending', 'Review')) DEFAULT 'Pending',
  notes TEXT,
  
  -- Calculated / Status Fields
  monthly_interest DECIMAL(15, 2),
  status VARCHAR(50) NOT NULL CHECK (status IN ('confirmed', 'pending', 'review')) DEFAULT 'pending',
  
  -- Documents & Metadata
  documents JSONB DEFAULT '{}'::jsonb,
  
  -- Tracking
  created_by UUID REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_allocations_company_id ON allocations(company_id);
CREATE INDEX IF NOT EXISTS idx_allocations_investor_id ON allocations(investor_id);
CREATE INDEX IF NOT EXISTS idx_allocations_deal_id ON allocations(deal_id);
CREATE INDEX IF NOT EXISTS idx_allocations_status ON allocations(status);
CREATE INDEX IF NOT EXISTS idx_allocations_funding_status ON allocations(funding_status);
CREATE INDEX IF NOT EXISTS idx_allocations_created_at ON allocations(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_allocations_company_status ON allocations(company_id, status);
CREATE INDEX IF NOT EXISTS idx_allocations_company_investor ON allocations(company_id, investor_id);
CREATE INDEX IF NOT EXISTS idx_allocations_company_deal ON allocations(company_id, deal_id);

-- Enable Row Level Security
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for allocations (development-friendly)
CREATE POLICY "Enable read access for all users" ON allocations
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for all users" ON allocations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON allocations
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON allocations
  FOR DELETE
  USING (true);

-- Create trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_allocations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS allocations_updated_at_trigger ON allocations;
CREATE TRIGGER allocations_updated_at_trigger
BEFORE UPDATE ON allocations
FOR EACH ROW
EXECUTE FUNCTION update_allocations_updated_at();

-- Create trigger function to calculate monthly_interest
CREATE OR REPLACE FUNCTION calculate_monthly_interest()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate monthly interest: (allocation_amount * annual_rate / 100) / 12
  NEW.monthly_interest = (NEW.allocation_amount * NEW.annual_rate / 100) / 12;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for monthly_interest calculation
DROP TRIGGER IF EXISTS allocations_calculate_interest_trigger ON allocations;
CREATE TRIGGER allocations_calculate_interest_trigger
BEFORE INSERT OR UPDATE ON allocations
FOR EACH ROW
EXECUTE FUNCTION calculate_monthly_interest();
