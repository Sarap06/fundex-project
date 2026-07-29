import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole, AuthError } from '@/services/access';
import { updateDeal, closeDeal, getDealByCompany } from '@/services/deal-service';
import { logActivity } from '@/lib/activity-logger';

/**
 * PATCH /api/deals/[id]
 * Update a deal (edit fields) or close it (?action=close or { action: 'close' }).
 * Admin/partner only. Always scoped to the caller's company from the session.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth(request);
    requireRole(ctx, ['admin', 'partner']);

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const companyId = ctx.companyId;

    // Deal must belong to the caller's company.
    const existing = await getDealByCompany(id, companyId).catch(() => null);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Deal not found' }, { status: 404 });
    }

    const isClose = body.action === 'close' || body.status === 'Closed';
    const updated = isClose
      ? await closeDeal(id, companyId)
      : await updateDeal(id, companyId, body);

    await logActivity({
      companyId,
      activityType: isClose ? 'deal_closed' : 'deal_updated',
      title: isClose ? `Deal closed — ${existing.name}` : `Deal updated — ${existing.name}`,
      description: isClose
        ? `${existing.name} was closed to new allocations`
        : `${existing.name} details were updated`,
      dealId: id,
      dealName: existing.name,
      userId: ctx.userId,
    });

    return NextResponse.json({ success: true, deal: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    console.error('Error in PATCH /api/deals/[id]:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
