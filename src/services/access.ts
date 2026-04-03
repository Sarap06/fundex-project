import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export interface AuthContext {
  userId: string;
  email: string;
  companyId: string;
  role: 'admin' | 'partner' | 'investor' | 'pending';
  fullName: string;
}

/**
 * Get authenticated user context from a request.
 * Returns userId, companyId, role — everything needed for scoped queries.
 *
 * Throws if unauthenticated or no profile found.
 */
export async function requireAuth(req?: NextRequest): Promise<AuthContext> {
  const supabase = getServiceClient();

  // Try to get token from Authorization header first, then cookies
  let token: string | undefined;

  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // Get user from Supabase auth
  const { data: { user }, error: authError } = token
    ? await supabase.auth.getUser(token)
    : await supabase.auth.getUser();

  if (authError || !user) {
    throw new AuthError('Unauthorized', 401);
  }

  // Get user profile with company_id
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('user_id, email, full_name, role, company_id, status')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    throw new AuthError('User profile not found', 404);
  }

  if (profile.status !== 'approved' && profile.role !== 'admin') {
    throw new AuthError('Account not yet approved', 403);
  }

  if (!profile.company_id) {
    throw new AuthError('No company associated with this account', 403);
  }

  return {
    userId: profile.user_id,
    email: profile.email,
    companyId: profile.company_id,
    role: profile.role,
    fullName: profile.full_name,
  };
}

/**
 * Require specific roles. Call after requireAuth().
 */
export function requireRole(ctx: AuthContext, allowedRoles: AuthContext['role'][]) {
  if (!allowedRoles.includes(ctx.role)) {
    throw new AuthError(`Insufficient permissions. Required: ${allowedRoles.join(', ')}`, 403);
  }
}

/**
 * Verify that a resource belongs to the user's company.
 * Use this before any cross-table operation.
 */
export async function verifyCompanyOwnership(
  table: string,
  resourceId: string,
  companyId: string
): Promise<boolean> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq('id', resourceId)
    .eq('company_id', companyId)
    .single();

  if (error || !data) return false;
  return true;
}

/**
 * Custom error class with HTTP status codes.
 */
export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

/**
 * Creates a Supabase client with service role key.
 * Centralized — every service uses this, not inline createClient().
 */
export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
