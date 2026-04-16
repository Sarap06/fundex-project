import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/services/access';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/inbox
 * For admins/partners: returns all investor conversation threads for their company,
 *   with the latest message and unread count per thread.
 * For investors: returns their own thread (latest messages).
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    if (ctx.role === 'investor') {
      // Return the investor's own thread messages (most recent first, capped at 50)
      const { data: messages, error } = await supabase
        .from('investor_inbox_messages')
        .select('id, sender_id, sender_role, sender_name, content, is_read, created_at')
        .eq('company_id', ctx.companyId)
        .eq('investor_id', ctx.userId)
        .eq('investor_source', 'user_profiles')
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        console.error('[INBOX] Error fetching investor messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
      }

      return NextResponse.json({ messages: messages ?? [] });
    }

    // Admin/partner: return conversation threads (one per investor)
    const { data: threads, error } = await supabase
      .from('investor_inbox_messages')
      .select('investor_id, investor_source, content, sender_role, created_at, is_read')
      .eq('company_id', ctx.companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[INBOX] Error fetching threads:', error);
      return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 });
    }

    // Group by investor — latest message + unread count
    const threadMap = new Map<string, { investorId: string; investorSource: string; latestMessage: any; unreadCount: number }>();
    for (const msg of threads ?? []) {
      const key = `${msg.investor_id}:${msg.investor_source}`;
      if (!threadMap.has(key)) {
        threadMap.set(key, {
          investorId: msg.investor_id,
          investorSource: msg.investor_source,
          latestMessage: msg,
          unreadCount: 0,
        });
      }
      // Count unread admin messages (messages from investors that admin hasn't read)
      if (!msg.is_read && msg.sender_role === 'investor') {
        threadMap.get(key)!.unreadCount++;
      }
    }

    // Fetch ALL investors for this company (both signed-up and manually added)
    const [{ data: profileInvestors }, { data: manualInvestors }] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('user_id, full_name, email')
        .eq('company_id', ctx.companyId)
        .eq('role', 'investor'),
      supabase
        .from('investors')
        .select('id, full_name, email')
        .eq('company_id', ctx.companyId),
    ]);

    // Build name map from both sources
    const nameMap = new Map<string, string>();
    (profileInvestors ?? []).forEach((p: any) => nameMap.set(`${p.user_id}:user_profiles`, p.full_name));
    (manualInvestors ?? []).forEach((i: any) => nameMap.set(`${i.id}:investors`, i.full_name));

    // Merge: start with all known investors (no messages yet = empty thread)
    const seenKeys = new Set<string>();
    const allInvestorEntries: Array<{ investorId: string; investorSource: string; latestMessage: any; unreadCount: number; latestTime: string | null }> = [];

    // First add threads that have messages
    for (const t of threadMap.values()) {
      const key = `${t.investorId}:${t.investorSource}`;
      seenKeys.add(key);
      allInvestorEntries.push({
        investorId: t.investorId,
        investorSource: t.investorSource,
        latestMessage: t.latestMessage,
        unreadCount: t.unreadCount,
        latestTime: t.latestMessage?.created_at ?? null,
      });
    }

    // Then add investors with no messages yet
    for (const p of (profileInvestors ?? [])) {
      const key = `${p.user_id}:user_profiles`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        allInvestorEntries.push({
          investorId: p.user_id,
          investorSource: 'user_profiles',
          latestMessage: null,
          unreadCount: 0,
          latestTime: null,
        });
      }
    }
    for (const i of (manualInvestors ?? [])) {
      const key = `${i.id}:investors`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        allInvestorEntries.push({
          investorId: i.id,
          investorSource: 'investors',
          latestMessage: null,
          unreadCount: 0,
          latestTime: null,
        });
      }
    }

    // Sort: threads with messages first (by recency), then messageless investors
    allInvestorEntries.sort((a, b) => {
      if (a.latestTime && b.latestTime) return b.latestTime.localeCompare(a.latestTime);
      if (a.latestTime) return -1;
      if (b.latestTime) return 1;
      return 0;
    });

    const result = allInvestorEntries.map(t => ({
      investorId: t.investorId,
      investorSource: t.investorSource,
      investorName: nameMap.get(`${t.investorId}:${t.investorSource}`) ?? 'Investor',
      latestMessage: t.latestMessage,
      unreadCount: t.unreadCount,
    }));

    return NextResponse.json({ threads: result });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[INBOX] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
