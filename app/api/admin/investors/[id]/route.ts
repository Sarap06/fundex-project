import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/services/access';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * PATCH /api/admin/investors/[id]
 * Update an investor's details.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await requireAuth(request);
    requireRole(ctx, ['admin', 'partner']);

    const supabase = getSupabaseAdmin();
    const body = await request.json();

    // Only allow specific fields to be updated
    const allowedFields = [
      'full_name', 'email', 'phone', 'status', 'sponsor_id',
      'initial_investment', 'total_invested', 'number_of_investments',
      'notes', 'tags',
    ];
    const updates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Ensure the investor belongs to this company
    const { data: investor, error: updateError } = await supabase
      .from('investors')
      .update(updates)
      .eq('id', id)
      .eq('company_id', ctx.companyId)
      .select(`id, investor_id, full_name, email, phone, status, sponsor_id, initial_investment, total_invested, average_return, number_of_investments, onboarded_date, tags, notes, sponsors(name, company)`)
      .single();

    if (updateError) {
      console.error('[ADMIN_INVESTORS] Update error:', updateError);
      const msg = updateError.message?.includes('duplicate key')
        ? 'An investor with this email already exists.'
        : 'Failed to update investor';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({ investor });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[ADMIN_INVESTORS] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/investors/[id]
 * Delete an investor.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await requireAuth(request);
    requireRole(ctx, ['admin', 'partner']);

    const supabase = getSupabaseAdmin();

    // Verify investor belongs to this company before deleting
    const { data: existing } = await supabase
      .from('investors')
      .select('id')
      .eq('id', id)
      .eq('company_id', ctx.companyId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Investor not found' }, { status: 404 });
    }

    // Remove from deal_investors first (referential integrity)
    await supabase
      .from('deal_investors')
      .delete()
      .eq('investor_id', id)
      .eq('company_id', ctx.companyId);

    // Delete the investor
    const { error: deleteError } = await supabase
      .from('investors')
      .delete()
      .eq('id', id)
      .eq('company_id', ctx.companyId);

    if (deleteError) {
      console.error('[ADMIN_INVESTORS] Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete investor' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[ADMIN_INVESTORS] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
