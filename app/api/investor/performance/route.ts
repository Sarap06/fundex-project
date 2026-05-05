import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  activeFundedConfirmedAllocations,
  fundedConfirmedAllocations,
  currentMonthlyIncome,
  totalCommittedCapital,
  weightedAverageAnnualRate,
  effectiveMonthlyInterest,
} from '@/services/portfolio-metrics';

/**
 * GET /api/investor/performance
 * Returns portfolio performance data: earnings, growth, returns, expected earnings.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, company_id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.company_id || profile.role !== 'investor') {
      return NextResponse.json({ error: 'Not an investor' }, { status: 403 });
    }

    const companyId = profile.company_id;

    const { data: investorRecord } = await supabase
      .from('investors')
      .select('id')
      .eq('company_id', companyId)
      .eq('email', profile.email)
      .single();

    if (!investorRecord) {
      return NextResponse.json({
        stats: { totalEarned: 0, thisMonthEarnings: 0, totalInvested: 0, avgDealReturn: 0 },
        portfolioGrowth: [],
        monthlyEarnings: [],
        expectedEarnings: { next30Days: 0, next90Days: 0, remaining: 0 },
        insights: { dealsCompleted: 0, avgDealDuration: 0, reinvestmentRate: 0 },
      });
    }

    const { data: allocations } = await supabase
      .from('allocations')
      .select(`
        id, allocation_amount, monthly_interest, annual_rate,
        term_length, payment_start_date, funding_status, status,
        deals (id, name, status, type)
      `)
      .eq('company_id', companyId)
      .eq('investor_id', investorRecord.id);

    const allocs = allocations || [];
    const now = new Date();

    // Normalized: total committed capital (investor money committed into platform)
    const totalInvested = totalCommittedCapital(allocs);

    // Use ALL funded+confirmed allocations (active AND completed deals) for historical earnings.
    // activeFundedConfirmedAllocations only covers live deals, so completed deal earnings
    // would be silently dropped if we used that filter here.
    const allFunded = fundedConfirmedAllocations(allocs);

    let totalEarned = 0;
    let thisMonthEarnings = 0;
    let earningsFromActive = 0;
    let earningsFromCompleted = 0;
    const monthlyEarningsMap = new Map<string, number>();
    let completedDeals = 0;
    const seenCompletedDealIds = new Set<string>();
    let totalDurationMonths = 0;

    for (const a of allFunded) {
      const monthlyInt = effectiveMonthlyInterest(a);
      const termMonths = Number(a.term_length || 0);
      const startDate = a.payment_start_date ? new Date(a.payment_start_date) : null;
      if (!startDate || termMonths <= 0) continue;

      // Resolve deal status — Supabase can return relation as array or object
      const dealRow = Array.isArray(a.deals) ? (a.deals[0] ?? null) : (a.deals ?? null);
      const dealStatus = (dealRow as any)?.status ?? null;
      const dealId = (dealRow as any)?.id ?? null;
      const isCompleted = dealStatus === 'Closed' || dealStatus === 'Completed';

      // Walk through each payment month up to today
      let allocationEarned = 0;
      for (let i = 1; i <= termMonths; i++) {
        const paymentDate = new Date(startDate);
        paymentDate.setMonth(paymentDate.getMonth() + i);
        if (paymentDate > now) break;

        allocationEarned += monthlyInt;
        const monthKey = paymentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        monthlyEarningsMap.set(monthKey, (monthlyEarningsMap.get(monthKey) || 0) + monthlyInt);

        if (paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear()) {
          thisMonthEarnings += monthlyInt;
        }
      }

      totalEarned += allocationEarned;

      if (isCompleted) {
        earningsFromCompleted += allocationEarned;
        // Count each unique completed deal once for insights
        if (dealId && !seenCompletedDealIds.has(dealId)) {
          seenCompletedDealIds.add(dealId);
          completedDeals++;
          totalDurationMonths += termMonths;
        }
      } else {
        earningsFromActive += allocationEarned;
      }
    }

    // Build portfolio growth (cumulative) from the monthly earnings map
    const sortedMonths = Array.from(monthlyEarningsMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());

    let runningTotal = 0;
    const portfolioGrowth: { month: string; total: number }[] = [];
    for (const [month, earnings] of sortedMonths) {
      runningTotal += earnings;
      portfolioGrowth.push({ month, total: runningTotal });
    }

    const monthlyEarnings = sortedMonths.map(([month, amount]) => ({ month, amount }));

    // Normalized: weighted average annualized return across investor’s active deals
    const avgDealReturn = weightedAverageAnnualRate(allocs);

    // Expected earnings — only from currently active positions
    const activePositions = activeFundedConfirmedAllocations(allocs);
    const totalMonthlyIncome = currentMonthlyIncome(allocs);
    const next30Days = totalMonthlyIncome;
    const next90Days = totalMonthlyIncome * 3;
    let remainingExpected = 0;
    for (const a of activePositions) {
      const monthlyInt = effectiveMonthlyInterest(a);
      const termMonths = Number(a.term_length || 0);
      const startDate = a.payment_start_date ? new Date(a.payment_start_date) : null;
      if (!startDate) continue;

      const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
      const paymentsLeft = Math.max(0, termMonths - monthsDiff);
      remainingExpected += monthlyInt * paymentsLeft;
    }

    return NextResponse.json({
      stats: {
        totalEarned,
        thisMonthEarnings,
        totalInvested,
        avgDealReturn: Math.round(avgDealReturn * 10) / 10,
      },
      portfolioGrowth,
      monthlyEarnings,
      expectedEarnings: {
        next30Days,
        next90Days,
        remaining: remainingExpected,
      },
      earningsBreakdown: {
        fromActive: earningsFromActive,
        fromCompleted: earningsFromCompleted,
      },
      insights: {
        dealsCompleted: completedDeals,
        avgDealDuration: completedDeals > 0 ? Math.round(totalDurationMonths / completedDeals) : 0,
        reinvestmentRate: 0,
      },
    });
  } catch (error) {
    console.error('[INVESTOR_PERFORMANCE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
