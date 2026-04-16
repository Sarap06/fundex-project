import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/investor/broadcasts
 * Returns all broadcast-enabled deals the authenticated investor is linked to,
 * with the latest sent update and their acknowledgment status per update.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company found' }, { status: 403 });
    }

    const companyId = profile.company_id;
    const userId = user.id;

    // Find all deals this investor is linked to
    const { data: dealInvestors } = await supabase
      .from('deal_investors')
      .select('deal_id')
      .eq('investor_id', userId)
      .eq('investor_source', 'user_profiles');

    if (!dealInvestors || dealInvestors.length === 0) {
      return NextResponse.json({ deals: [] });
    }

    const dealIds = dealInvestors.map((di: any) => di.deal_id);

    // Get broadcast-enabled deals
    const { data: deals } = await supabase
      .from('deals')
      .select(`
        id, name, target_amount, interest_rate, term_length_months,
        close_date, first_payout_date, collateral_address, estimated_property_value,
        funding_close_date, status, created_at, location_state, location_city,
        borrower_name, type
      `)
      .in('id', dealIds)
      .eq('company_id', companyId)
      .eq('enable_broadcast_channel', true);

    if (!deals || deals.length === 0) {
      return NextResponse.json({ deals: [] });
    }

    // Enrich each deal with broadcast update info and ack status
    const enrichedDeals = await Promise.all(
      deals.map(async (deal: any) => {
        const { data: updates } = await supabase
          .from('broadcast_updates')
          .select('id, title, message, update_type, sent_at, require_acknowledgment')
          .eq('deal_id', deal.id)
          .eq('is_sent', true)
          .order('sent_at', { ascending: false });

        if (!updates || updates.length === 0) return null;

        const latestUpdate = updates[0];

        // Get this investor's recipient records
        const updateIds = updates.map((u: any) => u.id);
        const { data: recipients } = await supabase
          .from('broadcast_update_recipients')
          .select('broadcast_update_id, acknowledged_at, delivery_status')
          .in('broadcast_update_id', updateIds)
          .eq('investor_id', userId)
          .eq('investor_source', 'user_profiles');

        const recipientMap = new Map(
          (recipients || []).map((r: any) => [r.broadcast_update_id, r])
        );

        const newCount = updates.filter((u: any) => !recipientMap.get(u.id)?.acknowledged_at).length;
        const latestRecipient = recipientMap.get(latestUpdate.id);
        const actionRequired = !!latestUpdate.require_acknowledgment && !latestRecipient?.acknowledged_at;

        return {
          id: deal.id,
          name: deal.name,
          status: deal.status,
          targetAmount: deal.target_amount,
          interestRate: deal.interest_rate,
          termMonths: deal.term_length_months,
          closeDate: deal.close_date,
          firstPayoutDate: deal.first_payout_date,
          collateralAddress: deal.collateral_address || '',
          estimatedPropertyValue: deal.estimated_property_value,
          fundingCloseDate: deal.funding_close_date,
          locationCity: deal.location_city,
          locationState: deal.location_state,
          latestUpdate: {
            id: latestUpdate.id,
            title: latestUpdate.title,
            message: latestUpdate.message,
            updateType: latestUpdate.update_type,
            sentAt: latestUpdate.sent_at,
            requireAcknowledgment: latestUpdate.require_acknowledgment,
            acknowledged: !!latestRecipient?.acknowledged_at,
          },
          newCount,
          actionRequired,
          totalUpdates: updates.length,
        };
      })
    );

    return NextResponse.json({ deals: enrichedDeals.filter(Boolean) });
  } catch (error) {
    console.error('[INVESTOR_BROADCASTS] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
