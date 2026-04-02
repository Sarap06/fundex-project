import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmailViaBrevo, generateApprovalEmailTemplate } from '@/lib/brevo';

export async function POST(request: NextRequest) {
  try {
    const { requestId, userId, selectedRole, companyId } = await request.json();

    if (!requestId || !userId || !selectedRole) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase configuration');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Create admin client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('Approving request:', { requestId, userId, selectedRole });

    // Fetch join request details to get email and full_name
    const { data: joinRequestData, error: fetchError } = await supabaseAdmin
      .from('join_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !joinRequestData) {
      console.error('Error fetching join request:', fetchError);
      return NextResponse.json(
        { error: 'Join request not found' },
        { status: 404 }
      );
    }

    // Update join_requests table
    const { data: joinData, error: joinError } = await supabaseAdmin
      .from('join_requests')
      .update({ status: 'approved', assigned_role: selectedRole })
      .eq('id', requestId)
      .select();

    console.log('Join request update:', { joinData, joinError });

    if (joinError) {
      console.error('Error updating join_requests:', joinError);
      return NextResponse.json(
        { error: `Failed to update join request: ${joinError.message}` },
        { status: 400 }
      );
    }

    if (!joinData || joinData.length === 0) {
      console.error('No join request found with id:', requestId);
      return NextResponse.json(
        { error: 'Join request not found' },
        { status: 404 }
      );
    }

    // Update user_profiles table
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update({ role: selectedRole, status: 'approved' })
      .eq('user_id', userId)
      .select();

    console.log('User profile update:', { profileData, profileError });

    if (profileError) {
      console.error('Error updating user_profiles:', profileError);
      return NextResponse.json(
        { error: `Failed to update user profile: ${profileError.message}` },
        { status: 400 }
      );
    }

    // Send approval email
    const emailTemplate = generateApprovalEmailTemplate(
      joinRequestData.full_name || 'User',
      selectedRole
    );
    const emailSent = await sendEmailViaBrevo(
      joinRequestData.email,
      `Welcome! Your Request Has Been Approved - ${selectedRole.toUpperCase()} Role`,
      emailTemplate
    );

    console.log('Approval email sent:', { email: joinRequestData.email, emailSent });

    return NextResponse.json({
      success: true,
      message: 'Request approved successfully',
      joinRequest: joinData[0],
      userProfile: profileData?.[0],
      emailSent,
    });
  } catch (error) {
    console.error('Error in approve request API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
