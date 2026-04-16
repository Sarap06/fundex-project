import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/services/access';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

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

    // ── Fetch allocations ──────────────────────────────────────────────
    const { data: allocations, error: allocError } = await supabase
      .from('allocations')
      .select('id, deal_id, allocation_amount, monthly_interest, annual_rate, funding_status, commit_date, payment_start_date, expected_funding_date, term_length, term_unit')
      .eq('company_id', companyId);

    if (allocError) throw allocError;

    const allDeals = deals ?? [];
    const allAllocs = allocations ?? [];

    // ── KPI Calculations ──────────────────────────────────────────────
    const activeDeals = allDeals.filter(d => d.status === 'Active');
    const fundedAllocs = allAllocs.filter(a => a.funding_status === 'Funded');
    const pendingAllocs = allAllocs.filter(a => a.funding_status === 'Pending');

    const totalActivePrincipal = fundedAllocs.reduce((s, a) => s + Number(a.allocation_amount || 0), 0);
    const availableCash = pendingAllocs.reduce((s, a) => s + Number(a.allocation_amount || 0), 0);
    const monthlyInterestDue = fundedAllocs.reduce((s, a) => s + Number(a.monthly_interest || 0), 0);

    // Net spread: rough estimate — use average funded rate as margin indicator
    const avgRate = fundedAllocs.length
      ? fundedAllocs.reduce((s, a) => s + Number(a.annual_rate || 0), 0) / fundedAllocs.length
      : 0;
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

    // ── Payment Operations ────────────────────────────────────────────
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const todayStr = now.toISOString().slice(0, 10);
    const weekStr = weekFromNow.toISOString().slice(0, 10);

    const overdue = pendingAllocs.filter(a => a.expected_funding_date && a.expected_funding_date < todayStr).length;
    const upcomingThisWeek = pendingAllocs.filter(a =>
      a.expected_funding_date && a.expected_funding_date >= todayStr && a.expected_funding_date <= weekStr
    ).length;

    // Next payout date: earliest payment_start_date in the future or nearest upcoming
    const nextPayoutDate = fundedAllocs
      .map(a => a.payment_start_date)
      .filter(Boolean)
      .sort()
      .find(d => d >= todayStr) ?? null;

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
      const fundedDealAllocs = dealAllocs.filter(a => a.funding_status === 'Funded');
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
        paidThisCycle: fundedAllocs.length,
        pending: pendingAllocs.length,
        overdue,
        upcomingThisWeek,
        nextPayoutDate,
        nextPayoutAmount: monthlyInterestDue,
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
        nextDistributionAmount: monthlyInterestDue,
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
