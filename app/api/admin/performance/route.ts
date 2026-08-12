import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/services/access';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  activeDeployedCapital,
  capitalInDeployment,
  currentMonthlyIncome,
  projectUpcomingPayments,
  weightedAverageAnnualRate,
} from '@/services/portfolio-metrics';
import { getPayoutOperationsSummary } from '@/services/payments-service';

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth(request);
    if (ctx.role !== 'admin' && ctx.role !== 'partner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const companyId = ctx.companyId;

    // ── Fetch deals ────────────────────────────────────────────────────
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select('id, name, deal_id, status, target_amount, raised_amount, interest_rate, term, close_date, milestone_type, investor_count, document_status')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (dealsError) throw dealsError;

    // ── Fetch allocations (+ deal status for normalized formulas) ──────
    const { data: allocations, error: allocError } = await supabase
      .from('allocations')
      .select(`
        id, deal_id, allocation_amount, monthly_interest, annual_rate, funding_status, status,
        commit_date, payment_start_date, expected_funding_date, term_length, term_unit,
        deals (id, status)
      `)
      .eq('company_id', companyId);

    if (allocError) throw allocError;

    const allDeals = deals ?? [];
    const allAllocs = allocations ?? [];
    const allAllocsForMetrics = allAllocs.map((a: any) => ({
      ...a,
      deals: Array.isArray(a.deals) ? a.deals[0] : a.deals,
    }));

    // ── KPI Calculations ──────────────────────────────────────────────
    const activeDeals = allDeals.filter(d => d.status === 'Active');
    const fundedAllocs = allAllocs.filter(a => a.funding_status === 'Funded');

    // Normalized (firm layer):
    // - Total Active Principal = active deployed capital (active deals, funded, confirmed)
    // - Available Cash (placeholder name) = capital pending funding / in deployment
    // - Monthly Interest Due = expected monthly interest from currently active allocations
    const totalActivePrincipal = activeDeployedCapital(allAllocsForMetrics);
    const availableCash = capitalInDeployment(allAllocsForMetrics);
    const monthlyInterestDue = currentMonthlyIncome(allAllocsForMetrics);

    // Net spread: rough estimate — use average funded rate as margin indicator
    const avgRate = weightedAverageAnnualRate(allAllocsForMetrics);
    const netSpread = (totalActivePrincipal * (avgRate / 100)) / 12;

    const contractsAtRisk = allDeals.filter(d =>
      d.milestone_type === 'urgent' || d.milestone_type === 'attention'
    ).length;

    const now = new Date();

    // ── Payment Operations (real payout data) ──────────────────────────
    // Sourced from the payments backend — the schedule/allocation proxy and the
    // hardcoded drill-down that used to live here are gone.
    const payoutOps = await getPayoutOperationsSummary(companyId, now.toISOString());
    const totalPaidYTD = payoutOps.totalPaidYTD;
    const overdue = payoutOps.overdue;

    // Kept only for the contract table's "next payment" column and capital chart.
    const payoutProjection = projectUpcomingPayments(allAllocsForMetrics, { windowDays: 30, now });
    const nextPayoutDate = payoutProjection.nextPaymentDate;

    // ── Capital Flow Chart (last 7 months) ───────────────────────────
    const months: { month: string; label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: d.toISOString().slice(0, 7),
        label: d.toLocaleString('en-US', { month: 'short' }),
      });
    }

    const capitalFlow = months.map(({ month, label }) => {
      const capitalIn = allAllocs
        .filter(a => a.commit_date?.slice(0, 7) === month)
        .reduce((s, a) => s + Number(a.allocation_amount || 0) / 1_000_000, 0);

      const interestOut = fundedAllocs
        .filter(a => a.payment_start_date && a.payment_start_date.slice(0, 7) <= month)
        .reduce((s, a) => s + Number(a.monthly_interest || 0) / 1_000_000, 0);

      return { month: label, capitalIn: Math.round(capitalIn * 10) / 10, interestOut: Math.round(interestOut * 10) / 10, principalReturned: 0 };
    });

    // ── Contract Performance Table ───────────────────────────────────
    const allocsByDeal = new Map<string, typeof allAllocs>();
    allAllocs.forEach(a => {
      if (!allocsByDeal.has(a.deal_id)) allocsByDeal.set(a.deal_id, []);
      allocsByDeal.get(a.deal_id)!.push(a);
    });

    // Show any deal that is Active OR has at least one allocation — an allocated
    // deal must be visible here even while still in "Funding" (previously this
    // filtered to status === 'Active' only, so allocated Funding deals vanished
    // from the contracts table). Unfunded allocations render as zeros below.
    const contractDeals = allDeals.filter(
      d => d.status === 'Active' || (allocsByDeal.get(d.id)?.length ?? 0) > 0
    );

    const contractPerformance = contractDeals.map(deal => {
      const dealAllocs = allocsByDeal.get(deal.id) ?? [];
      const fundedDealAllocs = dealAllocs.filter(a => a.funding_status === 'Funded' && (a.status ?? '').toLowerCase() === 'confirmed');
      const principalDeployed = fundedDealAllocs.reduce((s, a) => s + Number(a.allocation_amount || 0), 0);
      const totalMonthly = fundedDealAllocs.reduce((s, a) => s + Number(a.monthly_interest || 0), 0);

      // Payments completed: months since earliest payment_start_date
      const earliestStart = fundedDealAllocs
        .map(a => a.payment_start_date)
        .filter(Boolean)
        .sort()[0];
      const paymentsCompleted = earliestStart
        ? Math.max(0, (now.getFullYear() - new Date(earliestStart).getFullYear()) * 12 + now.getMonth() - new Date(earliestStart).getMonth())
        : 0;

      // Term in months
      const termMonths = fundedDealAllocs[0]?.term_length ?? 12;

      return {
        id: deal.id,
        dealId: deal.deal_id,
        name: deal.name,
        principalDeployed,
        interestRate: Number(deal.interest_rate ?? 0),
        monthlyInterest: totalMonthly,
        paymentsCompleted,
        totalPayments: termMonths,
        nextPaymentDate: nextPayoutDate,
        outstandingBalance: principalDeployed,
        status: deal.status,
        riskLevel: deal.milestone_type === 'urgent' ? 'Late Payment' : 'On Schedule',
      };
    });

    // ── Portfolio Risk (real alerts, no hardcoded rows) ────────────────
    const monthLabel = (iso: string) => {
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
      return m
        ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleString('en-US', { month: 'short', year: 'numeric' })
        : iso;
    };
    const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

    // Late-payment alerts — real overdue payouts, grouped per deal.
    const lateAlerts = payoutOps.lateAlerts.map((a) => ({
      id: `late-${a.dealId}`,
      contract: a.dealName,
      issue: 'Late Payment',
      severity: 'High' as const,
      description: `${a.count} overdue payout${a.count === 1 ? '' : 's'} · ${money(a.amount)} outstanding since ${monthLabel(a.since)}`,
    }));

    // Missing-document alerts — active deals whose document package is pending.
    const docAlerts = activeDeals
      .filter((d) => (d.document_status ?? '').toLowerCase() === 'pending')
      .map((d) => ({
        id: `docs-${d.id}`,
        contract: d.name,
        issue: 'Missing Documents',
        severity: 'Medium' as const,
        description: 'Required documents still pending',
      }));

    // Contracts nearing maturity — active deals closing within 90 days.
    const ninetyDays = new Date();
    ninetyDays.setDate(ninetyDays.getDate() + 90);
    const maturityDeals = activeDeals.filter((d) => {
      if (!d.close_date) return false;
      const closeDate = new Date(d.close_date);
      return closeDate <= ninetyDays && closeDate >= now;
    });
    const maturityAlerts = maturityDeals.map((d) => ({
      id: `maturity-${d.id}`,
      contract: d.name,
      issue: 'Nearing Maturity',
      severity: 'Low' as const,
      description: `Closes ${monthLabel(d.close_date as string)}`,
    }));

    const alerts = [...lateAlerts, ...docAlerts, ...maturityAlerts];
    const latePayments = lateAlerts.length;
    const contractsNearingMaturity = maturityAlerts.length;

    return NextResponse.json({
      kpis: {
        totalActivePrincipal,
        availableCash,
        monthlyInterestDue,
        netSpread,
        contractsAtRisk,
        totalPaidYTD,
        avgRate: Math.round(avgRate * 100) / 100,
      },
      paymentOps: {
        paidThisCycle: payoutOps.paidThisCycle,
        pending: payoutOps.pending,
        overdue: payoutOps.overdue,
        upcomingThisWeek: payoutOps.upcomingThisWeek,
        nextPayoutDate: payoutOps.nextPayoutDate,
        nextPayoutAmount: payoutOps.nextPayoutAmount,
        activeInvestors: payoutOps.nextPayoutInvestors,
      },
      capitalFlow,
      risk: {
        latePayments,
        missingDocuments: docAlerts.length,
        contractsNearingMaturity,
        alerts,
      },
      contractPerformance,
      distributions: {
        totalPaidYTD,
        nextDistributionDate: payoutOps.nextPayoutDate,
        nextDistributionAmount: payoutOps.nextPayoutAmount,
        activeInvestors: payoutOps.nextPayoutInvestors,
        avgPayment: payoutOps.avgPaymentThisCycle,
        onTimeRate: payoutOps.onTimeRate,
      },
    });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[PERFORMANCE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
