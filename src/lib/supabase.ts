import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
  }

  // createBrowserClient from @supabase/ssr stores session in cookies (not localStorage)
  // so the middleware can read the same session via createServerClient
  supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

// For backward compatibility, export a lazy getter
export const supabase = new Proxy(
  { getSupabaseClient } as unknown as SupabaseClient,
  {
    get: (target, prop) => {
      const client = getSupabaseClient();
      return Reflect.get(client, prop);
    },
  }
) as unknown as SupabaseClient;
