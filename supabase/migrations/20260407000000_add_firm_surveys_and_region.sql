-- Create firm_surveys table for firm/operator onboarding
CREATE TABLE IF NOT EXISTS firm_surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  firm_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100) NOT NULL,
  team_size VARCHAR(20) NOT NULL,
  active_investors VARCHAR(20) NOT NULL,
  annual_deal_volume VARCHAR(20) NOT NULL,
  user_role VARCHAR(100) NOT NULL,
  bank_connected BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add region column to investor_surveys
ALTER TABLE investor_surveys ADD COLUMN IF NOT EXISTS region VARCHAR(100);

-- Enable RLS on firm_surveys
ALTER TABLE firm_surveys ENABLE ROW LEVEL SECURITY;

-- RLS policies for firm_surveys
CREATE POLICY "Users can view own firm survey" ON firm_surveys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own firm survey" ON firm_surveys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own firm survey" ON firm_surveys
  FOR UPDATE USING (auth.uid() = user_id);
