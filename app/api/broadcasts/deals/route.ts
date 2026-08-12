import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/services/access';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/broadcasts/deals
 * Returns all broadcast-enabled deals for the authenticated user's company.
 *
 * NOTE: this route previously used the anon Supabase client with no session,
 * so RLS silently returned zero deals — the admin "Deal Channels" tab was always
 * empty. It also trusted `companyId` from the query string (IDOR). Both are fixed
 * here: the company is derived from the session and reads use the service role.
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const status = request.nextUrl.searchParams.get('status');

    let query = supabase
      .from('deals')
      .select(
        `
        id,
        deal_id,
        name,
        type,
        status,
        location,
        location_state,
        location_city,
        target_amount,
        raised_amount,
        progress,
        term,
        interest_rate,
        close_date,
        next_milestone,
        milestone_type,
        borrower_name,
        borrower_contact,
        property_address,
        property_type,
        loan_purpose,
        documents_status,
        notes,
        tags,
        created_by,
        enable_broadcast_channel,
        enable_investor_inbox,
        created_at,
        updated_at
      `,
        { count: 'exact' }
      )
      .eq('enable_broadcast_channel', true)
      .eq('company_id', ctx.companyId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: deals, error, count } = await query;

    if (error) {
      console.error('Error fetching deals:', error);
      return NextResponse.json(
        { error: 'Failed to fetch deals' },
        { status: 500 }
      );
    }

    // Calculate actual investor count for each deal (tenant-scoped).
    const dealsWithInvestorCount = await Promise.all(
      (deals || []).map(async (deal) => {
        const { count: investorCount, error: countError } = await supabase
          .from('deal_investors')
          .select('*', { count: 'exact', head: true })
          .eq('deal_id', deal.id)
          .eq('company_id', ctx.companyId);

        if (countError) {
          console.error(`Error counting investors for deal ${deal.id}:`, countError);
        }

        return {
          ...deal,
          investor_count: investorCount || 0,
        };
      })
    );

    return NextResponse.json(
      {
        deals: dealsWithInvestorCount,
        count: count || 0,
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error in get deals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
