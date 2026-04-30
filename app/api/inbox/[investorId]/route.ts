import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/services/access';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/inbox/[investorId]
 * Fetch the full message thread for an investor.
 * Accessible by the investor themselves OR admin/partner of same company.
 * Marks unread messages as read for the caller.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ investorId: string }> }
) {
  try {
    const { investorId } = await params;
    const ctx = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    // Access check: investor can only read their own thread
    if (ctx.role === 'investor' && ctx.userId !== investorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Determine investor source from query param (defaults to 'user_profiles' for backwards compat)
    const url = new URL(request.url);
    const investorSource = url.searchParams.get('source') || 'user_profiles';

    const { data: messages, error } = await supabase
      .from('investor_inbox_messages')
      .select('id, sender_id, sender_role, sender_name, content, is_read, created_at')
      .eq('company_id', ctx.companyId)
      .eq('investor_id', investorId)
      .eq('investor_source', investorSource)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('[INBOX_THREAD] Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Mark unread messages as read (only those sent by the other side)
    const unreadIds = (messages ?? [])
      .filter((m: any) => !m.is_read && m.sender_role !== ctx.role)
      .map((m: any) => m.id);

    if (unreadIds.length > 0) {
      await supabase
        .from('investor_inbox_messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unreadIds);
    }

    return NextResponse.json({ messages: messages ?? [] });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[INBOX_THREAD] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/inbox/[investorId]
 * Send a message in the thread.
 * Body: { content: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ investorId: string }> }
) {
  try {
    const { investorId } = await params;
    const ctx = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    // Investor can only message in their own thread
    if (ctx.role === 'investor' && ctx.userId !== investorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { content, investorSource } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    // Use provided source, default to 'user_profiles' for backwards compat
    const source = investorSource || 'user_profiles';

    const { data: message, error } = await supabase
      .from('investor_inbox_messages')
      .insert({
        company_id: ctx.companyId,
        investor_id: investorId,
        investor_source: source,
        sender_id: ctx.userId,
        sender_role: ctx.role,
        sender_name: ctx.fullName ?? null,
        content: content.trim(),
        is_read: false,
      })
      .select('id, sender_id, sender_role, sender_name, content, is_read, created_at')
      .single();

    if (error) {
      console.error('[INBOX_THREAD] Error inserting message:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[INBOX_THREAD] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
