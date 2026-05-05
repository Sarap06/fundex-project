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
      .select('id, name, deal_id, status, target_amount, raised_amount, interest_rate, term, close_date, milestone_type, investor_count')
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
    const pendingAllocs = allAllocs.filter(a => a.funding_status === 'Pending' || a.funding_status === 'Review');

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

    // Total Paid Out YTD: monthly_interest × months elapsed this year for funded allocs
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const now = new Date();
    const totalPaidYTD = fundedAllocs.reduce((s, a) => {
      if (!a.payment_start_date) return s;
      const start = new Date(a.payment_start_date) > yearStart ? new Date(a.payment_start_date) : yearStart;
      const monthsElapsed = Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth());
      return s + Number(a.monthly_interest || 0) * monthsElapsed;
    }, 0);

    // ── Payment Operations (schedule-based proxy) ──────────────────────
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const todayStr = now.toISOString().slice(0, 10);
    const weekStr = weekFromNow.toISOString().slice(0, 10);

    const overdue = pendingAllocs.filter(a => a.expected_funding_date && a.expected_funding_date < todayStr).length;
    const upcomingThisWeek = pendingAllocs.filter(a =>
      a.expected_funding_date && a.expected_funding_date >= todayStr && a.expected_funding_date <= weekStr
    ).length;

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

    const contractPerformance = activeDeals.map(deal => {
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

    // ── Portfolio Risk ────────────────────────────────────────────────
    const latePayments = overdue;
    const contractsNearingMaturity = activeDeals.filter(d => {
      if (!d.close_date) return false;
      const closeDate = new Date(d.close_date);
      const ninetyDays = new Date();
      ninetyDays.setDate(ninetyDays.getDate() + 90);
      return closeDate <= ninetyDays && closeDate >= now;
    }).length;

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
        paidThisCycle: fundedAllocs.length, // still allocation-based until a payments table exists
        pending: pendingAllocs.length,
        overdue,
        upcomingThisWeek,
        nextPayoutDate,
        nextPayoutAmount: payoutProjection.totalAmount,
        activeInvestors: allDeals.reduce((s, d) => s + (d.investor_count ?? 0), 0),
      },
      capitalFlow,
      risk: {
        latePayments,
        missingDocuments: allDeals.filter(d => d.milestone_type === 'attention').length,
        contractsNearingMaturity,
      },
      contractPerformance,
      distributions: {
        totalPaidYTD,
        nextDistributionDate: nextPayoutDate,
        nextDistributionAmount: payoutProjection.totalAmount,
        activeInvestors: allDeals.reduce((s, d) => s + (d.investor_count ?? 0), 0),
        avgPayment: fundedAllocs.length > 0 ? monthlyInterestDue / fundedAllocs.length : 0,
        onTimeRate: 98.2, // placeholder until payment records exist
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
