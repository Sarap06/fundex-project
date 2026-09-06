-- Tenant-scoped read access for the payout tables.
--
-- investor_payouts and payout_transactions were created with RLS enabled but
-- ZERO policies, so authenticated client-side reads returned nothing (all
-- writes go through service-role API routes, which bypass RLS — that stays
-- the only write path). The deal quick-view now reads recorded payout
-- statuses client-side, so grant SELECT to authenticated users of the same
-- company, mirroring the deals tenant policy. No INSERT/UPDATE/DELETE
-- policies on purpose: mutations must keep flowing through the API.

create policy "investor_payouts_tenant_select" on public.investor_payouts
  for select to authenticated
  using (company_id = (select company_id from public.user_profiles where user_id = auth.uid()));

create policy "payout_transactions_tenant_select" on public.payout_transactions
  for select to authenticated
  using (company_id = (select company_id from public.user_profiles where user_id = auth.uid()));
