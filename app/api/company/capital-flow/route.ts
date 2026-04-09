import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError, getServiceClient } from '@/services/access';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const supabase = getServiceClient();

    const monthsParam = req.nextUrl.searchParams.get('months') || '6';
    const months = Math.min(parseInt(monthsParam, 10) || 6, 12);

    // Calculate start date
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const startISO = startDate.toISOString();

    // Fetch funded allocations grouped by month
    const { data: allocations, error } = await supabase
      .from('allocations')
      .select('allocation_amount, funding_status, commit_date, expected_funding_date, created_at')
      .eq('company_id', auth.companyId)
      .gte('created_at', startISO)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Aggregate by month
    const monthMap = new Map<string, { inflows: number; outflows: number }>();

    // Pre-fill all months so chart has continuous data
    for (let i = 0; i < months; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (months - 1 - i));
      const key = `${d.toLocaleString('en-US', { month: 'short' })} ${d.getFullYear()}`;
      monthMap.set(key, { inflows: 0, outflows: 0 });
    }

    for (const alloc of allocations || []) {
      const dateStr = alloc.commit_date || alloc.expected_funding_date || alloc.created_at;
      if (!dateStr) continue;

      const date = new Date(dateStr);
      const key = `${date.toLocaleString('en-US', { month: 'short' })} ${date.getFullYear()}`;

      if (!monthMap.has(key)) continue;

      const entry = monthMap.get(key)!;
      const amount = Number(alloc.allocation_amount) || 0;

      if (alloc.funding_status === 'Funded') {
        entry.inflows += amount;
      } else {
        entry.outflows += amount;
      }
    }

    const data = Array.from(monthMap.entries()).map(([month, values]) => ({
      month,
      inflows: values.inflows,
      outflows: values.outflows,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Capital flow error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
