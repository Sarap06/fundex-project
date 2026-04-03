import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Pass through all requests.
  // Auth is handled client-side in each dashboard page via Supabase JS.
  // Future: migrate to @supabase/ssr for server-side cookie-based auth.
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/company/:path*', '/investor/:path*'],
};
