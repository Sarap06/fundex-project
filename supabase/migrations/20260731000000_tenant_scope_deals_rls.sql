-- Tenant-scope the `deals` table RLS.
--
-- BEFORE: 8 permissive policies granted to `public` (anon + authenticated) with
-- USING/WITH CHECK of `true` or `company_id IS NOT NULL`. Effect: any caller with
-- the anon key could read or mutate EVERY company's deals — a cross-tenant leak.
--
-- AFTER: every row operation is restricted to authenticated users whose
-- user_profiles.company_id matches the row's company_id. The service role (used by
-- the server API routes) bypasses RLS, so server-side deal creation/edits are
-- unaffected. Anonymous callers (no JWT → auth.uid() is null) match nothing.
--
-- ⚠️ NOT auto-applied. Migrations are applied to the remote DB manually. Test on a
-- staging/branch DB first: confirm the admin deals page still lists/creates/edits/
-- deletes deals while logged in, then apply to production.

-- Drop the permissive policies
drop policy if exists "Enable delete by company"          on public.deals;
drop policy if exists "Enable delete for all users"       on public.deals;
drop policy if exists "Enable insert by company"          on public.deals;
drop policy if exists "Enable insert for all users"       on public.deals;
drop policy if exists "Enable read access by company"     on public.deals;
drop policy if exists "Enable read access for all users"  on public.deals;
drop policy if exists "Enable update by company"          on public.deals;
drop policy if exists "Enable update for all users"       on public.deals;

-- Helper predicate reused below: the caller's company from their profile.
--   company_id = (select company_id from public.user_profiles where user_id = auth.uid())

create policy "deals_tenant_select" on public.deals
  for select to authenticated
  using (company_id = (select company_id from public.user_profiles where user_id = auth.uid()));

create policy "deals_tenant_insert" on public.deals
  for insert to authenticated
  with check (company_id = (select company_id from public.user_profiles where user_id = auth.uid()));

create policy "deals_tenant_update" on public.deals
  for update to authenticated
  using (company_id = (select company_id from public.user_profiles where user_id = auth.uid()))
  with check (company_id = (select company_id from public.user_profiles where user_id = auth.uid()));

create policy "deals_tenant_delete" on public.deals
  for delete to authenticated
  using (company_id = (select company_id from public.user_profiles where user_id = auth.uid()));
