import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole, AuthError } from '@/services/access';
import { listPayoutsForDate } from '@/services/payments-service';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/payments?date=YYYY-MM-DD
 * Expected payouts for a payroll date, grouped by investor, with saved status
 * overlaid. Admin-only, company-scoped from the session.
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requireRole(ctx, ['admin']);

    const date = req.nextUrl.searchParams.get('date');
    if (!date || !ISO_DATE.test(date)) {
      return NextResponse.json(
        { success: false, message: 'A valid ?date=YYYY-MM-DD is required' },
        { status: 400 }
      );
    }

    const payouts = await listPayoutsForDate(ctx.companyId, date);

    return NextResponse.json({ success: true, date, payouts });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    console.error('Error in GET /api/payments:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
