import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/broadcasts/deals/[dealId]
 * Returns deal details with its broadcast updates and investor communication status
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

    // Get authenticated user from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Create authenticated Supabase client if token is provided
    const queryClient = token 
      ? createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                authorization: `Bearer ${token}`,
              },
            },
          }
        )
      : supabase;

    // Get deal details
    const { data: deal, error: dealError } = await queryClient
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      console.error('Error fetching deal:', dealError);
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    // Get broadcast updates for this deal
    const { data: updates, error: updatesError } = await queryClient
      .from('broadcast_updates')
      .select(
        `
        id,
        title,
        message,
        update_type,
        file_url,
        file_name,
        scheduled_date,
        scheduled_est_time,
        is_sent,
        sent_at,
        require_acknowledgment,
        created_at
      `
      )
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false });

    if (updatesError) {
      console.error('Error fetching updates:', updatesError);
    }

    // Get investor details for this deal
    const { data: dealInvestors, error: investorsError } = await queryClient
      .from('deal_investors')
      .select(
        `
        id,
        investor_id,
        investor_source
      `
      )
      .eq('deal_id', dealId);

    if (investorsError) {
      console.error('Error fetching investors:', investorsError);
    }

    // Get latest update recipients for acknowledgment status
    const latestUpdate = updates?.[0];
    let recipientStats = { total: 0, acknowledged: 0, opened: 0, pending: 0 };

    if (latestUpdate) {
      const { data: recipients, error: recipientsError } = await queryClient
        .from('broadcast_update_recipients')
        .select('delivery_status')
        .eq('broadcast_update_id', latestUpdate.id);

      if (!recipientsError && recipients) {
        recipientStats = {
          total: recipients.length,
          acknowledged: recipients.filter((r) => r.delivery_status === 'acknowledged').length,
          opened: recipients.filter((r) => r.delivery_status === 'opened').length,
          pending: recipients.filter((r) => r.delivery_status === 'pending').length,
        };
      }
    }

    return NextResponse.json(
      {
        deal,
        updates: updates || [],
        investorCount: dealInvestors?.length || 0,
        latestUpdateRecipientStats: recipientStats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in get deal details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
