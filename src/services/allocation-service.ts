import { getServiceClient } from './access';

// ─── CALCULATIONS (single source of truth) ───────────────────────────

/**
 * Calculate monthly interest from allocation amount and annual rate.
 * This is THE ONLY place this formula exists.
 */
export function calculateMonthlyInterest(amount: number, annualRate: number): number {
  return (amount * annualRate / 100) / 12;
}

/**
 * Calculate allocation percentage of a deal's target.
 */
export function calculateAllocationPercentage(
  allocationAmount: number,
  dealTargetAmount: number
): number {
  if (dealTargetAmount <= 0) return 0;
  return Math.round((allocationAmount / dealTargetAmount) * 10000) / 100;
}

/**
 * Format currency for display. Consistent across all pages.
 */
export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

// ─── QUERIES (company-scoped) ─────────────────────────────────────────

/**
 * Get all allocations for a company.
 */
export async function getAllocationsByCompany(companyId: string) {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('allocations')
    .select(`
      *,
      investors (id, full_name, email, investor_id),
      deals (id, name, deal_id),
      sponsors (id, name, company)
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get allocation summary stats for a company.
 * ONE function, used by admin dashboard + allocations page + any API.
 */
export async function getAllocationSummary(companyId: string) {
  const allocations = await getAllocationsByCompany(companyId);

  const totalAllocated = allocations.reduce(
    (sum, a) => sum + Number(a.allocation_amount || 0), 0
  );
  const totalMonthlyInterest = allocations.reduce(
    (sum, a) => sum + Number(a.monthly_interest || 0), 0
  );
  const averageRate = allocations.length > 0
    ? allocations.reduce((sum, a) => sum + Number(a.annual_rate || 0), 0) / allocations.length
    : 0;

  const funded = allocations.filter(a => a.funding_status === 'Funded').length;
  const pending = allocations.filter(a => a.funding_status === 'Pending').length;
  const review = allocations.filter(a => a.funding_status === 'Review').length;

  return {
    total: allocations.length,
    totalAllocated,
    totalMonthlyInterest,
    averageRate: Math.round(averageRate * 100) / 100,
    funded,
    pending,
    review,
  };
}

/**
 * Create a new allocation. Calculates monthly interest automatically.
 */
export async function createAllocation(
  companyId: string,
  data: {
    investor_id: string;
    deal_id: string;
    sponsor_id?: string;
    allocation_amount: number;
    allocation_percentage: number;
    commit_date: string;
    expected_funding_date: string;
    annual_rate: number;
    term_length: number;
    term_unit?: string;
    payment_frequency: string;
    payment_start_date: string;
    funding_status?: string;
    status?: string;
    notes?: string;
    created_by?: string;
  }
) {
  const supabase = getServiceClient();

  const monthlyInterest = calculateMonthlyInterest(
    data.allocation_amount,
    data.annual_rate
  );

  const { data: allocation, error } = await supabase
    .from('allocations')
    .insert({
      company_id: companyId,
      ...data,
      monthly_interest: monthlyInterest,
    })
    .select()
    .single();

  if (error) throw error;
  return allocation;
}
