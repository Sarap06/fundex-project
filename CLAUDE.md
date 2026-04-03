# Fundex

Private lending platform for managing real estate investment deals, investors, capital allocations, and investor communications.

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 18, TypeScript
- **Database**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **Email**: Brevo API (transactional emails)
- **UI**: shadcn/ui + Radix UI + Tailwind CSS + Framer Motion
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **State**: React Query (available, minimal usage), Supabase client

## Commands

- `npm run dev` — start dev server (port 3000)
- `npm run build` — production build
- `npm run lint` — ESLint check

## Project Structure

- `/app/` — Active Next.js App Router (routes, layouts, API routes)
- `/app/(dashboard)/` — Route group for dashboards (serves at `/admin`, `/company`, `/investor`)
- `/src/components/` — Shared components (domain + shadcn/ui primitives in `ui/`)
- `/src/lib/` — Core utilities (supabase, auth, brevo, activity-logger, types, utils)
- `/src/hooks/` — Custom React hooks
- `/src/types/` — Centralized TypeScript types (re-exports from lib/types)
- `/src/config/` — App constants and configuration
- `/supabase/migrations/` — Database migration SQL files
- Path alias: `@/*` → `./src/*`

IMPORTANT: `/app/` is the active router. Do NOT create files in `/src/app/`.

## Database & Multi-Tenancy

- **ORM**: Drizzle ORM with postgres.js driver
- Schema: `src/db/schema/` (one file per domain: companies, investors, deals, documents, allocations, broadcasts, activity-logs)
- Client: `import { db } from '@/db'` for typed queries
- Config: `drizzle.config.ts` (requires `DATABASE_URL` env var for migrations/introspection)
- Legacy: Supabase client still used in existing code — new code should prefer Drizzle
- Every table has `company_id` for strict multi-tenant data isolation
- NEVER skip company_id filtering in any query — this is a security requirement
- Key tables: `companies`, `user_profiles`, `investors`, `deals`, `allocations`, `documents`, `broadcast_updates`, `broadcast_update_recipients`, `broadcast_communication_timeline`, `activity_logs`, `deal_investors`
- Migrations in `supabase/migrations/` follow format: `YYYYMMDDHHMMSS_description.sql`
- Use `getSupabaseClient()` from `@/lib/supabase` for anon/client access
- Use `getSupabaseAdmin()` from `@/lib/supabase-admin` for service-role operations in API routes

## Authentication

- Supabase Auth with custom `user_profiles` table
- Three roles: `admin` (full access), `partner` (team member), `investor` (capital provider)
- Admin signup requires access code
- Team members join via `company_code` generated per company
- New users start as "pending" until admin approves

## Service Layer

- `/src/services/` — ALL business logic, calculations, and data access lives here
- API routes are THIN: parse request → validate → call service → respond
- NEVER put math, calculations, or complex queries in API routes or page components
- Services: `access.ts` (auth), `allocation-service.ts`, `deal-service.ts`, `investor-service.ts`, `document-service.ts`, `broadcast-service.ts`, `activity-service.ts`
- Use `requireAuth(req)` from `@/services/access` for auth in API routes
- Use `logActivity()` from `@/services/activity-service` for audit trail
- Financial calculations (interest, totals, percentages) MUST use service functions — never inline math

## API Route Pattern

All API routes in `/app/api/` must follow this pattern:
1. Authenticate — `const ctx = await requireAuth(req)` from `@/services/access`
2. Validate — check request body with Zod schemas from `@/schemas`
3. Execute — call service functions from `@/services/*`
4. Respond — return `NextResponse.json()` with proper status codes

## Design System

- **Fonts**: Trench Slab (headings/display, `font-display`), General Sans (body/UI, `font-sans`) — loaded via Fontshare CDN
- **Brand colors** (available as `fundex-{name}` Tailwind classes and `--fundex-{name}` CSS vars):
  - `#005F02` forest — primary buttons, links, CTAs (`--primary`)
  - `#427A43` green — secondary actions, hover, borders (`--secondary`)
  - `#C0B87A` gold — badges, highlights, accents (`--accent`)
  - `#F2E3BB` cream — card backgrounds, surface tints (`--card`)
- h1/h2/h3 auto-use Trench Slab. Body text uses General Sans.
- Legacy aliases: `--accent-emerald` → `#005F02`, `accent-emerald` Tailwind class still works

## Code Style

- ES modules (import/export), never CommonJS
- Prefer Server Components; only add `'use client'` when interactivity is needed
- Use `cn()` from `@/lib/utils` for conditional Tailwind classes
- Destructure imports: `import { Button } from '@/components/ui/button'`
- Always use `@/` path alias for imports under `src/`
- Log all data mutations with `logActivity()` from `@/lib/activity-logger`
- File naming: ALL lowercase kebab-case for component files (e.g., `dashboard-nav.tsx`, not `DashboardNav.tsx`)
- 3 dashboards: `/admin`, `/company`, `/investor` (via `(dashboard)` route group)
- The DB role value for company users is `'partner'` — the route is `/company`

## Don'ts

- NEVER hardcode Supabase credentials — use environment variables
- NEVER skip company_id filtering in queries (multi-tenant data leak)
- NEVER put heavy business logic in page.tsx — extract to components or lib
- NEVER create files in `/src/app/` — the active router is `/app/`
- NEVER modify `tsconfig.json` path aliases or `components.json` aliases
- NEVER commit `.env` files

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — client-side Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — server-side admin operations only
- `BREVO_API_KEY` / `BREVO_SENDER_EMAIL` / `BREVO_SENDER_NAME` — email service
- `NEXT_PUBLIC_APP_URL` — application base URL
- `CRON_SECRET` — scheduled job authentication
