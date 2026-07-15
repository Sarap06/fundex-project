import { supabase } from './supabase';
import { UserProfile } from './types';
import { getSupabaseClient } from './supabase';

const ADMIN_ACCESS_CODE = '100630';

function deriveNameFromEmail(email: string): string {
  return email
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function adminSignUp(email: string, password: string, accessCode: string) {
  // Verify access code
  if (accessCode !== ADMIN_ACCESS_CODE) {
    throw new Error('Invalid access code');
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('User creation failed');

  // Generate company code
  const companyCode = generateCompanyCode();

  // Create company
  const { data: companyData, error: companyError } = await supabase
    .from('companies')
    .insert({
      admin_id: authData.user.id,
      company_code: companyCode,
      name: `${email.split('@')[0]}'s Company`,
    })
    .select()
    .single();

  if (companyError) throw companyError;

  // Create user profile - Admin is immediately approved, no approval needed
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      user_id: authData.user.id,
      email,
      full_name: deriveNameFromEmail(email),
      role: 'admin',
      company_id: companyData.id,
      status: 'approved',
    });

  if (profileError) throw profileError;

  // Auto-login admin by signing in with the created credentials
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) console.error('Auto-login error:', loginError);

  return {
    user: authData.user,
    companyCode,
    session: loginData?.session,
  };
}

export async function companySignUp(
  email: string,
  password: string,
  fullName: string,
  companyCode: string
) {
  // Verify company code exists
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id')
    .eq('company_code', companyCode)
    .single();

  if (companyError || !company) {
    throw new Error('Invalid company code');
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('User creation failed');

  // Check if this email was invited (role pre-assigned by admin)
  const { data: invite } = await supabase
    .from('email_invites')
    .select('id, role')
    .eq('email', email)
    .eq('company_id', company.id)
    .eq('status', 'pending')
    .single();

  const assignedRole = invite?.role || 'pending';
  const assignedStatus = invite ? 'approved' : 'pending';

  // Create user profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      user_id: authData.user.id,
      email,
      full_name: fullName,
      role: assignedRole,
      company_id: company.id,
      status: assignedStatus,
    });

  if (profileError) throw profileError;

  // Create join request
  const { error: joinError } = await supabase
    .from('join_requests')
    .insert({
      user_id: authData.user.id,
      company_id: company.id,
      full_name: fullName,
      email,
      status: assignedStatus,
      ...(invite ? { assigned_role: assignedRole } : {}),
    });

  if (joinError) throw joinError;

  // Mark invite as accepted
  if (invite) {
    const { error: inviteUpdateError } = await supabase
      .from('email_invites')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invite.id);
    if (inviteUpdateError) console.error('Failed to mark invite as accepted:', inviteUpdateError);
  }

  // Auto-login so the user has a session for the onboarding survey
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) console.error('Auto-login after signup error:', loginError);

  return { user: authData.user, session: loginData?.session };
}

export async function logIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function logOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data;
}

export async function approveJoinRequest(requestId: string, role: 'partner' | 'investor') {
  // Get the join request
  const { data: request, error: fetchError } = await supabase
    .from('join_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) throw new Error('Request not found');

  // Update join request status
  const { error: updateError } = await supabase
    .from('join_requests')
    .update({
      status: 'approved',
      assigned_role: role,
    })
    .eq('id', requestId);

  if (updateError) throw updateError;

  // Update user profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      role,
      status: 'approved',
    })
    .eq('user_id', request.user_id);

  if (profileError) throw profileError;

  return true;
}

export async function rejectJoinRequest(requestId: string) {
  const { error } = await supabase
    .from('join_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId);

  if (error) throw error;
  return true;
}

function generateCompanyCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Get the company_id for the currently authenticated user
 * @returns company_id UUID or null if user is not authenticated
 */
export async function getCurrentUserCompanyId(): Promise<string | null> {
  try {
    const supabaseClient = getSupabaseClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting current user:', userError);
      return null;
    }

    // Get user profile to retrieve company_id
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error getting user profile:', profileError);
      return null;
    }

    return profile?.company_id || null;
  } catch (error) {
    console.error('Error in getCurrentUserCompanyId:', error);
    return null;
  }
}
