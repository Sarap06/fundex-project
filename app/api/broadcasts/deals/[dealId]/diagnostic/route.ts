import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/broadcasts/deals/[dealId]/diagnostic
 * Diagnostic endpoint to check what investors are linked to a deal
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const { dealId } = await params;

    if (!dealId) {
      return NextResponse.json(
        { error: 'Deal ID is required' },
        { status: 400 }
      );
    }

    // Get the deal
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('id, name')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    // Get all deal_investors records
    const { data: dealInvestors, error: investorsError } = await supabase
      .from('deal_investors')
      .select('*')
      .eq('deal_id', dealId);

    if (investorsError) {
      return NextResponse.json(
        { error: 'Failed to fetch deal investors', details: investorsError },
        { status: 500 }
      );
    }

    // Try to fetch the profiles/investors for each record
    const enrichedInvestors = [];

    if (dealInvestors && dealInvestors.length > 0) {
      for (const di of dealInvestors) {
        let investorData = null;

        if (di.investor_source === 'user_profiles') {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('id, email, full_name')
            .eq('id', di.investor_id)
            .single();
          investorData = profile;
        } else if (di.investor_source === 'investors') {
          const { data: investor } = await supabase
            .from('investors')
            .select('id, email, investor_name')
            .eq('id', di.investor_id)
            .single();
          investorData = investor;
        }

        enrichedInvestors.push({
          deal_investor_id: di.id,
          investor_id: di.investor_id,
          investor_source: di.investor_source,
          investor_data: investorData || null,
          found: investorData !== null,
        });
      }
    }

    return NextResponse.json(
      {
        deal: deal,
        deal_investors_count: dealInvestors?.length || 0,
        deal_investors_raw: dealInvestors || [],
        enriched_investors: enrichedInvestors,
        user_profiles_count: enrichedInvestors.filter(
          (e) => e.investor_source === 'user_profiles' && e.found
        ).length,
        investors_count: enrichedInvestors.filter(
          (e) => e.investor_source === 'investors' && e.found
        ).length,
        not_found_count: enrichedInvestors.filter((e) => !e.found).length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in diagnostic:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
