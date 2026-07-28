-- Manual payout tracking for the Payments dashboard.
--
-- Expected payouts are COMPUTED on the fly from each deal's payout schedule and
-- each allocation's monthly interest (see src/services/payout-service.ts). A row
-- lands in this table ONLY when an admin marks a payout Completed or Missed —
-- "Pending" is simply the absence of a row. Reverting to Pending deletes the row.
--
-- One row per (company, investor, payroll date): the status/actual/paid_date apply
-- to that investor's whole payout on that date (the per-deal breakdown is derived).

CREATE TABLE IF NOT EXISTS investor_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  -- investor_id references EITHER investors.id OR user_profiles.user_id
  -- (dual investor identity — no FK, distinguished by investor_source).
  investor_id uuid NOT NULL,
  investor_source varchar(50),
  due_date date NOT NULL,
  expected_amount numeric(15, 2) NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL,
  actual_amount numeric(15, 2),
  paid_date date,
  note text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT investor_payouts_status_check CHECK (status IN ('completed', 'missed')),
  CONSTRAINT investor_payouts_unique UNIQUE (company_id, investor_id, due_date)
);

CREATE INDEX IF NOT EXISTS idx_investor_payouts_company_date
  ON investor_payouts (company_id, due_date);
