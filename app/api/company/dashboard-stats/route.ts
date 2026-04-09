import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/services/access';
import { getAllocationSummary } from '@/services/allocation-service';
import { getDealSummary } from '@/services/deal-service';
import { getInvestorSummary } from '@/services/investor-service';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);

    const [allocSummary, dealSummary, investorSummary] = await Promise.all([
      getAllocationSummary(auth.companyId),
      getDealSummary(auth.companyId),
      getInvestorSummary(auth.companyId),
    ]);

    return NextResponse.json({
      totalAUM: allocSummary.totalAllocated,
      allocatedCapital: allocSummary.totalAllocated,
      monthlyInterest: allocSummary.totalMonthlyInterest,
      fundedAllocations: allocSummary.funded,
      pendingAllocations: allocSummary.pending,
      activeDeals: dealSummary.active,
      totalDeals: dealSummary.total,
      totalTarget: dealSummary.totalTarget,
      totalRaised: dealSummary.totalRaised,
      activeInvestors: investorSummary.active,
      totalInvestors: investorSummary.total,
      totalInvested: investorSummary.totalInvested,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
