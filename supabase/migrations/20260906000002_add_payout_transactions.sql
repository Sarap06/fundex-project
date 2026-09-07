-- Payment transactions: multiple payments against the same payout obligation.
--
-- investor_payouts stays the OBLIGATION row (one per company/investor/due_date,
-- holding derived status + cumulative actual_amount). Each individual payment
-- an admin records lands here, so partial payments accumulate ($1,000 + $500 +
-- $750 against a $2,250 obligation → Completed) and every transaction remains
-- visible in payment history. Reverting an obligation deletes its transactions.

CREATE TABLE IF NOT EXISTS payout_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  -- investor_id references EITHER investors.id OR user_profiles.user_id
  -- (dual investor identity — no FK, distinguished by investor_source).
  investor_id uuid NOT NULL,
  investor_source varchar(50),
  due_date date NOT NULL,
  amount numeric(15, 2) NOT NULL,
  paid_date date NOT NULL,
  note text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT payout_transactions_amount_positive CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_payout_transactions_obligation
  ON payout_transactions (company_id, investor_id, due_date);
