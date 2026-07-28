-- Payout cycle for a deal: the day of the month investors are paid (1 or 15).
-- Every investor in a deal follows the deal's cycle. Defaults to the 1st.

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS payout_cycle integer NOT NULL DEFAULT 1;

ALTER TABLE deals
  ADD CONSTRAINT deals_payout_cycle_check CHECK (payout_cycle IN (1, 15));
