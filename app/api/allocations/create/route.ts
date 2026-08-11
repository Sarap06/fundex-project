import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole, AuthError, getServiceClient } from '@/services/access';
import { logActivity } from '@/lib/activity-logger';
import { recalcDealRaisedAmount } from '@/services/deal-service';

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth(request);
    requireRole(ctx, ['admin', 'partner']);

    const supabase = getServiceClient();
    const body = await request.json();
    const {
      investor_id,
      deal_id,
      allocation_amount,
      allocation_percentage,
      commit_date,
      expected_funding_date,
      annual_rate,
      term_length,
      payment_frequency,
      payment_start_date,
      funding_status,
      notes,
    } = body;

    // company_id always comes from the session, never the request body
    const company_id = ctx.companyId;

    // Validate required fields
    if (!investor_id || !deal_id || !allocation_amount) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!commit_date || !expected_funding_date || !payment_start_date) {
      return NextResponse.json(
        { success: false, message: 'All date fields are required' },
        { status: 400 }
      );
    }

    // The deal must belong to the caller's company
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('id, name')
      .eq('id', deal_id)
      .eq('company_id', company_id)
      .single();

    if (dealError || !deal) {
      return NextResponse.json(
        { success: false, message: 'Deal not found' },
        { status: 404 }
      );
    }

    // The investor must also belong to the caller's company. investor_id can
    // reference either an investors row (id) or a signed-up user_profiles row
    // (user_id) — check both, scoped by company_id.
    const [{ data: manualInvestor }, { data: profileInvestor }] = await Promise.all([
      supabase.from('investors').select('full_name').eq('id', investor_id).eq('company_id', company_id).maybeSingle(),
      supabase.from('user_profiles').select('full_name').eq('user_id', investor_id).eq('company_id', company_id).maybeSingle(),
    ]);
    const investor = manualInvestor || profileInvestor;

    if (!investor) {
      return NextResponse.json(
        { success: false, message: 'Investor not found' },
        { status: 404 }
      );
    }

    // Calculate monthly interest (will also be calculated by trigger)
    const monthlyInterest = (allocation_amount * annual_rate / 100) / 12;

    // Insert allocation - convert empty strings to null for dates
    const { data: allocation, error: insertError } = await supabase
      .from('allocations')
      .insert([
        {
          company_id,
          investor_id,
          deal_id,
          allocation_amount,
          allocation_percentage: allocation_percentage || 0,
          commit_date: commit_date || null,
          expected_funding_date: expected_funding_date || null,
          annual_rate,
          term_length,
          payment_frequency,
          payment_start_date: payment_start_date || null,
          funding_status: funding_status || 'Pending',
          notes,
          monthly_interest: monthlyInterest,
          status: 'pending',
          created_by: ctx.userId,
        },
      ])
      .select();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { success: false, message: 'Failed to create allocation', error: insertError.message },
        { status: 500 }
      );
    }

    if (!allocation || allocation.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No allocation returned' },
        { status: 500 }
      );
    }

    // Link the investor to the deal so it surfaces in every investor-facing
    // view (Deals, Performance, Broadcast, investor dashboard) — all of which
    // resolve "my deals" through deal_investors, not allocations. Without this
    // the allocation exists but the deal is invisible to the investor.
    // investor_source mirrors which table the investor was resolved from above.
    const investorSource = manualInvestor ? 'investors' : 'user_profiles';
    const { error: linkError } = await supabase
      .from('deal_investors')
      .upsert(
        {
          deal_id,
          investor_id,
          investor_source: investorSource,
          company_id,
        },
        { onConflict: 'deal_id,investor_id,investor_source' }
      );

    if (linkError) {
      // Non-fatal: the allocation was created; log so the link gap is traceable.
      console.error('Error linking investor to deal (deal_investors):', linkError);
    }

    await recalcDealRaisedAmount(deal_id, company_id);

    // Log activity (investor name resolved above, scoped to this company)
    await logActivity({
      companyId: company_id,
      activityType: 'allocation_created',
      title: `New allocation of $${(allocation_amount / 1000000).toFixed(2)}M`,
      description: `${investor?.full_name} allocated to ${deal.name}`,
      investorId: investor_id,
      investorName: investor?.full_name,
      dealId: deal_id,
      dealName: deal.name,
      allocationId: allocation[0].id,
      metadata: { amount: allocation_amount },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Allocation created successfully',
        allocation: allocation[0],
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status }
      );
    }
    console.error('Error in POST /api/allocations/create:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}
