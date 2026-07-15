export type PaymentScheduleStatus = 'paid' | 'pending' | 'upcoming';

export interface PaymentScheduleRow {
  number: number;
  dueDate: string;
  amount: number;
  status: PaymentScheduleStatus;
}

export interface PaymentScheduleAllocation {
  payment_start_date?: string | null;
  term_length?: number | string | null;
  monthly_interest?: number | string | null;
  allocation_amount?: number | string | null;
  annual_rate?: number | string | null;
  funding_status?: string | null;
}

function num(v: unknown): number {
  const n = typeof v === 'string' ? Number(v) : (typeof v === 'number' ? v : 0);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Effective monthly interest: uses stored value if present, otherwise
 * falls back to allocation_amount × (annual_rate% / 100) / 12 — the same
 * formula the allocation create route uses.
 */
function effectiveMonthlyInterest(a: PaymentScheduleAllocation): number {
  const stored = num(a.monthly_interest);
  if (stored > 0) return stored;
  return (num(a.allocation_amount) * (num(a.annual_rate) / 100)) / 12;
}

function isFunded(a: PaymentScheduleAllocation): boolean {
  return (a.funding_status ?? '').toLowerCase() === 'funded';
}

function formatDueDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type RawScheduleEntry = { due: Date; amount: number; status: PaymentScheduleStatus };

/**
 * Derive one allocation's monthly payment entries from payment_start_date,
 * term_length and monthly interest. There is no payments table yet, so status
 * is projected from the schedule: past due dates count as 'paid' only when the
 * allocation is actually Funded — otherwise they stay 'pending'. Future due
 * dates are 'upcoming'.
 */
function buildScheduleEntries(a: PaymentScheduleAllocation, now: Date): RawScheduleEntry[] {
  const startIso = a.payment_start_date;
  const termLength = Math.floor(num(a.term_length));
  const monthly = effectiveMonthlyInterest(a);
  if (!startIso || termLength <= 0 || monthly <= 0) return [];

  // Parse a 'YYYY-MM-DD' date column into local calendar parts (avoid the
  // UTC-midnight shift that makes date-only strings render a day early).
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(startIso);
  let startYear: number, startMonth: number, startDay: number;
  if (m) {
    startYear = Number(m[1]);
    startMonth = Number(m[2]) - 1;
    startDay = Number(m[3]);
  } else {
    const d = new Date(startIso);
    if (Number.isNaN(d.getTime())) return [];
    startYear = d.getFullYear();
    startMonth = d.getMonth();
    startDay = d.getDate();
  }

  const funded = isFunded(a);
  const entries: RawScheduleEntry[] = [];

  for (let i = 0; i < termLength; i++) {
    // Advance whole months with a day-clamp so end-of-month starts (e.g. the
    // 31st) don't overflow into the next month — a raw setMonth would turn
    // Feb 31 into Mar 3 and collide month keys in the deal-level merge.
    const absMonth = startMonth + i;
    const year = startYear + Math.floor(absMonth / 12);
    const month = ((absMonth % 12) + 12) % 12;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const due = new Date(year, month, Math.min(startDay, lastDay));
    const isPast = due <= now;
    entries.push({
      due,
      amount: monthly,
      status: isPast ? (funded ? 'paid' : 'pending') : 'upcoming',
    });
  }

  return entries;
}

/**
 * Payment schedule for a single allocation, shaped for PaymentHistoryModal.
 * Returns [] when the allocation lacks the fields needed to derive a schedule.
 */
export function buildPaymentSchedule(
  allocation: PaymentScheduleAllocation,
  options?: { now?: Date }
): PaymentScheduleRow[] {
  const now = options?.now ?? new Date();
  return buildScheduleEntries(allocation, now).map((e, i) => ({
    number: i + 1,
    dueDate: formatDueDate(e.due),
    amount: Math.round(e.amount),
    status: e.status,
  }));
}

/**
 * Deal-level payment schedule: merges every allocation's schedule by month,
 * summing amounts. A merged month is 'pending' if any allocation is pending
 * for it, 'paid' if all contributing allocations are paid, else 'upcoming'.
 */
export function buildDealPaymentSchedule(
  allocations: PaymentScheduleAllocation[],
  options?: { now?: Date }
): PaymentScheduleRow[] {
  const now = options?.now ?? new Date();
  const byMonth = new Map<number, { due: Date; amount: number; statuses: Set<PaymentScheduleStatus> }>();

  for (const a of allocations) {
    for (const e of buildScheduleEntries(a, now)) {
      const key = e.due.getFullYear() * 12 + e.due.getMonth();
      const existing = byMonth.get(key);
      if (existing) {
        existing.amount += e.amount;
        existing.statuses.add(e.status);
      } else {
        byMonth.set(key, { due: e.due, amount: e.amount, statuses: new Set([e.status]) });
      }
    }
  }

  return Array.from(byMonth.values())
    .sort((a, b) => a.due.getTime() - b.due.getTime())
    .map((m, i) => ({
      number: i + 1,
      dueDate: formatDueDate(m.due),
      amount: Math.round(m.amount),
      status: m.statuses.has('pending') ? 'pending' : m.statuses.has('upcoming') ? 'upcoming' : 'paid',
    }));
}
