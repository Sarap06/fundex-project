import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  activeDeployedCapital,
  capitalInDeployment,
  collateralBackingActiveDeals,
  currentMonthlyIncome,
  totalCommittedCapital,
  activeDealsCount,
  projectUpcomingPayments,
} from '@/services/portfolio-metrics';

/**
 * GET /api/investor/dashboard
 * Returns aggregated dashboard data for the authenticated investor:
 * - Portfolio stats (total capital, deployed, monthly income, upcoming payments)
 * - Funds being deployed
 * - Collateral backing
 * - Actions required (unacknowledged broadcasts, maturing investments, new documents)
 * - Recent activity
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, user_id, email, full_name, company_id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.company_id || profile.role !== 'investor') {
      return NextResponse.json({ error: 'Not an investor' }, { status: 403 });
    }

    const companyId = profile.company_id;
    const userEmail = profile.email;
    const userId = user.id;

    // Find the investor record in the investors table by email match
    const { data: investorRecord } = await supabase
      .from('investors')
      .select('id')
      .eq('company_id', companyId)
      .eq('email', userEmail)
      .single();

    // The same investor can be linked two ways: by their user_profiles user id
    // (signed-up investors) or by their investors-table row id (manually added).
    // Query both so counts and amounts cover every allocation/link.
    const investorIds = Array.from(
      new Set([investorRecord?.id, userId].filter(Boolean))
    ) as string[];

    // Get deals this investor is linked to via deal_investors, scoped by company
    const dealInvestorFilter = investorRecord
      ? `and(investor_id.eq.${userId},investor_source.eq.user_profiles),and(investor_id.eq.${investorRecord.id},investor_source.eq.investors)`
      : `and(investor_id.eq.${userId},investor_source.eq.user_profiles)`;

    const { data: dealInvestorLinks } = await supabase
      .from('deal_investors')
      .select('deal_id, deals!inner(company_id)')
      .or(dealInvestorFilter)
      .eq('deals.company_id', companyId);

    const linkedDealIds = (dealInvestorLinks || []).map((di: any) => di.deal_id);

    // Get allocations for this investor (both identity keys)
    const { data: allocs } = await supabase
      .from('allocations')
      .select(`
        id, allocation_amount, monthly_interest, annual_rate, term_length, term_unit,
        payment_frequency, payment_start_date, commit_date, expected_funding_date,
        funding_status, status, notes,
        deals (id, name, deal_id, status, type, target_amount, interest_rate, term,
               collateral_address, estimated_property_value, loan_to_value_ratio,
               close_date, first_payout_date, location_state, location_city)
      `)
      .eq('company_id', companyId)
      .in('investor_id', investorIds);

    const allocations: any[] = allocs || [];

    // ── Portfolio stats (normalized definitions) ────────────────────────
    const totalCapital = totalCommittedCapital(allocations);
    const capitalDeployed = activeDeployedCapital(allocations);
    const fundsBeingDeployed = capitalInDeployment(allocations);
    const monthlyIncome = currentMonthlyIncome(allocations);
    const collateral = collateralBackingActiveDeals(allocations);
    const activeDealCount = activeDealsCount(allocations);

    // Upcoming payments projection (next 30 days)
    const now = new Date();
    const upcoming = projectUpcomingPayments(allocations, { windowDays: 30, now });

    // Check for unacknowledged broadcast updates
    let unacknowledgedBroadcasts = 0;
    if (linkedDealIds.length > 0) {
      const { data: sentUpdates } = await supabase
        .from('broadcast_updates')
        .select('id')
        .in('deal_id', linkedDealIds)
        .eq('is_sent', true)
        .eq('require_acknowledgment', true);

      if (sentUpdates && sentUpdates.length > 0) {
        const updateIds = sentUpdates.map((u: any) => u.id);
        const { data: recipients } = await supabase
          .from('broadcast_update_recipients')
          .select('broadcast_update_id, acknowledged_at')
          .in('broadcast_update_id', updateIds)
          .eq('investor_id', userId)
          .eq('investor_source', 'user_profiles');

        const ackedSet = new Set(
          (recipients || [])
            .filter((r: any) => r.acknowledged_at)
            .map((r: any) => r.broadcast_update_id)
        );
        unacknowledgedBroadcasts = updateIds.filter((id: string) => !ackedSet.has(id)).length;
      }
    }

    // Check for maturing investments (within 90 days)
    const ninetyDaysOut = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const maturingInvestments = allocations
      .filter((a: any) => a.status === 'confirmed' && a.funding_status === 'Funded' && a.deals?.status === 'Active')
      .filter((a: any) => {
      if (!a.payment_start_date || !a.term_length) return false;
      const start = new Date(a.payment_start_date);
      const termMonths = Number(a.term_length);
      const maturityDate = new Date(start);
      maturityDate.setMonth(maturityDate.getMonth() + termMonths);
      return maturityDate >= now && maturityDate <= ninetyDaysOut;
    }).length;

    // Check for new documents (last 7 days)
    let newDocuments = 0;
    if (investorRecord) {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('investor_id', investorRecord.id)
        .gte('upload_date', sevenDaysAgo);
      newDocuments = count || 0;
    }

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('activity_logs')
      .select('id, activity_type, title, description, deal_name, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      stats: {
        totalCapital,
        capitalDeployed,
        monthlyIncome,
        upcomingPayments: {
          total: upcoming.totalAmount,
          count: upcoming.count,
          nextInDays: upcoming.nextInDays,
        },
        fundsBeingDeployed,
        activeDealCount,
        collateral: {
          totalValue: collateral.totalValue,
          avgLtv: collateral.avgLtv,
        },
      },
      actions: {
        unacknowledgedBroadcasts,
        maturingInvestments,
        newDocuments,
      },
      recentActivity: (recentActivity || []).map((a: any) => ({
        id: a.id,
        type: a.activity_type,
        title: a.title,
        description: a.description,
        dealName: a.deal_name,
        createdAt: a.created_at,
      })),
      allocations: allocations.map((a: any) => ({
        id: a.id,
        amount: Number(a.allocation_amount),
        monthlyInterest: Number(a.monthly_interest || 0),
        annualRate: Number(a.annual_rate || 0),
        status: a.status,
        fundingStatus: a.funding_status,
        dealName: a.deals?.name || '',
        dealStatus: a.deals?.status || '',
        dealType: a.deals?.type || '',
      })),
    });
  } catch (error) {
    console.error('[INVESTOR_DASHBOARD] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
