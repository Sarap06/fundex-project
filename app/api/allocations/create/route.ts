import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { logActivity } from '@/lib/activity-logger';

const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      company_id,
      investor_id,
      deal_id,
      allocation_amount,
      allocation_percentage,
      commit_date,
      expected_funding_date,
      annual_rate,
      term_length,
      payment_frequency,
      payment_start_date,
      funding_status,
      notes,
      created_by,
    } = body;

    // Validate required fields
    if (!company_id || !investor_id || !deal_id || !allocation_amount) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!commit_date || !expected_funding_date || !payment_start_date) {
      return NextResponse.json(
        { success: false, message: 'All date fields are required' },
        { status: 400 }
      );
    }

    // Calculate monthly interest (will also be calculated by trigger)
    const monthlyInterest = (allocation_amount * annual_rate / 100) / 12;

    // Insert allocation - convert empty strings to null for dates
    const { data: allocation, error: insertError } = await supabaseServiceRole
      .from('allocations')
      .insert([
        {
          company_id,
          investor_id,
          deal_id,
          allocation_amount,
          allocation_percentage: allocation_percentage || 0,
          commit_date: commit_date || null,
          expected_funding_date: expected_funding_date || null,
          annual_rate,
          term_length,
          payment_frequency,
          payment_start_date: payment_start_date || null,
          funding_status: funding_status || 'Pending',
          notes,
          monthly_interest: monthlyInterest,
          status: 'pending',
          created_by,
        },
      ])
      .select();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { success: false, message: 'Failed to create allocation', error: insertError.message },
        { status: 500 }
      );
    }

    if (!allocation || allocation.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No allocation returned' },
        { status: 500 }
      );
    }

    // Fetch investor and deal names for activity logging
    const { data: investor } = await supabaseServiceRole
      .from('investors')
      .select('full_name')
      .eq('id', investor_id)
      .single();

    const { data: deal } = await supabaseServiceRole
      .from('deals')
      .select('name')
      .eq('id', deal_id)
      .single();

    // Log activity
    await logActivity({
      companyId: company_id,
      activityType: 'allocation_created',
      title: `New allocation of $${(allocation_amount / 1000000).toFixed(2)}M`,
      description: `${investor?.full_name} allocated to ${deal?.name}`,
      investorId: investor_id,
      investorName: investor?.full_name,
      dealId: deal_id,
      dealName: deal?.name,
      allocationId: allocation[0].id,
      metadata: { amount: allocation_amount },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Allocation created successfully',
        allocation: allocation[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/allocations/create:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}
