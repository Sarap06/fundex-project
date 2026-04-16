import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/broadcasts/deals
 * Returns all deals with broadcast_channel or inbox_channel enabled
 */
export async function GET(request: NextRequest) {
  try {
    const companyId = request.nextUrl.searchParams.get('companyId');
    const status = request.nextUrl.searchParams.get('status');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

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
      .eq('company_id', companyId)
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

    // Calculate actual investor count for each deal
    const dealsWithInvestorCount = await Promise.all(
      (deals || []).map(async (deal) => {
        const { count: investorCount, error: countError } = await supabase
          .from('deal_investors')
          .select('*', { count: 'exact', head: true })
          .eq('deal_id', deal.id);

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
  } catch (error) {
    console.error('Error in get deals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
