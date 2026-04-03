import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const protectedPaths = ['/admin', '/company', '/investor'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect dashboard routes
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  if (!isProtected) return NextResponse.next();

  // Check for Supabase auth token in cookies
  const accessToken =
    request.cookies.get('sb-access-token')?.value ||
    request.cookies.get(`sb-${getSupabaseProjectRef()}-auth-token`)?.value;

  if (!accessToken) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

function getSupabaseProjectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  // Extract project ref from https://xxxx.supabase.co
  const match = url.match(/https:\/\/([^.]+)/);
  return match?.[1] || '';
}

export const config = {
  matcher: ['/admin/:path*', '/company/:path*', '/investor/:path*'],
};
