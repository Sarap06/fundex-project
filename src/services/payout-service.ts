// Payout calculation for the manual payments tracker.
//
// Model (confirmed with product): the payout SCHEDULE is deal-level — each deal
// pays on a fixed cycle day (1st or 15th) starting from its first payout month,
// for `term` months. The AMOUNT each investor receives is their allocation's
// monthly interest. Principal is not bundled into any payout (interest-only).
//
// These are pure functions — no DB access — so they can be unit-checked and
// reused by the API and the dashboard.

export type PayoutStatus = 'pending' | 'completed' | 'missed';

export interface PayoutAllocationInput {
  allocationId: string;
  investorId: string;
  investorSource?: string | null;
  investorName: string;
  dealId: string;
  dealName: string;
  // per-investor monthly amount (allocation.monthly_interest)
  monthlyInterest: number | string | null;
  // allocation must be Funded to be paid
  fundingStatus: string | null;
  // deal-level schedule
  dealPayoutCycle: number | string | null; // 1 or 15
  dealFirstPayoutDate: string | null; // 'YYYY-MM-DD'
  dealTermMonths: number | string | null;
  dealStatus: string | null;
}

export interface PayoutLineItem {
  allocationId: string;
  dealId: string;
  dealName: string;
  amount: number;
  paymentNumber: number; // 1..term
  totalPayments: number;
}

export interface InvestorPayout {
  investorId: string;
  investorSource?: string | null;
  investorName: string;
  expectedTotal: number;
  deals: PayoutLineItem[];
}

const INACTIVE_DEAL_STATUSES = new Set(['closed', 'completed']);

function num(v: unknown): number {
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : 0;
  return Number.isFinite(n) ? n : 0;
}

// Parse 'YYYY-MM-DD' into {year, month(0-based), day} using local calendar parts
// (avoids the UTC-midnight shift on date-only strings).
function parseYmd(iso: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) };
}

function isDealActive(status: string | null): boolean {
  return !INACTIVE_DEAL_STATUSES.has((status ?? '').toLowerCase());
}

function isFunded(status: string | null): boolean {
  return (status ?? '').toLowerCase() === 'funded';
}

/**
 * If a payout is due for this allocation on the given payroll date, return the
 * line item; otherwise null. A payout is due when:
 *  - the allocation is Funded and its deal is not Closed/Completed
 *  - the payroll date's day equals the deal's payout cycle (1 or 15)
 *  - the payroll month is within [firstPayoutMonth … +term-1]
 */
export function payoutDueOn(
  a: PayoutAllocationInput,
  payrollDateIso: string
): PayoutLineItem | null {
  if (!isFunded(a.fundingStatus) || !isDealActive(a.dealStatus)) return null;

  const cycle = num(a.dealPayoutCycle);
  const term = Math.floor(num(a.dealTermMonths));
  const monthly = num(a.monthlyInterest);
  if (cycle !== 1 && cycle !== 15) return null;
  if (term <= 0 || monthly <= 0 || !a.dealFirstPayoutDate) return null;

  const payroll = parseYmd(payrollDateIso);
  const start = parseYmd(a.dealFirstPayoutDate);
  if (!payroll || !start) return null;

  // Cycle defines the day of month — the payroll date must land on it.
  if (payroll.d !== cycle) return null;

  // Which payout number does this month correspond to? (start month = payout 1)
  const monthIndex = payroll.y * 12 + payroll.m - (start.y * 12 + start.m);
  if (monthIndex < 0 || monthIndex >= term) return null;

  return {
    allocationId: a.allocationId,
    dealId: a.dealId,
    dealName: a.dealName,
    amount: Math.round(monthly),
    paymentNumber: monthIndex + 1,
    totalPayments: term,
  };
}

/**
 * Group all payouts due on a given payroll date by investor.
 */
export function computePayoutsForDate(
  allocations: PayoutAllocationInput[],
  payrollDateIso: string
): InvestorPayout[] {
  const byInvestor = new Map<string, InvestorPayout>();

  for (const a of allocations) {
    const line = payoutDueOn(a, payrollDateIso);
    if (!line) continue;

    const key = `${a.investorId}:${a.investorSource ?? ''}`;
    const existing = byInvestor.get(key);
    if (existing) {
      existing.deals.push(line);
      existing.expectedTotal += line.amount;
    } else {
      byInvestor.set(key, {
        investorId: a.investorId,
        investorSource: a.investorSource ?? null,
        investorName: a.investorName,
        expectedTotal: line.amount,
        deals: [line],
      });
    }
  }

  return Array.from(byInvestor.values()).sort((x, y) =>
    x.investorName.localeCompare(y.investorName)
  );
}

/**
 * All scheduled payout dates for one deal (ISO 'YYYY-MM-DD'), on the cycle day,
 * from the first payout month for `term` months. Used to drive the dashboard's
 * date navigation.
 */
export function dealPayoutDates(
  firstPayoutDate: string | null,
  payoutCycle: number | string | null,
  termMonths: number | string | null
): string[] {
  const start = firstPayoutDate ? parseYmd(firstPayoutDate) : null;
  const cycle = num(payoutCycle);
  const term = Math.floor(num(termMonths));
  if (!start || (cycle !== 1 && cycle !== 15) || term <= 0) return [];

  const dates: string[] = [];
  for (let i = 0; i < term; i++) {
    const absMonth = start.m + i;
    const y = start.y + Math.floor(absMonth / 12);
    const m = ((absMonth % 12) + 12) % 12;
    dates.push(`${y}-${String(m + 1).padStart(2, '0')}-${String(cycle).padStart(2, '0')}`);
  }
  return dates;
}
