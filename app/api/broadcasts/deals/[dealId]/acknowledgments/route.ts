import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/broadcasts/deals/[dealId]/acknowledgments
 * Returns acknowledgment status for all investors in the latest update
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const { dealId } = await params;
    const updateId = request.nextUrl.searchParams.get('updateId');

    // Create authenticated Supabase client
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    if (!dealId) {
      return NextResponse.json(
        { error: 'Deal ID is required' },
        { status: 400 }
      );
    }

    let update = null;

    // If updateId is provided, use it; otherwise get the latest update
    if (updateId) {
      const { data, error } = await supabase
        .from('broadcast_updates')
        .select('id')
        .eq('id', updateId)
        .eq('deal_id', dealId)
        .single();

      if (error || !data) {
        console.log('[ACK_API] Update not found:', { updateId, dealId, error });
        return NextResponse.json(
          {
            recipients: [],
            stats: {
              total: 0,
              acknowledged: 0,
              opened: 0,
              pending: 0,
            },
          },
          { status: 200 }
        );
      }

      update = data;
    } else {
      const { data, error } = await supabase
        .from('broadcast_updates')
        .select('id, require_acknowledgment')
        .eq('deal_id', dealId)
        .eq('is_sent', true)
        .order('sent_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        console.log('[ACK_API] No sent updates found for deal:', dealId);
        return NextResponse.json(
          {
            recipients: [],
            stats: {
              total: 0,
              acknowledged: 0,
              opened: 0,
              pending: 0,
            },
          },
          { status: 200 }
        );
      }

      update = data;
    }

    console.log('[ACK_API] Fetching recipients for update:', update.id);

    // Get recipient status
    const { data: recipients, error: recipientsError } = await supabase
      .from('broadcast_update_recipients')
      .select(
        `
        id,
        investor_id,
        investor_source,
        email,
        delivery_status,
        sent_at,
        opened_at,
        acknowledged_at,
        acknowledgment_notes
      `
      )
      .eq('broadcast_update_id', update.id)
      .order('created_at', { ascending: false });

    if (recipientsError) {
      console.error('[ACK_API] Error fetching recipients:', recipientsError);
      return NextResponse.json(
        { error: 'Failed to fetch acknowledgment status' },
        { status: 500 }
      );
    }

    console.log('[ACK_API] Found recipients:', recipients?.length || 0);

    // Get investor names
    let investorMap = new Map();

    if (recipients && recipients.length > 0) {
      const userProfileIds = recipients
        .filter((r) => r.investor_source === 'user_profiles')
        .map((r) => r.investor_id);

      const investorIds = recipients
        .filter((r) => r.investor_source === 'investors')
        .map((r) => r.investor_id);

      if (userProfileIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, full_name')
          .in('id', userProfileIds);

        if (profiles) {
          profiles.forEach((p) => {
            investorMap.set(`${p.id}:user_profiles`, p.full_name);
          });
        }
      }

      if (investorIds.length > 0) {
        const { data: investors } = await supabase
          .from('investors')
          .select('id, full_name')
          .in('id', investorIds);

        if (investors) {
          investors.forEach((i) => {
            investorMap.set(`${i.id}:investors`, i.full_name);
          });
        }
      }
    }

    const enrichedRecipients = (recipients || []).map((r) => ({
      ...r,
      investor_name: investorMap.get(`${r.investor_id}:${r.investor_source}`) || 'Unknown',
    }));

    const stats = {
      total: enrichedRecipients.length,
      acknowledged: enrichedRecipients.filter((r) => r.delivery_status === 'acknowledged').length,
      opened: enrichedRecipients.filter((r) => r.delivery_status === 'opened').length,
      pending: enrichedRecipients.filter((r) => r.delivery_status === 'pending').length,
    };

    return NextResponse.json(
      {
        updateId: update.id,
        requireAcknowledgment: update.require_acknowledgment,
        recipients: enrichedRecipients,
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ACK_API] Error in get acknowledgments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
