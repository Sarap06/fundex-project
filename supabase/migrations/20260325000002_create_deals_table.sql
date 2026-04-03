-- Create Deals Table and Related Tables
-- Migration: 20260325000002

-- Create deal_types enum table
CREATE TABLE IF NOT EXISTS deal_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create deal_statuses enum table
CREATE TABLE IF NOT EXISTS deal_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create milestone_types enum table
CREATE TABLE IF NOT EXISTS milestone_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create deals table
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  location VARCHAR(255),
  location_state VARCHAR(2),
  location_city VARCHAR(100),
  status VARCHAR(50) NOT NULL,
  target_amount DECIMAL(15, 2),
  raised_amount DECIMAL(15, 2) DEFAULT 0,
  progress INTEGER DEFAULT 0,
  investor_count INTEGER DEFAULT 0,
  term VARCHAR(50),
  interest_rate DECIMAL(5, 2),
  close_date DATE,
  next_milestone VARCHAR(255),
  milestone_type VARCHAR(50),
  borrower_name VARCHAR(255),
  borrower_contact VARCHAR(255),
  property_address TEXT,
  property_type VARCHAR(100),
  loan_purpose TEXT,
  documents_status VARCHAR(50),
  notes TEXT,
  tags TEXT[],
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default deal types
INSERT INTO deal_types (name, description) VALUES
  ('Bridge Loan', 'Short-term financing for real estate transactions'),
  ('Construction', 'Financing for construction projects'),
  ('Acquisition', 'Financing for property acquisition'),
  ('Development', 'Financing for development projects'),
  ('Refinance', 'Refinancing of existing debt')
ON CONFLICT (name) DO NOTHING;

-- Insert default deal statuses
INSERT INTO deal_statuses (name, description) VALUES
  ('Funding', 'Deal is currently seeking funding'),
  ('Active', 'Deal is active and generating returns'),
  ('Due Diligence', 'Deal is under due diligence review'),
  ('Awaiting Docs', 'Awaiting documentation'),
  ('Closed', 'Deal has been closed/completed')
ON CONFLICT (name) DO NOTHING;

-- Insert default milestone types
INSERT INTO milestone_types (name, description) VALUES
  ('urgent', 'Urgent milestone requiring immediate attention'),
  ('normal', 'Normal milestone'),
  ('attention', 'Milestone requiring attention')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_deals_deal_id ON deals(deal_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_type ON deals(type);
CREATE INDEX IF NOT EXISTS idx_deals_location ON deals(location_state, location_city);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_search ON deals USING GIN (tags);

-- Enable RLS
ALTER TABLE deal_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for Development (permissive)
-- Allow read access for authenticated users
CREATE POLICY "Enable read access for all users" ON deals
  FOR SELECT
  USING (true);

CREATE POLICY "Enable read access for all users - deal_types" ON deal_types
  FOR SELECT
  USING (true);

CREATE POLICY "Enable read access for all users - deal_statuses" ON deal_statuses
  FOR SELECT
  USING (true);

CREATE POLICY "Enable read access for all users - milestone_types" ON milestone_types
  FOR SELECT
  USING (true);

-- Allow insert/update/delete for authenticated users (development)
CREATE POLICY "Enable insert for all users" ON deals
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON deals
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON deals
  FOR DELETE
  USING (true);

-- Insert sample deals for demonstration
INSERT INTO deals (
  deal_id, name, type, location, location_state, location_city, status, 
  target_amount, raised_amount, progress, investor_count, term, interest_rate,
  close_date, next_milestone, milestone_type, borrower_name, borrower_contact,
  property_address, property_type, loan_purpose, documents_status, notes, tags
) VALUES
  (
    'D-2024-089',
    'Downtown Austin Office Complex',
    'Bridge Loan',
    'Austin, TX',
    'TX',
    'Austin',
    'Funding',
    12500000,
    9200000,
    74,
    15,
    '18 months',
    12.5,
    '2026-04-15',
    'Closing in 3 days',
    'urgent',
    'Metro Development Corp',
    'info@metrodev.com',
    '125 Congress Ave, Austin, TX 78701',
    'Commercial Office',
    'Bridge financing for acquisition and renovation',
    'Documents Pending',
    'High priority deal with strong sponsor',
    ARRAY['High Priority', 'Commercial', 'Austin Market']
  ),
  (
    'D-2024-088',
    'Seattle Tech Hub Development',
    'Construction',
    'Seattle, WA',
    'WA',
    'Seattle',
    'Active',
    15200000,
    15200000,
    100,
    28,
    '24 months',
    11.8,
    '2025-12-31',
    'Phase 2 completion expected',
    'normal',
    'Tech Ventures LLC',
    'contact@techventures.com',
    '500 Pike Place, Seattle, WA',
    'Commercial Tech',
    'Construction financing for tech office space',
    'Complete',
    'Full funding received, construction ongoing',
    ARRAY['Tech', 'Construction', 'Seattle']
  ),
  (
    'D-2024-087',
    'Miami Luxury Residential',
    'Acquisition',
    'Miami, FL',
    'FL',
    'Miami',
    'Due Diligence',
    8000000,
    6400000,
    80,
    12,
    '12 months',
    14.2,
    '2026-02-28',
    'Legal review in progress',
    'attention',
    'FL Residential Partners',
    'deals@flresidential.com',
    '1000 Brickell Ave, Miami, FL 33131',
    'Residential',
    'Acquisition financing for luxury condo project',
    'In Progress',
    'Strong market conditions',
    ARRAY['Luxury', 'Residential', 'Miami']
  ),
  (
    'D-2024-086',
    'Denver Mixed-Use Project',
    'Development',
    'Denver, CO',
    'CO',
    'Denver',
    'Funding',
    22000000,
    16500000,
    75,
    19,
    '36 months',
    10.9,
    '2026-06-30',
    'Environmental assessment due',
    'urgent',
    'Rocky Mountain Development',
    'projects@rmdev.com',
    '999 18th St, Denver, CO 80202',
    'Mixed-Use',
    'Large mixed-use development project financing',
    'Documents Pending',
    'Seeking additional institutional investors',
    ARRAY['Large Deal', 'Development', 'Denver']
  ),
  (
    'D-2024-085',
    'Boston Office Refinance',
    'Refinance',
    'Boston, MA',
    'MA',
    'Boston',
    'Active',
    6500000,
    6500000,
    100,
    8,
    '10 years',
    9.5,
    '2025-09-15',
    'Next distribution scheduled',
    'normal',
    'New England Real Estate',
    'finance@nerealestate.com',
    '75 State Street, Boston, MA 02109',
    'Commercial Office',
    'Refinancing of existing mortgage',
    'Complete',
    'Stable, consistent returns',
    ARRAY['Refinance', 'Stable', 'Boston']
  )
ON CONFLICT (deal_id) DO NOTHING;
