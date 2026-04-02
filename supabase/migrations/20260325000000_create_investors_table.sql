-- Create Sponsors lookup table
CREATE TABLE IF NOT EXISTS sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default sponsors
INSERT INTO sponsors (name, company) VALUES 
  ('Internal', NULL),
  ('Derek', '818 Consulting'),
  ('Maria', 'Summit Partners'),
  ('Referral', NULL),
  ('John', 'Ventures Capital')
ON CONFLICT DO NOTHING;

-- Create Investors table
CREATE TABLE IF NOT EXISTS investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  status VARCHAR(50) NOT NULL CHECK (status IN ('Active', 'Onboarding', 'Pending')),
  sponsor_id UUID REFERENCES sponsors(id),
  initial_investment DECIMAL(15, 2) DEFAULT 0,
  total_invested DECIMAL(15, 2) DEFAULT 0,
  number_of_investments INTEGER DEFAULT 0,
  average_return DECIMAL(5, 2),
  notes TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  onboarded_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS investors_email_idx ON investors(email);
CREATE INDEX IF NOT EXISTS investors_status_idx ON investors(status);
CREATE INDEX IF NOT EXISTS investors_sponsor_id_idx ON investors(sponsor_id);
CREATE INDEX IF NOT EXISTS investors_created_at_idx ON investors(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for investors (allow authenticated users to read all)
CREATE POLICY "Allow authenticated users to read investors" 
  ON investors FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Create RLS policy for investors (allow authenticated users to insert)
CREATE POLICY "Allow authenticated users to insert investors" 
  ON investors FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Create RLS policy for investors (allow authenticated users to update)
CREATE POLICY "Allow authenticated users to update investors" 
  ON investors FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Create RLS policy for sponsors (allow public read)
CREATE POLICY "Allow public to read sponsors" 
  ON sponsors FOR SELECT 
  USING (true);

-- Create function to auto-generate investor ID
CREATE OR REPLACE FUNCTION generate_investor_id()
RETURNS TRIGGER AS $$
DECLARE
  inv_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO inv_count FROM investors;
  NEW.investor_id := 'INV-' || LPAD((inv_count + 1)::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate investor ID
DROP TRIGGER IF EXISTS investor_id_trigger ON investors;
CREATE TRIGGER investor_id_trigger
BEFORE INSERT ON investors
FOR EACH ROW
EXECUTE FUNCTION generate_investor_id();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS investors_updated_at_trigger ON investors;
CREATE TRIGGER investors_updated_at_trigger
BEFORE UPDATE ON investors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS sponsors_updated_at_trigger ON sponsors;
CREATE TRIGGER sponsors_updated_at_trigger
BEFORE UPDATE ON sponsors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
