import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/broadcasts/deals/[dealId]/investors
 * Returns all investors in a deal with their contact info
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

    // Get all investors for this deal
    const { data: dealInvestors, error: investorsError } = await supabase
      .from('deal_investors')
      .select('investor_id, investor_source')
      .eq('deal_id', dealId);

    if (investorsError) {
      console.error('Error fetching deal investors:', investorsError);
      return NextResponse.json(
        { error: 'Failed to fetch investors' },
        { status: 500 }
      );
    }

    console.log(`[INVESTORS_API] Deal ${dealId} has ${dealInvestors?.length || 0} investors`);

    // Fetch investor details (emails, names)
    let investors: Array<{
      id: string;
      email: string;
      name: string;
      investor_id: string;
      investor_source: string;
    }> = [];

    if (dealInvestors && dealInvestors.length > 0) {
      const userProfileIds = dealInvestors
        .filter((di) => di.investor_source === 'user_profiles')
        .map((di) => di.investor_id);

      const investorIds = dealInvestors
        .filter((di) => di.investor_source === 'investors')
        .map((di) => di.investor_id);

      if (userProfileIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, email, full_name')
          .in('id', userProfileIds);

        if (profiles) {
          investors.push(
            ...profiles.map((p) => ({
              id: p.id,
              email: p.email,
              name: p.full_name || 'Unknown',
              investor_id: p.id,
              investor_source: 'user_profiles',
            }))
          );
        }
      }

      if (investorIds.length > 0) {
        const { data: investorRecords } = await supabase
          .from('investors')
          .select('id, email, full_name')
          .in('id', investorIds);

        if (investorRecords) {
          investors.push(
            ...investorRecords.map((i) => ({
              id: i.id,
              email: i.email,
              name: i.full_name || 'Unknown',
              investor_id: i.id,
              investor_source: 'investors',
            }))
          );
        }
      }
    }

    console.log(`[INVESTORS_API] Returning ${investors.length} investor records`);

    return NextResponse.json(
      {
        dealId,
        investors,
        count: investors.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in get investors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
