import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { getInvestorsByCompany, getInvestorByIdAndCompany, createInvestorForCompany } from '@/lib/company-data';
import { logActivity } from '@/lib/activity-logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const investorId = searchParams.get('id');

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id is required' },
        { status: 400 }
      );
    }

    // Fetch specific investor
    if (investorId) {
      const investor = await getInvestorByIdAndCompany(investorId, companyId);
      if (!investor) {
        return NextResponse.json(
          { error: 'Investor not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(investor);
    }

    // Fetch all investors for company
    const investors = await getInvestorsByCompany(companyId);
    return NextResponse.json(investors);
  } catch (error) {
    console.error('Error in investors API:', error);
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
    const investor = await createInvestorForCompany(companyId, data);

    // Log activity
    await logActivity({
      companyId,
      activityType: 'investor_added',
      title: `${investor.full_name} has been added`,
      description: 'Onboarded new investor',
      investorId: investor.id,
      investorName: investor.full_name,
      metadata: {
        email: investor.email,
        status: investor.status,
      },
    });

    return NextResponse.json(investor, { status: 201 });
  } catch (error) {
    console.error('Error creating investor:', error);
    return NextResponse.json(
      { error: 'Failed to create investor' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const investorId = searchParams.get('id');

    if (!companyId || !investorId) {
      return NextResponse.json(
        { error: 'company_id and id are required' },
        { status: 400 }
      );
    }

    // Verify investor belongs to company
    const existingInvestor = await getInvestorByIdAndCompany(investorId, companyId);
    if (!existingInvestor) {
      return NextResponse.json(
        { error: 'Investor not found' },
        { status: 404 }
      );
    }

    const supabase = getSupabaseClient();
    const updateData = await request.json();

    const { data, error } = await supabase
      .from('investors')
      .update(updateData)
      .eq('id', investorId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log activity if status changed
    if (updateData.status && updateData.status !== existingInvestor.status) {
      const statusChangeDescriptions: Record<string, string> = {
        'Active': 'Investor status changed to Active',
        'Onboarding': 'Investor is onboarding',
        'Pending': 'Investor request is pending',
      };

      await logActivity({
        companyId,
        activityType: updateData.status === 'Active' ? 'investor_accepted' : 'investor_status_changed',
        title: `${data.full_name} - ${updateData.status}`,
        description: statusChangeDescriptions[updateData.status] || 'Investor status updated',
        investorId: data.id,
        investorName: data.full_name,
        metadata: {
          oldStatus: existingInvestor.status,
          newStatus: updateData.status,
        },
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating investor:', error);
    return NextResponse.json(
      { error: 'Failed to update investor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const investorId = searchParams.get('id');

    if (!companyId || !investorId) {
      return NextResponse.json(
        { error: 'company_id and id are required' },
        { status: 400 }
      );
    }

    // Verify investor belongs to company
    const existingInvestor = await getInvestorByIdAndCompany(investorId, companyId);
    if (!existingInvestor) {
      return NextResponse.json(
        { error: 'Investor not found' },
        { status: 404 }
      );
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('investors')
      .delete()
      .eq('id', investorId)
      .eq('company_id', companyId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: 'Investor deleted successfully' });
  } catch (error) {
    console.error('Error deleting investor:', error);
    return NextResponse.json(
      { error: 'Failed to delete investor' },
      { status: 500 }
    );
  }
}
