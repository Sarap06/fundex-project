import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { getDealsByCompany, getDealByIdAndCompany, createDealForCompany } from '@/lib/company-data';
import { logActivity } from '@/lib/activity-logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const dealId = searchParams.get('id');

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id is required' },
        { status: 400 }
      );
    }

    // Fetch specific deal
    if (dealId) {
      const deal = await getDealByIdAndCompany(dealId, companyId);
      if (!deal) {
        return NextResponse.json(
          { error: 'Deal not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(deal);
    }

    // Fetch all deals for company
    const deals = await getDealsByCompany(companyId);
    return NextResponse.json(deals);
  } catch (error) {
    console.error('Error in deals API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id is required' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const deal = await createDealForCompany(companyId, data);

    // Log activity
    await logActivity({
      companyId,
      activityType: 'deal_created',
      title: `New deal: ${deal.name}`,
      description: 'A new deal has been created',
      dealId: deal.id,
      dealName: deal.name,
      metadata: {
        targetAmount: deal.target_amount,
        status: deal.status,
      },
    });

    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json(
      { error: 'Failed to create deal' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const dealId = searchParams.get('id');

    if (!companyId || !dealId) {
      return NextResponse.json(
        { error: 'company_id and id are required' },
        { status: 400 }
      );
    }

    // Verify deal belongs to company
    const existingDeal = await getDealByIdAndCompany(dealId, companyId);
    if (!existingDeal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    const supabase = getSupabaseClient();
    const updateData = await request.json();

    const { data, error } = await supabase
      .from('deals')
      .update(updateData)
      .eq('id', dealId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log activity if status changed
    if (updateData.status && updateData.status !== existingDeal.status) {
      const statusChangeDescriptions: Record<string, string> = {
        'Active': 'Deal status changed to Active',
        'Funding': 'Deal is now in Funding stage',
        'Closed': 'Deal has been closed',
        'On Hold': 'Deal is on hold',
      };

      await logActivity({
        companyId,
        activityType: 'deal_status_changed',
        title: `Deal: ${data.name} - ${updateData.status}`,
        description: statusChangeDescriptions[updateData.status] || 'Deal status updated',
        dealId: data.id,
        dealName: data.name,
        metadata: {
          oldStatus: existingDeal.status,
          newStatus: updateData.status,
        },
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating deal:', error);
    return NextResponse.json(
      { error: 'Failed to update deal' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const dealId = searchParams.get('id');

    if (!companyId || !dealId) {
      return NextResponse.json(
        { error: 'company_id and id are required' },
        { status: 400 }
      );
    }

    // Verify deal belongs to company
    const existingDeal = await getDealByIdAndCompany(dealId, companyId);
    if (!existingDeal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', dealId)
      .eq('company_id', companyId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    console.error('Error deleting deal:', error);
    return NextResponse.json(
      { error: 'Failed to delete deal' },
      { status: 500 }
    );
  }
}
