---
paths:
  - "app/api/**/*.ts"
---
# API Route Conventions

- Every route MUST authenticate: create Supabase client, get session, extract company_id
- Return consistent JSON via `NextResponse.json()` with proper HTTP status codes
- ALL database queries MUST be scoped with `company_id` — no exceptions
- Log mutations with `logActivity()` from `@/lib/activity-logger`
- Use `getSupabaseAdmin()` from `@/lib/supabase-admin` for service-role operations
- Validate request bodies with Zod schemas when accepting input
- Handle errors with try/catch and return meaningful error messages
- Follow existing patterns in `app/api/broadcasts/` as reference implementation
