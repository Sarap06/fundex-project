import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

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
    const funded = allocs.filter((a: any) => a.funding_status === 'Funded' && a.status === 'confirmed');

    const totalInvested = allocs.reduce((s: number, a: any) => s + Number(a.allocation_amount || 0), 0);

    // Calculate earnings from each allocation
    let totalEarned = 0;
    let thisMonthEarnings = 0;
    let earningsFromActive = 0;
    let earningsFromCompleted = 0;
    const monthlyEarningsMap = new Map<string, number>();
    const portfolioGrowthMap = new Map<string, number>();
    let runningTotal = 0;
    let completedDeals = 0;
    let totalDurationMonths = 0;

    for (const a of funded) {
      const monthlyInt = Number(a.monthly_interest || 0);
      const termMonths = Number(a.term_length || 0);
      const startDate = a.payment_start_date ? new Date(a.payment_start_date) : null;

      if (!startDate) continue;

      // Walk through each payment month
      for (let i = 1; i <= termMonths; i++) {
        const paymentDate = new Date(startDate);
        paymentDate.setMonth(paymentDate.getMonth() + i);

        if (paymentDate > now) break;

        totalEarned += monthlyInt;
        const monthKey = paymentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        monthlyEarningsMap.set(monthKey, (monthlyEarningsMap.get(monthKey) || 0) + monthlyInt);

        // Check if this month
        if (paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear()) {
          thisMonthEarnings += monthlyInt;
        }
      }

      // Track earnings by deal status
      const isCompleted = a.deals?.status === 'Closed' || a.deals?.status === 'Completed';
      if (isCompleted) {
        completedDeals++;
        totalDurationMonths += termMonths;
        earningsFromCompleted += monthlyInt * Math.min(termMonths, (() => {
          const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
          return Math.max(0, monthsDiff);
        })());
      } else {
        earningsFromActive += monthlyInt * Math.min(termMonths, (() => {
          const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
          return Math.max(0, monthsDiff);
        })());
      }
    }

    // Build portfolio growth (cumulative)
    const sortedMonths = Array.from(monthlyEarningsMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());

    for (const [month, earnings] of sortedMonths) {
      runningTotal += earnings;
      portfolioGrowthMap.set(month, runningTotal);
    }

    const portfolioGrowth = Array.from(portfolioGrowthMap.entries()).map(([month, total]) => ({
      month,
      total,
    }));

    const monthlyEarnings = Array.from(monthlyEarningsMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([month, amount]) => ({ month, amount }));

    // Calculate avg deal return
    const avgDealReturn = funded.length > 0
      ? funded.reduce((s: number, a: any) => s + Number(a.annual_rate || 0), 0) / funded.length
      : 0;

    // Expected earnings
    const totalMonthlyIncome = funded.reduce((s: number, a: any) => s + Number(a.monthly_interest || 0), 0);
    const next30Days = totalMonthlyIncome;
    const next90Days = totalMonthlyIncome * 3;
    let remainingExpected = 0;
    for (const a of funded) {
      const monthlyInt = Number(a.monthly_interest || 0);
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
