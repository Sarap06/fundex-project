-- Allow a 'partial' payout status.
--
-- Previously a payout could only be 'completed' or 'missed' (Pending = no row),
-- which meant recording any amount flipped the payout to Completed regardless of
-- whether the full expected amount was paid. Partial payments now persist as
-- status = 'partial' with actual_amount < expected_amount; remaining is derived
-- (expected - actual) and the obligation stays outstanding until fully paid.

ALTER TABLE investor_payouts
  DROP CONSTRAINT IF EXISTS investor_payouts_status_check;

ALTER TABLE investor_payouts
  ADD CONSTRAINT investor_payouts_status_check
  CHECK (status IN ('completed', 'missed', 'partial'));
