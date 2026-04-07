import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile to scope update by company_id
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin
      .from('user_profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Approve as partner (scoped to company)
    const { error: approveError } = await admin
      .from('user_profiles')
      .update({ role: 'partner', status: 'approved' })
      .eq('user_id', user.id)
      .eq('company_id', profile.company_id);

    if (approveError) {
      console.error('Failed to approve partner:', approveError);
      throw approveError;
    }

    // Mark join request as approved
    await admin
      .from('join_requests')
      .update({ status: 'approved', assigned_role: 'partner' })
      .eq('user_id', user.id)
      .eq('status', 'pending');

    return NextResponse.json({ success: true });
  } catch (error: Error | unknown) {
    console.error('Partner approval error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
