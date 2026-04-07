import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { firmName, businessType, teamSize, activeInvestors, annualDealVolume, userRole, bankConnected } = await request.json();

    if (!firmName || !businessType || !teamSize || !activeInvestors || !annualDealVolume || !userRole) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Insert firm survey
    const { error: insertError } = await supabase
      .from('firm_surveys')
      .insert({
        user_id: user.id,
        company_id: userProfile.company_id,
        firm_name: firmName,
        business_type: businessType,
        team_size: teamSize,
        active_investors: activeInvestors,
        annual_deal_volume: annualDealVolume,
        user_role: userRole,
        bank_connected: bankConnected || false,
      });

    if (insertError) throw insertError;

    const admin = getSupabaseAdmin();

    // Check current role — admins stay admin, pending users become partner
    const { data: currentProfile } = await admin
      .from('user_profiles')
      .select('role, status')
      .eq('user_id', user.id)
      .single();

    if (currentProfile?.role !== 'admin') {
      // Auto-approve as partner (use admin client to bypass RLS)
      const { error: approveError } = await admin
        .from('user_profiles')
        .update({ role: 'partner', status: 'approved' })
        .eq('user_id', user.id);

      if (approveError) {
        console.error('Failed to approve user:', approveError);
        throw approveError;
      }

      // Mark join request as approved
      await admin
        .from('join_requests')
        .update({ status: 'approved', assigned_role: 'partner' })
        .eq('user_id', user.id)
        .eq('status', 'pending');
    }

    // Update company name with firm name
    if (userProfile.company_id) {
      await admin
        .from('companies')
        .update({ name: firmName })
        .eq('id', userProfile.company_id);
    }

    return NextResponse.json({
      success: true,
      message: 'Firm setup complete and account approved',
    });
  } catch (error: Error | unknown) {
    console.error('Firm survey submission error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
