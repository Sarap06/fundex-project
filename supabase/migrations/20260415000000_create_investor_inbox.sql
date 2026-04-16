-- Investor inbox: 1-to-1 general chat between admin/partner and an investor
CREATE TABLE investor_inbox_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  -- The investor this thread belongs to
  investor_id UUID NOT NULL,
  investor_source VARCHAR(20) NOT NULL DEFAULT 'user_profiles', -- 'user_profiles' | 'investors'
  -- Who sent this message
  sender_id UUID NOT NULL,               -- user_profiles.user_id
  sender_role VARCHAR(20) NOT NULL,      -- 'admin' | 'partner' | 'investor'
  sender_name VARCHAR(255),
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inbox_company_investor
  ON investor_inbox_messages(company_id, investor_id, investor_source);

CREATE INDEX idx_inbox_created
  ON investor_inbox_messages(created_at DESC);

-- RLS
ALTER TABLE investor_inbox_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read messages in their company"
  ON investor_inbox_messages FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert messages"
  ON investor_inbox_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update messages"
  ON investor_inbox_messages FOR UPDATE
  TO authenticated
  USING (auth.role() = 'authenticated');
