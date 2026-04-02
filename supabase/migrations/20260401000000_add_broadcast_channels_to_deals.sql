-- Add Broadcast Channel Support to Deals
-- Migration: 20260401000000

-- Add broadcast channel columns to deals table
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS enable_broadcast_channel BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_investor_inbox BOOLEAN DEFAULT false;

-- Create broadcast_updates table to store deal-specific updates
CREATE TABLE IF NOT EXISTS broadcast_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  update_type VARCHAR(50) NOT NULL DEFAULT 'manual', -- 'manual' or 'scheduled'
  file_url VARCHAR(500),
  file_name VARCHAR(255),
  file_size VARCHAR(50),
  file_type VARCHAR(50),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  scheduled_est_time TIME,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  require_acknowledgment BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create broadcast_update_recipients table to track delivery status
CREATE TABLE IF NOT EXISTS broadcast_update_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_update_id UUID NOT NULL REFERENCES broadcast_updates(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL,
  investor_source VARCHAR(50) NOT NULL DEFAULT 'user_profiles', -- 'user_profiles' or 'investors'
  email VARCHAR(255) NOT NULL,
  delivery_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'opened', 'acknowledged'
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledgment_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(broadcast_update_id, investor_id, investor_source)
);

-- Create broadcast_communication_timeline table to log all communications for a deal
CREATE TABLE IF NOT EXISTS broadcast_communication_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  broadcast_update_id UUID REFERENCES broadcast_updates(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL, -- 'update_sent', 'document_uploaded', 'acknowledgment_received', etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  triggered_by_user_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_broadcast_updates_deal_id ON broadcast_updates(deal_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_updates_admin_id ON broadcast_updates(admin_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_updates_deal_sent ON broadcast_updates(deal_id, is_sent);
CREATE INDEX IF NOT EXISTS idx_broadcast_updates_scheduled ON broadcast_updates(scheduled_date, is_sent) 
  WHERE update_type = 'scheduled' AND is_sent = false;

CREATE INDEX IF NOT EXISTS idx_broadcast_update_recipients_update_id ON broadcast_update_recipients(broadcast_update_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_update_recipients_investor ON broadcast_update_recipients(investor_id, investor_source);
CREATE INDEX IF NOT EXISTS idx_broadcast_update_recipients_pending ON broadcast_update_recipients(delivery_status) 
  WHERE delivery_status != 'acknowledged';

CREATE INDEX IF NOT EXISTS idx_broadcast_communication_timeline_deal_id ON broadcast_communication_timeline(deal_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_communication_timeline_created_at ON broadcast_communication_timeline(created_at DESC);

-- Enable RLS
ALTER TABLE broadcast_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_update_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_communication_timeline ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for broadcast_updates
-- Allow read access for authenticated users
CREATE POLICY "Enable read access for all authenticated users" ON broadcast_updates
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow insert for authenticated users
CREATE POLICY "Enable insert for authenticated users" ON broadcast_updates
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow update for authenticated users
CREATE POLICY "Enable update for authenticated users" ON broadcast_updates
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create RLS Policies for broadcast_update_recipients
-- Allow read access for authenticated users
CREATE POLICY "Enable read access for all authenticated users" ON broadcast_update_recipients
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow insert for authenticated users
CREATE POLICY "Enable insert for authenticated users" ON broadcast_update_recipients
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow update for authenticated users
CREATE POLICY "Enable update for authenticated users" ON broadcast_update_recipients
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create RLS Policies for broadcast_communication_timeline
-- Allow read access for authenticated users
CREATE POLICY "Enable read access for all authenticated users" ON broadcast_communication_timeline
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow insert for authenticated users
CREATE POLICY "Enable insert for authenticated users" ON broadcast_communication_timeline
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
