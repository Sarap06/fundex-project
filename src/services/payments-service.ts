import { getServiceClient } from './access';
import {
  computePayoutsForDate,
  dealPayoutDates,
  type PayoutAllocationInput,
  type InvestorPayout,
  type PayoutStatus,
} from './payout-service';
import type { MarkPayoutInput, RevertPayoutInput } from '@/schemas/payout';

// InvestorPayout plus the persisted status overlay (Pending = no saved row).
export interface InvestorPayoutView extends InvestorPayout {
  status: PayoutStatus;
  actualAmount: number | null;
  paidDate: string | null;
  note: string | null;
}

// ─── GATHER (company-scoped) ──────────────────────────────────────────
//
// Pull every allocation for the company with its deal-level payout schedule and
// the investor's display name, shaped for the pure payout calculator. Investor
// names are resolved via a name-map across both investors and user_profiles
// (dual investor identity — never the PostgREST investors(...) embed, which 400s).
async function gatherPayoutInputs(companyId: string): Promise<PayoutAllocationInput[]> {
  const supabase = getServiceClient();

  const { data: allocs, error } = await supabase
    .from('allocations')
    .select(`
      id,
      investor_id,
      monthly_interest,
      funding_status,
      deal_id,
      deals!inner (
        id,
        name,
        status,
        first_payout_date,
        payout_cycle,
        term_length_months
      )
    `)
    .eq('company_id', companyId);

  if (error) throw error;
  if (!allocs || allocs.length === 0) return [];

  // Resolve investor names from both tables, scoped to this company.
  const investorIds = Array.from(new Set(allocs.map((a) => a.investor_id).filter(Boolean)));
  const nameById = new Map<string, { name: string; source: string }>();

  if (investorIds.length > 0) {
    const [{ data: manual }, { data: profiles }] = await Promise.all([
      supabase.from('investors').select('id, full_name').in('id', investorIds).eq('company_id', companyId),
      supabase.from('user_profiles').select('user_id, full_name').in('user_id', investorIds).eq('company_id', companyId),
    ]);
    manual?.forEach((i) => nameById.set(i.id, { name: i.full_name, source: 'investor' }));
    profiles?.forEach((p) => nameById.set(p.user_id, { name: p.full_name, source: 'profile' }));
  }

  return allocs.map((a) => {
    // PostgREST returns an embedded to-one as an object; be defensive if array.
    const deal = Array.isArray(a.deals) ? a.deals[0] : a.deals;
    const resolved = nameById.get(a.investor_id);
    return {
      allocationId: a.id,
      investorId: a.investor_id,
      investorSource: resolved?.source ?? null,
      investorName: resolved?.name ?? 'Unknown investor',
      dealId: a.deal_id,
      dealName: deal?.name ?? 'Unknown deal',
      monthlyInterest: a.monthly_interest,
      fundingStatus: a.funding_status,
      dealPayoutCycle: deal?.payout_cycle ?? null,
      dealFirstPayoutDate: deal?.first_payout_date ?? null,
      dealTermMonths: deal?.term_length_months ?? null,
      dealStatus: deal?.status ?? null,
    } satisfies PayoutAllocationInput;
  });
}

// ─── QUERIES ──────────────────────────────────────────────────────────

/**
 * All scheduled payroll dates across the company's deals (ISO, sorted, unique).
 * Drives the Payments dashboard's date navigation.
 */
export async function listPayoutDates(companyId: string): Promise<string[]> {
  const inputs = await gatherPayoutInputs(companyId);

  const seen = new Set<string>();
  for (const a of inputs) {
    for (const d of dealPayoutDates(a.dealFirstPayoutDate, a.dealPayoutCycle, a.dealTermMonths)) {
      seen.add(d);
    }
  }
  return Array.from(seen).sort();
}

/**
 * Expected payouts for a payroll date, grouped by investor, with any saved
 * status overlaid. Investors with no saved row are Pending.
 */
export async function listPayoutsForDate(
  companyId: string,
  dateIso: string
): Promise<InvestorPayoutView[]> {
  const supabase = getServiceClient();

  const inputs = await gatherPayoutInputs(companyId);
  const computed = computePayoutsForDate(inputs, dateIso);

  // Saved status rows for this exact date (company-scoped).
  const { data: saved, error } = await supabase
    .from('investor_payouts')
    .select('investor_id, status, actual_amount, paid_date, note')
    .eq('company_id', companyId)
    .eq('due_date', dateIso);

  if (error) throw error;

  const savedById = new Map(saved?.map((r) => [r.investor_id, r]) ?? []);

  return computed.map((p) => {
    const row = savedById.get(p.investorId);
    return {
      ...p,
      status: (row?.status as PayoutStatus) ?? 'pending',
      actualAmount: row?.actual_amount != null ? Number(row.actual_amount) : null,
      paidDate: row?.paid_date ?? null,
      note: row?.note ?? null,
    };
  });
}

// ─── MUTATIONS (company-scoped) ───────────────────────────────────────

/**
 * Mark an investor's payout for a payroll date as Completed or Missed.
 * Upserts on (company_id, investor_id, due_date). expected_amount is recomputed
 * server-side from live data — never trusted from the request.
 */
export async function markPayout(
  companyId: string,
  userId: string,
  input: MarkPayoutInput
): Promise<InvestorPayoutView> {
  const supabase = getServiceClient();

  // Recompute this investor's expected payout for the date from live data.
  const inputs = await gatherPayoutInputs(companyId);
  const computed = computePayoutsForDate(inputs, input.due_date);
  const match = computed.find((p) => p.investorId === input.investor_id);

  if (!match) {
    // No payout is actually scheduled for this investor on this date — refuse.
    throw new PaymentsError('No scheduled payout for this investor on this date', 404);
  }

  const actual =
    input.status === 'completed'
      ? input.actual_amount != null
        ? input.actual_amount
        : match.expectedTotal
      : null;

  const { data, error } = await supabase
    .from('investor_payouts')
    .upsert(
      {
        company_id: companyId,
        investor_id: input.investor_id,
        investor_source: input.investor_source ?? match.investorSource ?? null,
        due_date: input.due_date,
        expected_amount: match.expectedTotal,
        status: input.status,
        actual_amount: actual,
        paid_date: input.status === 'completed' ? input.paid_date ?? input.due_date : null,
        note: input.note ?? null,
        created_by: userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'company_id,investor_id,due_date' }
    )
    .select('status, actual_amount, paid_date, note')
    .single();

  if (error) throw error;

  return {
    ...match,
    status: (data.status as PayoutStatus) ?? input.status,
    actualAmount: data.actual_amount != null ? Number(data.actual_amount) : null,
    paidDate: data.paid_date ?? null,
    note: data.note ?? null,
  };
}

/**
 * Revert a marked payout back to Pending by deleting its persisted row.
 * Scoped by company_id so one tenant can never clear another's record.
 */
export async function revertPayout(
  companyId: string,
  input: RevertPayoutInput
): Promise<void> {
  const supabase = getServiceClient();

  const { error } = await supabase
    .from('investor_payouts')
    .delete()
    .eq('company_id', companyId)
    .eq('investor_id', input.investor_id)
    .eq('due_date', input.due_date);

  if (error) throw error;
}

export class PaymentsError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'PaymentsError';
    this.status = status;
  }
}
