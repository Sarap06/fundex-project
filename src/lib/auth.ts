import { supabase } from './supabase';
import { UserProfile } from './types';
import { getSupabaseClient } from './supabase';

const ADMIN_ACCESS_CODE = '100630';

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
      full_name: email.split('@')[0],
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

  // Create user profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      user_id: authData.user.id,
      email,
      full_name: fullName,
      role: 'pending',
      company_id: company.id,
      status: 'pending',
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
      status: 'pending',
    });

  if (joinError) throw joinError;

  return { user: authData.user };
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
