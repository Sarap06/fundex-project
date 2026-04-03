---
name: new-api-route
description: Scaffold a new API route with authentication, validation, company scoping, and activity logging
disable-model-invocation: true
---
Create a new API route for: $ARGUMENTS

Follow these steps:

1. Create the route file at `app/api/{resource}/route.ts`
2. Include authentication check using Supabase session
3. Extract `company_id` from the authenticated user's profile
4. Add Zod validation for request body (if POST/PATCH)
5. Implement the handler with ALL queries scoped by `company_id`
6. Add `logActivity()` calls for any data mutations
7. Return `NextResponse.json()` with proper HTTP status codes
8. Handle errors with try/catch

Reference `app/api/broadcasts/deals/[dealId]/send-update/route.ts` as the pattern to follow.
Use `getSupabaseAdmin()` from `@/lib/supabase-admin` for service-role operations.
