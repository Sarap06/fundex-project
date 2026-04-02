-- Migration: Create activity logs table for tracking all user activities
-- This table logs investor additions, deal creations, allocations, and other key events

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Activity Details
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
    'investor_added',
    'investor_accepted', 
    'investor_status_changed',
    'deal_created',
    'deal_status_changed',
    'allocation_created',
    'allocation_funded',
    'allocation_updated',
    'document_requested',
    'document_uploaded'
  )),
  
  -- Related Entities
  investor_id UUID REFERENCES public.investors(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  allocation_id UUID REFERENCES public.allocations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
  
  -- Activity Data
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- User Information (denormalized for performance)
  investor_name VARCHAR(255),
  investor_initials VARCHAR(5),
  investor_avatar_color VARCHAR(7),
  
  deal_name VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_company_id ON activity_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_investor_id ON activity_logs(investor_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_deal_id ON activity_logs(deal_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Composite index for most common queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_company_created ON activity_logs(company_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for activity logs (all authenticated users can read)
CREATE POLICY "Enable read access for authenticated users" ON activity_logs
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON activity_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_activity_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS activity_logs_updated_at_trigger ON activity_logs;
CREATE TRIGGER activity_logs_updated_at_trigger
BEFORE UPDATE ON activity_logs
FOR EACH ROW
EXECUTE FUNCTION update_activity_logs_updated_at();

-- Function to generate random avatar colors
CREATE OR REPLACE FUNCTION get_random_avatar_color()
RETURNS VARCHAR(7) AS $$
DECLARE
  colors VARCHAR(7)[] := ARRAY['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];
  random_idx INTEGER;
BEGIN
  random_idx := floor(random() * array_length(colors, 1)) + 1;
  RETURN colors[random_idx];
END;
$$ LANGUAGE plpgsql;

-- Trigger to create activity log when investor is added
CREATE OR REPLACE FUNCTION log_investor_added()
RETURNS TRIGGER AS $$
DECLARE
  company_id_val UUID;
  initials VARCHAR(5);
BEGIN
  -- Get company_id from the companies table (we'll need to add this relationship)
  -- For now, we'll use a default - this will be updated when we add company_id to investors table
  initials := SUBSTRING(NEW.full_name, 1, 1) || CASE 
    WHEN POSITION(' ' IN NEW.full_name) > 0 
    THEN SUBSTRING(NEW.full_name, POSITION(' ' IN NEW.full_name) + 1, 1)
    ELSE ''
  END;
  
  -- Log will be created via API for now to ensure company_id is available
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
