import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

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

    // Get deals this investor is linked to via deal_investors, scoped by company
    const { data: dealInvestorLinks } = await supabase
      .from('deal_investors')
      .select('deal_id, deals!inner(company_id)')
      .eq('investor_id', userId)
      .eq('investor_source', 'user_profiles')
      .eq('deals.company_id', companyId);

    const linkedDealIds = (dealInvestorLinks || []).map((di: any) => di.deal_id);

    // Get allocations for this investor (via investors table FK)
    let allocations: any[] = [];
    if (investorRecord) {
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
        .eq('investor_id', investorRecord.id);

      allocations = allocs || [];
    }

    // Calculate portfolio stats
    const confirmedAllocations = allocations.filter((a: any) => a.status === 'confirmed');
    const pendingAllocations = allocations.filter((a: any) => a.status === 'pending' || a.status === 'review');
    const fundedAllocations = confirmedAllocations.filter((a: any) => a.funding_status === 'Funded');

    const totalCapital = allocations.reduce(
      (sum: number, a: any) => sum + Number(a.allocation_amount || 0), 0
    );
    const capitalDeployed = fundedAllocations.reduce(
      (sum: number, a: any) => sum + Number(a.allocation_amount || 0), 0
    );
    const monthlyIncome = fundedAllocations.reduce(
      (sum: number, a: any) => sum + Number(a.monthly_interest || 0), 0
    );
    const fundsBeingDeployed = pendingAllocations.reduce(
      (sum: number, a: any) => sum + Number(a.allocation_amount || 0), 0
    );

    // Count active deals
    const activeDealCount = new Set(
      fundedAllocations
        .filter((a: any) => a.deals?.status === 'Active')
        .map((a: any) => a.deals?.id)
    ).size;

    // Calculate collateral backing from deals with funded allocations
    const uniqueDealIds = new Set(fundedAllocations.map((a: any) => a.deals?.id).filter(Boolean));
    let totalCollateralValue = 0;
    let totalLtvSum = 0;
    let ltvCount = 0;

    for (const alloc of fundedAllocations) {
      if (alloc.deals && uniqueDealIds.has(alloc.deals.id)) {
        const propValue = Number(alloc.deals.estimated_property_value || 0);
        const ltv = Number(alloc.deals.loan_to_value_ratio || 0);
        if (propValue > 0) {
          totalCollateralValue += propValue;
          uniqueDealIds.delete(alloc.deals.id); // count each deal once
        }
        if (ltv > 0) {
          totalLtvSum += ltv;
          ltvCount++;
        }
      }
    }

    const avgLtv = ltvCount > 0 ? Math.round(totalLtvSum / ltvCount) : 0;

    // Calculate upcoming payments (next 30 days)
    const now = new Date();
    const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    let upcomingPaymentCount = 0;
    let upcomingPaymentTotal = 0;
    let nextPaymentDays: number | null = null;

    for (const alloc of fundedAllocations) {
      if (!alloc.payment_start_date || !alloc.monthly_interest) continue;

      const startDate = new Date(alloc.payment_start_date);
      const monthlyAmt = Number(alloc.monthly_interest);

      // Find the next payment date after today
      const current = new Date(startDate);
      while (current <= now) {
        current.setMonth(current.getMonth() + 1);
      }

      if (current <= thirtyDaysOut) {
        upcomingPaymentCount++;
        upcomingPaymentTotal += monthlyAmt;
        const daysUntil = Math.ceil((current.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (nextPaymentDays === null || daysUntil < nextPaymentDays) {
          nextPaymentDays = daysUntil;
        }
      }
    }

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
    const maturingInvestments = fundedAllocations.filter((a: any) => {
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
          total: upcomingPaymentTotal,
          count: upcomingPaymentCount,
          nextInDays: nextPaymentDays,
        },
        fundsBeingDeployed,
        activeDealCount,
        collateral: {
          totalValue: totalCollateralValue,
          avgLtv,
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
