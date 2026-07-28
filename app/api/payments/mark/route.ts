import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole, AuthError } from '@/services/access';
import { markPayout, revertPayout, PaymentsError } from '@/services/payments-service';
import { markPayoutSchema, revertPayoutSchema } from '@/schemas';
import { logActivity } from '@/lib/activity-logger';

/**
 * POST /api/payments/mark
 * Mark an investor's payout for a payroll date as Completed or Missed.
 * Admin-only. company_id and expected_amount are derived server-side.
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requireRole(ctx, ['admin']);

    const body = await req.json();
    const parsed = markPayoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request', errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const payout = await markPayout(ctx.companyId, ctx.userId, parsed.data);

    await logActivity({
      companyId: ctx.companyId,
      activityType: 'payout_marked',
      title: `Payout ${parsed.data.status} — ${payout.investorName}`,
      description: `${payout.investorName}'s payout for ${parsed.data.due_date} marked ${parsed.data.status}`,
      investorName: payout.investorName,
      userId: ctx.userId,
      metadata: {
        due_date: parsed.data.due_date,
        status: parsed.data.status,
        expected_amount: payout.expectedTotal,
        actual_amount: payout.actualAmount,
      },
    });

    return NextResponse.json({ success: true, payout });
  } catch (error) {
    if (error instanceof AuthError || error instanceof PaymentsError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    console.error('Error in POST /api/payments/mark:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/payments/mark
 * Revert a marked payout back to Pending (delete the persisted row). Admin-only.
 */
export async function DELETE(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requireRole(ctx, ['admin']);

    const body = await req.json();
    const parsed = revertPayoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid request', errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await revertPayout(ctx.companyId, parsed.data);

    await logActivity({
      companyId: ctx.companyId,
      activityType: 'payout_reverted',
      title: 'Payout reverted to pending',
      description: `Payout for ${parsed.data.due_date} reverted to pending`,
      userId: ctx.userId,
      metadata: { due_date: parsed.data.due_date, investor_id: parsed.data.investor_id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError || error instanceof PaymentsError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    console.error('Error in DELETE /api/payments/mark:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
