import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmailViaBrevo, generateRejectionEmailTemplate } from '@/lib/brevo';

export async function POST(request: NextRequest) {
  try {
    const { requestId } = await request.json();

    if (!requestId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Create admin client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Fetch join request details to get email, full_name, and user_id
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

    const userId = joinRequestData.user_id;
    const userEmail = joinRequestData.email;
    const userName = joinRequestData.full_name || 'User';

    // Delete user from user_profiles table
    const { error: deleteProfileError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('user_id', userId);

    if (deleteProfileError) {
      console.error('Error deleting user profile:', deleteProfileError);
      // Continue anyway as email is still important
    }

    // Delete auth user using admin API
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError);
      // Continue anyway as email is still important
    }

    // Update join request status to rejected
    const { error: updateError } = await supabaseAdmin
      .from('join_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // Send rejection email
    const emailTemplate = generateRejectionEmailTemplate(userName);
    const emailSent = await sendEmailViaBrevo(
      userEmail,
      'Update on Your Join Request',
      emailTemplate
    );

    console.log('Rejection email sent:', { email: userEmail, emailSent });
    console.log('User deleted:', { userId, userEmail });

    return NextResponse.json({ 
      success: true,
      emailSent,
      userDeleted: true,
    });
  } catch (error: Error | unknown) {
    console.error('Reject request error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
