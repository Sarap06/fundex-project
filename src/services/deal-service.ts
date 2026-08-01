import { getServiceClient } from './access';

// ─── QUERIES (company-scoped) ─────────────────────────────────────────

/**
 * Get all deals for a company.
 */
export async function getDealsByCompany(companyId: string) {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get a single deal, scoped by company.
 */
export async function getDealByCompany(dealId: string, companyId: string) {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .eq('company_id', companyId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fields a deal edit is allowed to change. Whitelisted so a request body can
 * never write company_id, id, or other protected columns.
 */
const EDITABLE_DEAL_FIELDS = new Set([
  'name', 'type', 'location', 'location_state', 'location_city', 'status',
  'target_amount', 'interest_rate', 'term', 'term_length_months',
  'minimum_investment', 'close_date', 'funding_close_date', 'first_payout_date',
  'payout_cycle', 'property_type', 'loan_purpose', 'borrower_name', 'notes',
  'next_milestone', 'milestone_type',
]);

/**
 * Fields a deal creation is allowed to set. company_id, created_by, id, and
 * timestamps are forced from the session/server — never taken from the body.
 */
const CREATABLE_DEAL_FIELDS = new Set([
  'deal_id', 'name', 'type', 'location', 'location_state', 'location_city', 'status',
  'target_amount', 'raised_amount', 'progress', 'interest_rate', 'term', 'close_date',
  'next_milestone', 'milestone_type', 'borrower_name', 'borrower_contact',
  'property_address', 'property_type', 'loan_purpose', 'documents_status', 'notes',
  'investor_notes', 'tags', 'investor_count', 'minimum_investment', 'term_length_months',
  'funding_close_date', 'first_payout_date', 'payout_cycle', 'collateral_type',
  'collateral_address', 'estimated_property_value', 'loan_to_value_ratio', 'asset_notes',
  'default_investor_audience', 'enable_broadcast_channel', 'enable_investor_inbox',
  'require_investor_acknowledgment', 'automated_investor_message', 'send_automated_message',
  'internal_approval_deadline', 'milestone_notes', 'document_status',
]);

/**
 * Create a deal for a company. company_id and created_by come from the session,
 * never the request body. Only whitelisted fields are written. Throws on error so
 * the API route can surface the real message.
 */
export async function createDeal(
  companyId: string,
  userId: string,
  payload: Record<string, unknown>
) {
  const supabase = getServiceClient();

  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (CREATABLE_DEAL_FIELDS.has(k)) clean[k] = v;
  }

  if (!clean.name) throw new Error('Deal name is required');
  if (!clean.deal_id) {
    clean.deal_id = `D-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;
  }
  clean.company_id = companyId;
  clean.created_by = userId;

  const { data, error } = await supabase
    .from('deals')
    .insert([clean])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a deal, scoped by company. Only whitelisted fields are written, and the
 * WHERE clause is filtered by both id AND company_id (no cross-tenant writes).
 */
export async function updateDeal(
  dealId: string,
  companyId: string,
  patch: Record<string, unknown>
) {
  const supabase = getServiceClient();

  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (EDITABLE_DEAL_FIELDS.has(k)) clean[k] = v;
  }
  if (Object.keys(clean).length === 0) {
    throw new Error('No updatable fields provided');
  }
  clean.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('deals')
    .update(clean)
    .eq('id', dealId)
    .eq('company_id', companyId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Close a deal (status → 'Closed'), scoped by company. Locking of allocations is
 * enforced downstream by allocation writes checking the deal's status.
 */
export async function closeDeal(dealId: string, companyId: string) {
  return updateDeal(dealId, companyId, { status: 'Closed' });
}

/**
 * Get deal summary stats for a company.
 */
export async function getDealSummary(companyId: string) {
  const deals = await getDealsByCompany(companyId);

  const active = deals.filter(d => d.status === 'Active' || d.status === 'Funding').length;
  const closed = deals.filter(d => d.status === 'Closed').length;
  const totalTarget = deals.reduce((sum, d) => sum + Number(d.target_amount || 0), 0);
  const totalRaised = deals.reduce((sum, d) => sum + Number(d.raised_amount || 0), 0);

  return {
    total: deals.length,
    active,
    closed,
    totalTarget,
    totalRaised,
  };
}

/**
 * Get investors associated with a deal.
 * Resolves from both user_profiles and investors tables via deal_investors.
 * THIS IS THE SINGLE SOURCE for "who are the investors in this deal?"
 */
export async function getDealInvestors(dealId: string, companyId?: string) {
  const supabase = getServiceClient();

  // If companyId provided, verify deal belongs to company first
  if (companyId) {
    const { data: deal } = await supabase
      .from('deals')
      .select('id')
      .eq('id', dealId)
      .eq('company_id', companyId)
      .single();

    if (!deal) throw new Error('Deal not found or access denied');
  }

  // Get all deal_investor entries
  const { data: dealInvestors, error } = await supabase
    .from('deal_investors')
    .select('investor_id, investor_source')
    .eq('deal_id', dealId);

  if (error) throw error;
  if (!dealInvestors?.length) return [];

  // Split by source
  const profileIds = dealInvestors
    .filter(di => di.investor_source === 'user_profiles')
    .map(di => di.investor_id);
  const investorIds = dealInvestors
    .filter(di => di.investor_source === 'investors')
    .map(di => di.investor_id);

  const results: Array<{
    id: string;
    email: string;
    fullName: string;
    investorId?: string;
    source: 'user_profiles' | 'investors';
  }> = [];

  // Fetch from user_profiles
  if (profileIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, email, full_name')
      .in('user_id', profileIds);

    if (profiles) {
      for (const p of profiles) {
        results.push({
          id: p.user_id,
          email: p.email,
          fullName: p.full_name,
          source: 'user_profiles',
        });
      }
    }
  }

  // Fetch from investors table
  if (investorIds.length > 0) {
    const { data: investors } = await supabase
      .from('investors')
      .select('id, email, full_name, investor_id')
      .in('id', investorIds);

    if (investors) {
      for (const inv of investors) {
        results.push({
          id: inv.id,
          email: inv.email,
          fullName: inv.full_name,
          investorId: inv.investor_id,
          source: 'investors',
        });
      }
    }
  }

  return results;
}

/**
 * Get deals that have broadcast channels enabled, scoped by company.
 */
export async function getBroadcastDeals(companyId: string) {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('company_id', companyId)
    .eq('enable_broadcast_channel', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ─── MUTATIONS ────────────────────────────────────────────────────────

/**
 * Recompute a deal's raised_amount and progress from its allocations.
 * Must be called after any allocation create/update/delete so the
 * stored figures never drift from the allocation rows.
 */
export async function recalcDealRaisedAmount(dealId: string, companyId: string) {
  const supabase = getServiceClient();

  const { data: allocations, error: allocError } = await supabase
    .from('allocations')
    .select('allocation_amount')
    .eq('deal_id', dealId)
    .eq('company_id', companyId);

  if (allocError) throw allocError;

  const raised = (allocations || []).reduce(
    (sum, a) => sum + (Number(a.allocation_amount) || 0),
    0
  );

  const { data: deal, error: dealError } = await supabase
    .from('deals')
    .select('target_amount')
    .eq('id', dealId)
    .eq('company_id', companyId)
    .single();

  if (dealError) throw dealError;

  const target = Number(deal?.target_amount) || 0;
  const progress = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;

  const { error: updateError } = await supabase
    .from('deals')
    .update({ raised_amount: raised, progress })
    .eq('id', dealId)
    .eq('company_id', companyId);

  if (updateError) throw updateError;

  return { raised, progress };
}
