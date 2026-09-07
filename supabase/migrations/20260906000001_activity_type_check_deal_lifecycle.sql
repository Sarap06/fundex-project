-- Add the deal-lifecycle activity types to the activity_logs check constraint.
--
-- PATCH /api/deals/[id] logs 'deal_closed' and 'deal_updated', neither of which
-- was in the constraint — so (because logActivity() swallows errors by design)
-- every deal edit/close audit entry was being silently dropped. Same bug class
-- as 20260905000001.

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
    'deal_updated',
    'deal_closed',
    'allocation_created',
    'allocation_updated',
    'allocation_deleted',
    'allocation_funded',
    'document_requested',
    'document_uploaded',
    'payout_marked',
    'payout_reverted'
  ));
