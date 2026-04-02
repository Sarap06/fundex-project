import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/broadcasts/deals/[dealId]/timeline
 * Returns the communication timeline for a deal
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

    // Verify deal exists
    const { data: deal, error: dealError } = await queryClient
      .from('deals')
      .select('id')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    // Get communication timeline events
    const { data: timeline, error: timelineError } = await queryClient
      .from('broadcast_communication_timeline')
      .select(
        `
        id,
        event_type,
        title,
        description,
        triggered_by_user_id,
        created_at,
        broadcast_update_id
      `
      )
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false });

    if (timelineError) {
      console.error('Error fetching timeline:', timelineError);
      console.error('Query details - dealId:', dealId, 'error:', timelineError);
      return NextResponse.json(
        { error: 'Failed to fetch timeline', details: timelineError },
        { status: 500 }
      );
    }

    console.log(`Found ${timeline?.length || 0} timeline events for deal ${dealId}`);

    // Enrich timeline with user info
    const userIds = [...new Set(timeline?.map((t) => t.triggered_by_user_id).filter(Boolean) || [])];
    let userMap = new Map();

    if (userIds.length > 0) {
      const { data: users } = await queryClient
        .from('user_profiles')
        .select('user_id, full_name')
        .in('user_id', userIds as string[]);

      if (users) {
        userMap = new Map(users.map((u) => [u.user_id, u.full_name]));
      }
    }

    const enrichedTimeline = (timeline || []).map((event) => ({
      ...event,
      triggered_by_name: userMap.get(event.triggered_by_user_id) || 'System',
    }));

    return NextResponse.json(
      {
        timeline: enrichedTimeline,
        count: enrichedTimeline.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in get timeline:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
