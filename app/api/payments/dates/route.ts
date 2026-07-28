import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole, AuthError } from '@/services/access';
import { listPayoutDates } from '@/services/payments-service';

/**
 * GET /api/payments/dates
 * All scheduled payroll dates across the company's deals (ISO, sorted, unique).
 * Drives the Payments dashboard's date navigation. Admin-only, company-scoped.
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requireRole(ctx, ['admin']);

    const dates = await listPayoutDates(ctx.companyId);

    return NextResponse.json({ success: true, dates });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    console.error('Error in GET /api/payments/dates:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
