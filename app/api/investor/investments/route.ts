import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  activeDeployedCapital,
  activeDealsCount,
  averageActivePositionSize,
  currentMonthlyIncome,
  largestActivePosition,
  weightedAverageAnnualRate,
} from '@/services/portfolio-metrics';
import { dealPayoutDates } from '@/services/payout-service';

/**
 * GET /api/investor/investments
 * Returns all allocations (investments) for the authenticated investor,
 * with deal details, payment progress, and maturity info.
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

    // Find investor record by email
    const { data: investorRecord } = await supabase
      .from('investors')
      .select('id')
      .eq('company_id', companyId)
      .eq('email', profile.email)
      .single();

    // Allocations can be keyed by either the investors-table row id (manually
    // added investors) or the auth user id (signed-up investors) — query both.
    const investorIds = Array.from(
      new Set([investorRecord?.id, user.id].filter(Boolean))
    ) as string[];

    // Get all allocations with deal details
    const { data: allocations } = await supabase
      .from('allocations')
      .select(`
        id, allocation_amount, allocation_percentage, monthly_interest, annual_rate,
        term_length, term_unit, payment_frequency, payment_start_date,
        commit_date, expected_funding_date, funding_status, status, notes,
        deals (id, deal_id, name, type, status, target_amount, raised_amount,
               interest_rate, term, close_date, first_payout_date, payout_cycle,
               collateral_address, estimated_property_value, loan_to_value_ratio,
               location_state, location_city, borrower_name)
      `)
      .eq('company_id', companyId)
      .in('investor_id', investorIds)
      .order('created_at', { ascending: false });

    const allocs = allocations || [];

    // Calculate stats (normalized definitions)
    const totalCapital = allocs.reduce((s: number, a: any) => s + Number(a.allocation_amount || 0), 0);
    const activeCapital = activeDeployedCapital(allocs);
    const monthlyIncome = currentMonthlyIncome(allocs);
    const avgPositionSize = averageActivePositionSize(allocs);
    const largestInvestment = largestActivePosition(allocs);
    const activeDealCount = activeDealsCount(allocs);
    // Useful for future UI: weighted average rate across active positions.
    const _weightedAvgRate = weightedAverageAnnualRate(allocs);

    // Map investments with calculated fields
    const now = new Date();
    const investments = allocs.map((a: any) => {
      const amount = Number(a.allocation_amount || 0);
      const monthlyInt = Number(a.monthly_interest || 0);
      const rate = Number(a.annual_rate || 0);
      const termMonths = Number(a.term_length || 0);
      const dealTarget = Number(a.deals?.target_amount || 0);
      const ltv = Number(a.deals?.loan_to_value_ratio || 0);

      // Calculate payment progress
      let paymentsCompleted = 0;
      const totalPayments = termMonths;
      if (a.payment_start_date && a.funding_status === 'Funded') {
        const startDate = new Date(a.payment_start_date);
        const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
        paymentsCompleted = Math.max(0, Math.min(monthsDiff, totalPayments));
      }

      // Calculate maturity date
      let maturityDate: string | null = null;
      if (a.payment_start_date && termMonths > 0) {
        const start = new Date(a.payment_start_date);
        start.setMonth(start.getMonth() + termMonths);
        maturityDate = start.toISOString().split('T')[0];
      }

      // Calculate next payment date
      let nextPaymentDate: string | null = null;
      if (a.payment_start_date && a.funding_status === 'Funded' && paymentsCompleted < totalPayments) {
        const start = new Date(a.payment_start_date);
        start.setMonth(start.getMonth() + paymentsCompleted + 1);
        nextPaymentDate = start.toISOString().split('T')[0];
      }

      // Build the actual payment schedule dates. Prefer the deal-level payout
      // schedule (first_payout_date + cycle day, `term` months) so dates match
      // exactly when payouts land; fall back to the allocation's payment_start_date
      // stepped monthly when the deal has no explicit payout schedule configured.
      let paymentSchedule: string[] = dealPayoutDates(
        a.deals?.first_payout_date ?? null,
        a.deals?.payout_cycle ?? null,
        termMonths
      );
      if (paymentSchedule.length === 0 && a.payment_start_date && termMonths > 0) {
        const base = new Date(a.payment_start_date);
        paymentSchedule = Array.from({ length: termMonths }, (_, i) => {
          const d = new Date(base);
          d.setMonth(d.getMonth() + i);
          return d.toISOString().split('T')[0];
        });
      }

      // Fallback: compute monthly interest if not stored
      const effectiveMonthlyInt = monthlyInt > 0 ? monthlyInt : (amount * rate) / 12;
      // Fallback: compute ownership % if not stored
      const storedPct = Number(a.allocation_percentage || 0);
      const effectivePct = storedPct > 0 ? storedPct : (dealTarget > 0 ? (amount / dealTarget) * 100 : 0);

      return {
        id: a.id,
        dealId: a.deals?.deal_id || '',
        dealName: a.deals?.name || '',
        dealType: a.deals?.type || '',
        dealStatus: a.deals?.status || '',
        dealSize: dealTarget,
        investedAmount: amount,
        status: a.status,
        fundingStatus: a.funding_status,
        monthlyInterest: effectiveMonthlyInt,
        annualRate: rate,
        paymentsCompleted,
        totalPayments,
        paymentSchedule,
        nextPaymentDate,
        maturityDate,
        ltv,
        totalEarned: effectiveMonthlyInt * paymentsCompleted,
        totalExpectedReturn: effectiveMonthlyInt * totalPayments,
        allocationPercentage: Math.round(effectivePct * 10) / 10,
        commitDate: a.commit_date,
        location: [a.deals?.location_city, a.deals?.location_state].filter(Boolean).join(', '),
      };
    });

    // Calculate maturing positions (within 90 days)
    const ninetyDaysOut = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const maturingPositions = investments.filter((inv: any) => {
      if (!inv.maturityDate) return false;
      const maturity = new Date(inv.maturityDate);
      return maturity >= now && maturity <= ninetyDaysOut && inv.fundingStatus === 'Funded';
    });

    return NextResponse.json({
      investments,
      maturingPositions,
      stats: {
        totalCapital,
        activeCapital,
        avgPositionSize,
        largestInvestment,
        monthlyIncome,
        activeDealCount,
      },
    });
  } catch (error) {
    console.error('[INVESTOR_INVESTMENTS] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
