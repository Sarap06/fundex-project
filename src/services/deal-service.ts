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
