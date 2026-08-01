import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole, AuthError, getServiceClient } from '@/services/access';
import { createDeal, recalcDealRaisedAmount } from '@/services/deal-service';
import { logActivity } from '@/lib/activity-logger';

interface AttachInvestor {
  id: string;
  source?: 'investors' | 'user_profiles';
  amount?: string | number;
}

/**
 * POST /api/deals
 * Create a deal (server-side, tenant-scoped). Optionally attaches investors:
 * every attached investor gets a deal_investors link (tenant-scoped) AND, when an
 * amount is provided, a Funded+confirmed allocation inheriting the deal's terms —
 * so the allocation immediately appears on Allocations, Payments and Performance.
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requireRole(ctx, ['admin', 'partner']);

    const supabase = getServiceClient();
    const body = await req.json().catch(() => ({}));
    const dealPayload = (body.deal ?? {}) as Record<string, unknown>;
    const investors = (Array.isArray(body.investors) ? body.investors : []) as AttachInvestor[];

    // Create the deal (company_id + created_by forced from session inside the service)
    const deal = await createDeal(ctx.companyId, ctx.userId, dealPayload);

    const today = new Date().toISOString().slice(0, 10);
    const annualRate = Number(deal.interest_rate) || 0;
    const termLength = deal.term_length_months != null ? Number(deal.term_length_months) : null;
    const paymentStart = deal.first_payout_date || null;
    const targetAmount = Number(deal.target_amount) || 0;

    let allocationsCreated = 0;

    for (const inv of investors) {
      if (!inv?.id) continue;
      const source: 'investors' | 'user_profiles' = inv.source === 'investors' ? 'investors' : 'user_profiles';

      // Link row — always tenant-scoped (the old client path omitted company_id)
      await supabase.from('deal_investors').insert([{
        deal_id: deal.id,
        investor_id: inv.id,
        investor_source: source,
        company_id: ctx.companyId,
      }]);

      const amount = typeof inv.amount === 'string' ? parseFloat(inv.amount) : Number(inv.amount);
      if (!amount || Number.isNaN(amount) || amount <= 0) continue;

      // Verify the investor belongs to this company before creating a financial record
      const [{ data: manual }, { data: profile }] = await Promise.all([
        supabase.from('investors').select('id').eq('id', inv.id).eq('company_id', ctx.companyId).maybeSingle(),
        supabase.from('user_profiles').select('user_id').eq('user_id', inv.id).eq('company_id', ctx.companyId).maybeSingle(),
      ]);
      if (!manual && !profile) continue; // not our tenant's investor — skip silently

      const monthlyInterest = (amount * annualRate / 100) / 12;
      const percentage = targetAmount > 0 ? (amount / targetAmount) * 100 : 0;

      const { error: allocError } = await supabase.from('allocations').insert([{
        company_id: ctx.companyId,
        investor_id: inv.id,
        deal_id: deal.id,
        allocation_amount: amount,
        allocation_percentage: percentage,
        commit_date: today,
        expected_funding_date: today,
        annual_rate: annualRate,
        term_length: termLength,
        payment_frequency: 'Monthly',
        payment_start_date: paymentStart,
        funding_status: 'Funded',
        status: 'confirmed',
        monthly_interest: monthlyInterest,
        created_by: ctx.userId,
      }]);
      if (!allocError) allocationsCreated += 1;
    }

    // Recompute raised_amount from the allocations we just created
    await recalcDealRaisedAmount(deal.id, ctx.companyId);

    await logActivity({
      companyId: ctx.companyId,
      activityType: 'deal_created',
      title: `New deal: ${deal.name}`,
      description: allocationsCreated > 0
        ? `Created with ${allocationsCreated} investor allocation${allocationsCreated === 1 ? '' : 's'}`
        : 'A new deal has been created',
      dealId: deal.id,
      dealName: deal.name,
      metadata: { allocationsCreated },
    });

    return NextResponse.json({ success: true, deal, allocationsCreated }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in POST /api/deals:', error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
