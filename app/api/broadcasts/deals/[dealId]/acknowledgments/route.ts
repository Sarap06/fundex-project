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
          .select('user_id, full_name')
          .in('user_id', userProfileIds);

        if (profiles) {
          profiles.forEach((p) => {
            investorMap.set(`${p.user_id}:user_profiles`, p.full_name);
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

/**
 * POST /api/broadcasts/deals/[dealId]/acknowledgments
 * Investor marks their own update as acknowledged.
 * Body: { updateId: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const { dealId } = await params;
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { updateId } = await request.json();
    if (!updateId) {
      return NextResponse.json({ error: 'updateId is required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the token and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the update belongs to this deal
    const { data: update, error: updateError } = await supabase
      .from('broadcast_updates')
      .select('id, require_acknowledgment')
      .eq('id', updateId)
      .eq('deal_id', dealId)
      .eq('is_sent', true)
      .single();

    if (updateError || !update) {
      return NextResponse.json({ error: 'Update not found' }, { status: 404 });
    }

    // A logged-in investor authenticates as their user_profiles user, but the
    // recipient row may have been created under the manual `investors` source
    // (same human, different id). Resolve both identities by email so either
    // source can be acknowledged — otherwise investors-source rows are stuck
    // permanently "action required".
    const recipientIds = new Set<string>([user.id]);
    if (user.email) {
      const { data: manualMatches } = await supabase
        .from('investors')
        .select('id')
        .ilike('email', user.email);
      for (const m of manualMatches ?? []) recipientIds.add(m.id);
    }

    // Update the recipient record(s) for this investor across both sources.
    const { data: acked, error: updateRecipientError } = await supabase
      .from('broadcast_update_recipients')
      .update({
        acknowledged_at: new Date().toISOString(),
        delivery_status: 'acknowledged',
        updated_at: new Date().toISOString(),
      })
      .eq('broadcast_update_id', updateId)
      .in('investor_id', Array.from(recipientIds))
      .select('id');

    if (updateRecipientError) {
      console.error('[ACK_API] Error updating recipient:', updateRecipientError);
      return NextResponse.json({ error: 'Failed to acknowledge' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ACK_API] Error in post acknowledgment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
