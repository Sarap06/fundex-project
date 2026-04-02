import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Request body:', body);

    const { userProfileId, email, newRole } = body;

    if (!userProfileId || !email || !newRole) {
      console.error('Missing fields:', { userProfileId, email, newRole });
      return NextResponse.json(
        { error: `Missing required fields: userProfileId=${!!userProfileId}, email=${!!email}, newRole=${!!newRole}` },
        { status: 400 }
      );
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

    console.log('Updating role:', { userProfileId, email, newRole });

    // Update user_profiles table
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update({ role: newRole })
      .eq('id', userProfileId)
      .select();

    console.log('User profile update:', { profileData, profileError });

    if (profileError) {
      console.error('Error updating user profile:', profileError);
      return NextResponse.json(
        { error: `Failed to update user profile: ${profileError.message}` },
        { status: 400 }
      );
    }

    // Find the user_id from join_requests using email, then update assigned_role
    const { data: joinRequests, error: joinFetchError } = await supabaseAdmin
      .from('join_requests')
      .select('id, user_id')
      .eq('email', email)
      .eq('status', 'approved')
      .single();

    console.log('Join request lookup:', { joinRequests, joinFetchError });

    if (joinFetchError) {
      console.error('No approved join request found for this email, skipping join_requests update');
    } else if (joinRequests) {
      // Update join_requests table with new role
      const { data: joinData, error: joinError } = await supabaseAdmin
        .from('join_requests')
        .update({ assigned_role: newRole })
        .eq('id', joinRequests.id)
        .select();

      console.log('Join request update:', { joinData, joinError });

      if (joinError) {
        console.error('Error updating join request:', joinError);
        // Don't fail if join_requests update fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully',
      userProfile: profileData?.[0],
    });
  } catch (error) {
    console.error('Error in update role API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
