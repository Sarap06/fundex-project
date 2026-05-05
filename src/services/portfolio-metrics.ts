export type DealStatus = string | null | undefined;

export type AllocationLike = {
  allocation_amount?: number | string | null;
  monthly_interest?: number | string | null;
  annual_rate?: number | string | null;
  funding_status?: string | null;
  status?: string | null;
  payment_start_date?: string | null;
  term_length?: number | string | null;
  // Supabase can return related rows as an object or an array depending on select syntax.
  // Support both to keep API routes simple.
  deals?: ({
    id?: string | null;
    status?: string | null;
    estimated_property_value?: number | string | null;
    loan_to_value_ratio?: number | string | null;
    target_amount?: number | string | null;
  } | null) | Array<{
    id?: string | null;
    status?: string | null;
    estimated_property_value?: number | string | null;
    loan_to_value_ratio?: number | string | null;
    target_amount?: number | string | null;
  }>;
};

const ACTIVE_DEAL_STATUSES = new Set(['Active']);

// "Not active yet" statuses vary; treat anything not in ACTIVE as not-active.
function isDealActive(status: DealStatus): boolean {
  return !!status && ACTIVE_DEAL_STATUSES.has(status);
}

function num(v: unknown): number {
  const n = typeof v === 'string' ? Number(v) : (typeof v === 'number' ? v : 0);
  return Number.isFinite(n) ? n : 0;
}

function dealRow(a: AllocationLike): NonNullable<Exclude<AllocationLike['deals'], Array<any>>> | null {
  const d: any = (a as any).deals;
  if (!d) return null;
  if (Array.isArray(d)) return d[0] ?? null;
  return d;
}

export function isConfirmedAllocation(a: AllocationLike): boolean {
  // Current codebase uses `status === 'confirmed'` for live allocations.
  // Keep this strict so metrics don't unexpectedly include drafts/reviews.
  return (a.status ?? '').toLowerCase() === 'confirmed';
}

export function isFundedAllocation(a: AllocationLike): boolean {
  return (a.funding_status ?? '').toLowerCase() === 'funded';
}

export function isPendingDeploymentAllocation(a: AllocationLike): boolean {
  // "Deployment" = committed but not yet earning.
  // Current code uses status in (pending, review) in investor dashboard; admin uses funding_status Pending.
  // We unify by treating either as pending.
  const s = (a.status ?? '').toLowerCase();
  const fs = (a.funding_status ?? '').toLowerCase();
  return s === 'pending' || s === 'review' || fs === 'pending' || fs === 'review';
}

export function allocationAmount(a: AllocationLike): number {
  return num(a.allocation_amount);
}

export function allocationMonthlyInterest(a: AllocationLike): number {
  return num(a.monthly_interest);
}

export function allocationAnnualRate(a: AllocationLike): number {
  return num(a.annual_rate);
}

/**
 * Effective monthly interest: uses stored value if present, otherwise
 * falls back to allocation_amount × annual_rate / 12.
 */
export function effectiveMonthlyInterest(a: AllocationLike): number {
  const stored = allocationMonthlyInterest(a);
  if (stored > 0) return stored;
  return allocationAmount(a) * allocationAnnualRate(a) / 12;
}

export function activeFundedConfirmedAllocations(allocations: AllocationLike[]): AllocationLike[] {
  return allocations.filter((a) => isConfirmedAllocation(a) && isFundedAllocation(a) && isDealActive(dealRow(a)?.status));
}

/**
 * All funded+confirmed allocations regardless of deal status.
 * Use this for historical earnings calculations that should include
 * completed/closed deals, not just currently active ones.
 */
export function fundedConfirmedAllocations(allocations: AllocationLike[]): AllocationLike[] {
  return allocations.filter((a) => isConfirmedAllocation(a) && isFundedAllocation(a));
}

export function deployingConfirmedAllocations(allocations: AllocationLike[]): AllocationLike[] {
  // Must be confirmed/committed AND not yet active/funded.
  // If deal is not Active and allocation is pending deployment, treat as deploying.
  return allocations.filter((a) => {
    if (!isConfirmedAllocation(a) && !isPendingDeploymentAllocation(a)) return false;
    if (isFundedAllocation(a) && isDealActive(dealRow(a)?.status)) return false;
    return !isDealActive(dealRow(a)?.status);
  });
}

export function totalCommittedCapital(allocations: AllocationLike[]): number {
  return allocations.reduce((s, a) => s + allocationAmount(a), 0);
}

export function activeDeployedCapital(allocations: AllocationLike[]): number {
  return activeFundedConfirmedAllocations(allocations).reduce((s, a) => s + allocationAmount(a), 0);
}

export function capitalInDeployment(allocations: AllocationLike[]): number {
  return deployingConfirmedAllocations(allocations).reduce((s, a) => s + allocationAmount(a), 0);
}

export function activePositionsCount(allocations: AllocationLike[]): number {
  // Investor definition: count active investor allocations (positions), not distinct deals.
  return activeFundedConfirmedAllocations(allocations).length;
}

export function largestActivePosition(allocations: AllocationLike[]): number {
  const active = activeFundedConfirmedAllocations(allocations);
  if (active.length === 0) return 0;
  return Math.max(...active.map(allocationAmount));
}

export function averageActivePositionSize(allocations: AllocationLike[]): number {
  const count = activePositionsCount(allocations);
  if (count === 0) return 0;
  return activeDeployedCapital(allocations) / count;
}

export function currentMonthlyIncome(allocations: AllocationLike[]): number {
  // Expected monthly interest from currently active allocations.
  return activeFundedConfirmedAllocations(allocations).reduce((s, a) => s + effectiveMonthlyInterest(a), 0);
}

export function collateralBackingActiveDeals(allocations: AllocationLike[]): { totalValue: number; avgLtv: number } {
  // Total collateral value = sum unique active deal collateral values.
  const active = activeFundedConfirmedAllocations(allocations);
  const seenDealIds = new Set<string>();

  let totalCollateralValue = 0;
  // Weighted average LTV: weight each deal's stored LTV by this investor's allocation amount in that deal.
  let weightedLtvNumer = 0;
  let weightedLtvDenom = 0;

  for (const a of active) {
    const d = dealRow(a);
    const dealId = d?.id ?? null;
    if (!dealId) continue;

    const amount = allocationAmount(a);
    // Accumulate collateral value once per unique deal
    if (!seenDealIds.has(dealId)) {
      seenDealIds.add(dealId);
      const collateralValue = num(d?.estimated_property_value);
      if (collateralValue > 0) totalCollateralValue += collateralValue;
    }

    // Weighted LTV: use the deal's actual loan_to_value_ratio, weighted by investor's allocation.
    // This avoids the error of using investor's partial capital vs full collateral.
    const dealLtv = num(d?.loan_to_value_ratio);
    if (dealLtv > 0 && amount > 0) {
      weightedLtvNumer += dealLtv * amount;
      weightedLtvDenom += amount;
    }
  }

  const avgLtv = weightedLtvDenom > 0 ? Math.round(weightedLtvNumer / weightedLtvDenom) : 0;

  return { totalValue: totalCollateralValue, avgLtv };
}

export function weightedAverageAnnualRate(allocations: AllocationLike[]): number {
  // Weighted by allocation amount. Uses active funded confirmed allocations by default.
  const active = activeFundedConfirmedAllocations(allocations);
  const denom = active.reduce((s, a) => s + allocationAmount(a), 0);
  if (denom <= 0) return 0;
  const numer = active.reduce((s, a) => s + allocationAmount(a) * allocationAnnualRate(a), 0);
  return numer / denom;
}

export type UpcomingPaymentProjection = {
  totalAmount: number;
  count: number;
  nextPaymentDate: string | null;
  nextInDays: number | null;
};

/**
 * Schedule-based projection: looks at each active funded confirmed allocation and finds its next payment date
 * after "now", then aggregates those within a window.
 *
 * This intentionally mirrors existing behavior in investor/admin dashboards until a real payments table exists.
 */
export function projectUpcomingPayments(
  allocations: AllocationLike[],
  options?: { windowDays?: number; now?: Date }
): UpcomingPaymentProjection {
  const windowDays = options?.windowDays ?? 30;
  const now = options?.now ?? new Date();
  const windowEnd = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);

  const active = activeFundedConfirmedAllocations(allocations);
  let totalAmount = 0;
  let count = 0;
  let nextPaymentDate: Date | null = null;

  for (const a of active) {
    const startIso = a.payment_start_date;
    const monthly = effectiveMonthlyInterest(a);
    if (!startIso || monthly <= 0) continue;
    const start = new Date(startIso);
    if (Number.isNaN(start.getTime())) continue;

    const cursor = new Date(start);
    while (cursor <= now) cursor.setMonth(cursor.getMonth() + 1);

    if (cursor <= windowEnd) {
      totalAmount += monthly;
      count += 1;
    }

    if (!nextPaymentDate || cursor < nextPaymentDate) {
      nextPaymentDate = cursor;
    }
  }

  const nextInDays =
    nextPaymentDate ? Math.ceil((nextPaymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

  return {
    totalAmount,
    count,
    nextPaymentDate: nextPaymentDate ? nextPaymentDate.toISOString().slice(0, 10) : null,
    nextInDays,
  };
}

