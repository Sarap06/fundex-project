import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole, AuthError, getServiceClient } from '@/services/access';
import { recalcDealRaisedAmount } from '@/services/deal-service';
import { logActivity } from '@/lib/activity-logger';

const EDITABLE_ALLOCATION_FIELDS = [
  'allocation_amount',
  'allocation_percentage',
  'funding_status',
  'commit_date',
  'expected_funding_date',
  'monthly_interest',
  'annual_rate',
  'term_length',
  'notes',
] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth(req);
    requireRole(ctx, ['admin', 'partner']);

    const { id } = await params;
    const supabase = getServiceClient();

    // Verify the allocation belongs to this tenant before mutating (IDOR guard)
    const { data: existing, error: fetchError } = await supabase
      .from('allocations')
      .select('id, deal_id, investor_id, allocation_amount')
      .eq('id', id)
      .eq('company_id', ctx.companyId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, message: 'Allocation not found' },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const patch: Record<string, unknown> = {};
    for (const key of EDITABLE_ALLOCATION_FIELDS) {
      if (body[key] !== undefined) patch[key] = body[key];
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No editable fields provided' },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('allocations')
      .update(patch)
      .eq('id', id)
      .eq('company_id', ctx.companyId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating allocation:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update allocation', error: updateError.message },
        { status: 500 }
      );
    }

    // If the amount or funding status changed, the deal's raised total may change
    if (existing.deal_id && (patch.allocation_amount !== undefined || patch.funding_status !== undefined)) {
      await recalcDealRaisedAmount(existing.deal_id, ctx.companyId);
    }

    const { data: investor } = await supabase
      .from('investors')
      .select('full_name')
      .eq('id', existing.investor_id)
      .eq('company_id', ctx.companyId)
      .single();

    await logActivity({
      companyId: ctx.companyId,
      activityType: 'allocation_updated',
      title: `Allocation updated`,
      description: investor?.full_name
        ? `Updated allocation for ${investor.full_name}`
        : 'Allocation updated',
      investorId: existing.investor_id,
      investorName: investor?.full_name,
      dealId: existing.deal_id,
      allocationId: existing.id,
      metadata: { fields: Object.keys(patch) },
    });

    return NextResponse.json({ success: true, allocation: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status }
      );
    }
    console.error('Error in PATCH /api/allocations/[id]:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth(req);
    requireRole(ctx, ['admin', 'partner']);

    const { id } = await params;
    const supabase = getServiceClient();

    const { data: allocation, error: fetchError } = await supabase
      .from('allocations')
      .select('id, deal_id, investor_id, allocation_amount')
      .eq('id', id)
      .eq('company_id', ctx.companyId)
      .single();

    if (fetchError || !allocation) {
      return NextResponse.json(
        { success: false, message: 'Allocation not found' },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabase
      .from('allocations')
      .delete()
      .eq('id', id)
      .eq('company_id', ctx.companyId);

    if (deleteError) {
      console.error('Error deleting allocation:', deleteError);
      return NextResponse.json(
        { success: false, message: 'Failed to delete allocation', error: deleteError.message },
        { status: 500 }
      );
    }

    if (allocation.deal_id) {
      await recalcDealRaisedAmount(allocation.deal_id, ctx.companyId);
    }

    const { data: investor } = await supabase
      .from('investors')
      .select('full_name')
      .eq('id', allocation.investor_id)
      .eq('company_id', ctx.companyId)
      .single();

    await logActivity({
      companyId: ctx.companyId,
      activityType: 'allocation_deleted',
      title: `Allocation of $${(Number(allocation.allocation_amount) || 0).toLocaleString('en-US')} deleted`,
      description: investor?.full_name
        ? `Removed allocation for ${investor.full_name}`
        : 'Allocation removed',
      investorId: allocation.investor_id,
      investorName: investor?.full_name,
      dealId: allocation.deal_id,
      allocationId: allocation.id,
      metadata: { amount: Number(allocation.allocation_amount) || 0 },
    });

    return NextResponse.json({ success: true, message: 'Allocation deleted' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status }
      );
    }
    console.error('Error in DELETE /api/allocations/[id]:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
