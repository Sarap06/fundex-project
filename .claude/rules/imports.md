# Import Conventions

- Always use `@/` path alias for anything under `src/` — never relative paths that cross directories
- The alias is defined in `tsconfig.json`: `@/*` → `./src/*`
- Common imports:
  - `@/lib/supabase` — client-side Supabase (`getSupabaseClient()`, `supabase`)
  - `@/lib/supabase-admin` — server-side Supabase with service role key
  - `@/lib/auth` — authentication helpers
  - `@/lib/types` or `@/types` — TypeScript interfaces
  - `@/lib/utils` — `cn()` class utility
  - `@/lib/activity-logger` — `logActivity()` for audit trail
  - `@/lib/brevo` — email sending via Brevo API
  - `@/components/ui/*` — shadcn/ui primitives
