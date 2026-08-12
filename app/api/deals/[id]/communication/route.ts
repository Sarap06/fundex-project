import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/services/access';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { sendEmailViaBrevo } from '@/lib/brevo';

/**
 * POST /api/deals/[id]/communication
 *
 * Runs the deal's Communication-step side effects after a deal is created:
 *   1. If `default_investor_audience = 'all'`, auto-link every investor in the
 *      company to the deal (deal_investors) so the whole company sees the channel.
 *   2. If `send_automated_message` is on, deliver `automated_investor_message`
 *      to every linked investor as an inbox message AND a Brevo email.
 *
 * Idempotent-ish: linking uses upsert; message send is intended to run once at
 * creation (the client only calls this for new deals). Company is derived from
 * the session — never trusted from the body.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;
    const ctx = await requireAuth(request);
    requireRole(ctx, ['admin', 'partner']);
    const supabase = getSupabaseAdmin();

    // Load the deal (tenant-scoped) with the communication flags.
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select(
        'id, name, company_id, default_investor_audience, send_automated_message, automated_investor_message'
      )
      .eq('id', dealId)
      .eq('company_id', ctx.companyId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const summary = { linked: 0, inboxMessages: 0, emailsSent: 0, emailsFailed: 0 };

    // ── 1. Auto-link audience ────────────────────────────────────────────
    if ((deal.default_investor_audience ?? '').toLowerCase() === 'all') {
      const [{ data: manualInvestors }, { data: profileInvestors }] = await Promise.all([
        supabase
          .from('investors')
          .select('id')
          .eq('company_id', ctx.companyId),
        supabase
          .from('user_profiles')
          .select('user_id')
          .eq('company_id', ctx.companyId)
          .eq('role', 'investor'),
      ]);

      const rows = [
        ...(manualInvestors ?? []).map((i: any) => ({
          deal_id: dealId,
          investor_id: i.id,
          investor_source: 'investors',
          company_id: ctx.companyId,
        })),
        ...(profileInvestors ?? []).map((p: any) => ({
          deal_id: dealId,
          investor_id: p.user_id,
          investor_source: 'user_profiles',
          company_id: ctx.companyId,
        })),
      ];

      if (rows.length > 0) {
        const { error: linkError } = await supabase
          .from('deal_investors')
          .upsert(rows, { onConflict: 'deal_id,investor_id,investor_source' });
        if (linkError) {
          console.error('[DEAL_COMMS] Auto-link error:', linkError);
        } else {
          summary.linked = rows.length;
        }
      }
    }

    // ── 2. Automated investor message ────────────────────────────────────
    if (deal.send_automated_message) {
      const messageBody =
        (deal.automated_investor_message ?? '').trim() ||
        `You've been added to a new deal: ${deal.name}. Log in to Fundex to view the details.`;

      // Everyone currently linked to the deal (tenant-scoped).
      const { data: links } = await supabase
        .from('deal_investors')
        .select('investor_id, investor_source')
        .eq('deal_id', dealId)
        .eq('company_id', ctx.companyId);

      const profileIds = (links ?? [])
        .filter((l: any) => l.investor_source === 'user_profiles')
        .map((l: any) => l.investor_id);
      const manualIds = (links ?? [])
        .filter((l: any) => l.investor_source === 'investors')
        .map((l: any) => l.investor_id);

      // Resolve name + email for each recipient by source.
      const emailMap = new Map<string, { name: string | null; email: string | null }>();
      if (profileIds.length > 0) {
        const { data: profs } = await supabase
          .from('user_profiles')
          .select('user_id, full_name, email')
          .in('user_id', profileIds);
        for (const p of profs ?? [])
          emailMap.set(`user_profiles:${p.user_id}`, { name: p.full_name, email: p.email });
      }
      if (manualIds.length > 0) {
        const { data: invs } = await supabase
          .from('investors')
          .select('id, full_name, email')
          .in('id', manualIds);
        for (const i of invs ?? [])
          emailMap.set(`investors:${i.id}`, { name: i.full_name, email: i.email });
      }

      // Inbox messages (bulk insert).
      const inboxRows = (links ?? []).map((l: any) => ({
        company_id: ctx.companyId,
        investor_id: l.investor_id,
        investor_source: l.investor_source,
        sender_id: ctx.userId,
        sender_role: ctx.role,
        sender_name: ctx.fullName ?? null,
        content: messageBody,
        is_read: false,
      }));
      if (inboxRows.length > 0) {
        const { error: inboxError } = await supabase
          .from('investor_inbox_messages')
          .insert(inboxRows);
        if (inboxError) console.error('[DEAL_COMMS] Inbox insert error:', inboxError);
        else summary.inboxMessages = inboxRows.length;
      }

      // Emails via Brevo (best-effort, per recipient).
      const subject = `New deal update: ${deal.name}`;
      const html = `<p>${messageBody.replace(/\n/g, '<br/>')}</p>`;
      for (const l of links ?? []) {
        const info = emailMap.get(`${l.investor_source}:${l.investor_id}`);
        if (!info?.email) continue;
        try {
          await sendEmailViaBrevo(info.email, subject, html);
          summary.emailsSent += 1;
        } catch (e) {
          summary.emailsFailed += 1;
          console.error('[DEAL_COMMS] Brevo send failed for', info.email, e);
        }
      }
    }

    return NextResponse.json({ success: true, ...summary });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[DEAL_COMMS] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
