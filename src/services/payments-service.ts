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

// ─── OPERATIONS SUMMARY (for the Performance dashboard) ───────────────

export interface PayoutOperationsSummary {
  nextPayoutDate: string | null;
  nextPayoutAmount: number; // total expected on the reference cycle date
  nextPayoutInvestors: number;
  paidThisCycle: number; // completed payouts on the reference cycle date
  pending: number; // pending payouts on the reference cycle date
  overdue: number; // payouts on past dates not marked completed
  upcomingThisWeek: number; // payouts due within the next 7 days
  totalPaidYTD: number; // sum of actual amounts of completed payouts paid this year
  avgPaymentThisCycle: number;
  onTimeRate: number | null; // completed / (completed + missed), across all resolved payouts
  lateAlerts: LatePaymentAlert[]; // per-deal overdue payouts (real risk alerts)
}

export interface LatePaymentAlert {
  dealId: string;
  dealName: string;
  count: number; // number of overdue payout line-items
  amount: number; // total overdue amount
  since: string; // oldest overdue payroll date (ISO)
}

// Add whole days to a 'YYYY-MM-DD' string using local calendar parts.
function addDaysIso(iso: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Real payout operations summary for a company — the honest replacement for the
 * allocation-proxy / mock numbers the Performance dashboard used to show.
 * Computes expected payouts across every scheduled date and overlays saved status.
 */
export async function getPayoutOperationsSummary(
  companyId: string,
  nowIso: string
): Promise<PayoutOperationsSummary> {
  const supabase = getServiceClient();
  const inputs = await gatherPayoutInputs(companyId);

  // Every scheduled payroll date across the company's deals.
  const dateSet = new Set<string>();
  for (const a of inputs) {
    for (const d of dealPayoutDates(a.dealFirstPayoutDate, a.dealPayoutCycle, a.dealTermMonths)) {
      dateSet.add(d);
    }
  }
  const dates = Array.from(dateSet).sort();

  // All saved status rows for the company, keyed by investor + date.
  const { data: saved, error } = await supabase
    .from('investor_payouts')
    .select('investor_id, due_date, status, actual_amount, paid_date')
    .eq('company_id', companyId);
  if (error) throw error;
  const savedByKey = new Map((saved ?? []).map((r) => [`${r.investor_id}:${r.due_date}`, r]));

  const today = nowIso.slice(0, 10);
  const weekEnd = addDaysIso(today, 7);
  const yearPrefix = today.slice(0, 4);

  // Reference cycle: the next upcoming payroll date, else the most recent past one.
  const referenceDate = dates.find((d) => d >= today) ?? (dates.length ? dates[dates.length - 1] : null);

  let nextPayoutAmount = 0;
  let nextPayoutInvestors = 0;
  let paidThisCycle = 0;
  let pending = 0;
  let overdue = 0;
  let upcomingThisWeek = 0;
  let totalPaidYTD = 0;
  let completed = 0;
  let missed = 0;
  const lateByDeal = new Map<string, LatePaymentAlert>();

  for (const date of dates) {
    const payouts = computePayoutsForDate(inputs, date);
    for (const p of payouts) {
      const row = savedByKey.get(`${p.investorId}:${date}`);
      const status = (row?.status as PayoutStatus) ?? 'pending';

      if (date === referenceDate) {
        nextPayoutInvestors += 1;
        nextPayoutAmount += p.expectedTotal;
        if (status === 'completed') paidThisCycle += 1;
        if (status === 'pending') pending += 1;
      }
      if (date < today && status !== 'completed') {
        overdue += 1;
        // Accumulate per-deal overdue detail for the risk alerts.
        for (const line of p.deals) {
          const a = lateByDeal.get(line.dealId);
          if (a) {
            a.count += 1;
            a.amount += line.amount;
            if (date < a.since) a.since = date;
          } else {
            lateByDeal.set(line.dealId, {
              dealId: line.dealId,
              dealName: line.dealName,
              count: 1,
              amount: line.amount,
              since: date,
            });
          }
        }
      }
      if (date >= today && date <= weekEnd) upcomingThisWeek += 1;

      if (status === 'completed') {
        completed += 1;
        const paid = row?.paid_date ?? date;
        if (paid.slice(0, 4) === yearPrefix) {
          totalPaidYTD += row?.actual_amount != null ? Number(row.actual_amount) : p.expectedTotal;
        }
      } else if (status === 'missed') {
        missed += 1;
      }
    }
  }

  const resolved = completed + missed;
  return {
    nextPayoutDate: referenceDate,
    nextPayoutAmount,
    nextPayoutInvestors,
    paidThisCycle,
    pending,
    overdue,
    upcomingThisWeek,
    totalPaidYTD,
    avgPaymentThisCycle: nextPayoutInvestors > 0 ? nextPayoutAmount / nextPayoutInvestors : 0,
    onTimeRate: resolved > 0 ? Math.round((completed / resolved) * 1000) / 10 : null,
    lateAlerts: Array.from(lateByDeal.values()).sort((a, b) => a.since.localeCompare(b.since)),
  };
}

export class PaymentsError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'PaymentsError';
    this.status = status;
  }
}
