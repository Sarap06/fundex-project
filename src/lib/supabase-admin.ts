import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client with service role key for server-side admin operations.
 * Use this in API routes that need to bypass RLS or perform admin operations.
 *
 * NEVER import this in client-side code.
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase server environment variables.');
  }

  return createClient(url, serviceRoleKey);
}
