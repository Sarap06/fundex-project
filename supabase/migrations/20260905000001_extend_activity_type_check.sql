-- Extend activity_logs.activity_type to cover every type the app emits.
--
-- The check constraint listed 10 types, but the code also logs
-- 'allocation_deleted' (DELETE /api/allocations/[id]), 'payout_marked' and
-- 'payout_reverted' (POST/DELETE /api/payments/mark). Those inserts violated
-- the constraint and — because logActivity() swallows errors by design — the
-- audit entries were silently dropped. This adds the three missing types.

ALTER TABLE activity_logs
  DROP CONSTRAINT IF EXISTS activity_logs_activity_type_check;

ALTER TABLE activity_logs
  ADD CONSTRAINT activity_logs_activity_type_check
  CHECK (activity_type IN (
    'investor_added',
    'investor_accepted',
    'investor_status_changed',
    'deal_created',
    'deal_status_changed',
    'allocation_created',
    'allocation_updated',
    'allocation_deleted',
    'allocation_funded',
    'document_requested',
    'document_uploaded',
    'payout_marked',
    'payout_reverted'
  ));
