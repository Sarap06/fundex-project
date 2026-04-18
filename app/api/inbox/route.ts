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
    // Gracefully handle missing table (migration not yet run) by treating as empty
    const { data: threads, error } = await supabase
      .from('investor_inbox_messages')
      .select('investor_id, investor_source, content, sender_role, created_at, is_read')
      .eq('company_id', ctx.companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[INBOX] Error fetching threads (table may not exist yet):', error);
      // Don't bail — fall through with empty threads so investors still appear
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

    // Fetch deals for each investor to show deal context in thread list
    const allInvestorIds = allInvestorEntries.map(t => t.investorId);
    const dealMap = new Map<string, Array<{ id: string; name: string }>>();
    if (allInvestorIds.length > 0) {
      const { data: diRows } = await supabase
        .from('deal_investors')
        .select('investor_id, deal_id')
        .in('investor_id', allInvestorIds)
        .eq('company_id', ctx.companyId);

      if (diRows && diRows.length > 0) {
        const dealIds = [...new Set(diRows.map((r: any) => r.deal_id))];
        const { data: dealRows } = await supabase
          .from('deals')
          .select('id, name')
          .in('id', dealIds);

        const dealInfoMap = new Map((dealRows ?? []).map((d: any) => [d.id, d.name]));
        for (const row of diRows) {
          const name = dealInfoMap.get(row.deal_id);
          if (!name) continue;
          if (!dealMap.has(row.investor_id)) dealMap.set(row.investor_id, []);
          dealMap.get(row.investor_id)!.push({ id: row.deal_id, name });
        }
      }
    }

    const result = allInvestorEntries.map(t => ({
      investorId: t.investorId,
      investorSource: t.investorSource,
      investorName: nameMap.get(`${t.investorId}:${t.investorSource}`) ?? 'Investor',
      latestMessage: t.latestMessage,
      unreadCount: t.unreadCount,
      deals: dealMap.get(t.investorId) ?? [],
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
