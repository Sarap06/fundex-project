import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase-middleware';

const ROLE_ROUTES: Record<string, string> = {
  admin: '/admin',
  partner: '/company',
  investor: '/investor',
};

const ROUTE_ROLES: Record<string, string> = {
  '/admin': 'admin',
  '/company': 'partner',
  '/investor': 'investor',
};

/**
 * Create a redirect response that preserves auth cookies from the middleware client.
 * Without this, refreshed session tokens would be lost on redirects.
 */
function redirectWithCookies(
  url: URL,
  getResponse: () => NextResponse
): NextResponse {
  const redirect = NextResponse.redirect(url);
  const mwResponse = getResponse();
  mwResponse.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie.name, cookie.value);
  });
  return redirect;
}

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);
  const { pathname } = request.nextUrl;

  // Refresh the session (important: must call getUser to refresh cookies)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // --- Auth pages: redirect logged-in users to their dashboard ---
  if (pathname.startsWith('/auth')) {
    if (user && !error) {
      const profile = await getProfile(supabase, user.id);
      if (profile?.role && profile.role !== 'pending' && profile.status === 'approved') {
        const dest = ROLE_ROUTES[profile.role];
        if (dest) {
          return redirectWithCookies(new URL(dest, request.url), response);
        }
      }
    }
    return response();
  }

  // --- Dashboard pages: enforce auth + role ---
  if (!user || error) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return redirectWithCookies(loginUrl, response);
  }

  const profile = await getProfile(supabase, user.id);

  if (!profile) {
    return redirectWithCookies(new URL('/auth/login', request.url), response);
  }

  // Pending/rejected users can't access dashboards (admins bypass — always approved on signup)
  if (profile.status !== 'approved' && profile.role !== 'admin') {
    // Self-signup users go to onboarding survey; don't redirect if already there
    if (!pathname.startsWith('/onboarding')) {
      return redirectWithCookies(new URL('/onboarding', request.url), response);
    }
  }

  // Onboarding survey gate — check if user has completed their survey
  const needsSurvey = await checkNeedsSurvey(supabase, user.id, profile.role);

  // Approved users visiting /onboarding — redirect to dashboard if survey done
  if (pathname.startsWith('/onboarding') && profile.status === 'approved' && profile.role !== 'pending') {
    if (!needsSurvey) {
      const dest = ROLE_ROUTES[profile.role];
      if (dest) {
        return redirectWithCookies(new URL(dest, request.url), response);
      }
    }
    // Needs survey — let them stay on /onboarding
    return response();
  }

  // Admin/partner hitting their dashboard without completing firm survey → redirect to /onboarding
  if (needsSurvey && !pathname.startsWith('/onboarding')) {
    return redirectWithCookies(new URL('/onboarding', request.url), response);
  }

  // Determine which role this path requires
  const pathBase = '/' + pathname.split('/')[1]; // '/admin', '/company', or '/investor'
  const requiredRole = ROUTE_ROLES[pathBase];

  if (requiredRole && profile.role !== requiredRole) {
    // Wrong dashboard — redirect to the correct one
    const correctRoute = ROLE_ROUTES[profile.role];
    if (correctRoute) {
      return redirectWithCookies(new URL(correctRoute, request.url), response);
    }
    return redirectWithCookies(new URL('/auth/login', request.url), response);
  }

  return response();
}

/**
 * Fetch user profile (role + status) from user_profiles table.
 */
async function getProfile(
  supabase: ReturnType<typeof createMiddlewareClient>['supabase'],
  userId: string
) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('role, status, company_id')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error(`[middleware] Profile fetch failed for user ${userId}:`, error.message);
    return null;
  }
  if (!data) {
    console.warn(`[middleware] No profile found for user ${userId}`);
    return null;
  }
  return data as { role: string; status: string; company_id: string | null };
}

/**
 * Check if user still needs to complete their onboarding survey.
 * - admin → check firm_surveys (must set up workspace)
 * - partner → no survey needed (joining an existing firm)
 * - investor → check investor_surveys
 * - pending → always needs survey (handled by status check above)
 */
async function checkNeedsSurvey(
  supabase: ReturnType<typeof createMiddlewareClient>['supabase'],
  userId: string,
  role: string
): Promise<boolean> {
  if (role === 'admin') {
    const { data } = await supabase
      .from('firm_surveys')
      .select('id')
      .eq('user_id', userId)
      .single();
    return !data;
  }
  if (role === 'investor') {
    const { data } = await supabase
      .from('investor_surveys')
      .select('id')
      .eq('user_id', userId)
      .single();
    return !data;
  }
  // partner — no survey needed
  return false;
}

export const config = {
  matcher: ['/admin/:path*', '/company/:path*', '/investor/:path*', '/auth/:path*', '/onboarding'],
};
