---
paths:
  - "supabase/**"
  - "**/*.sql"
---
# Database Conventions

- Every table MUST have a `company_id` column for multi-tenant isolation
- Migration files: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
- Include RLS policies that enforce `company_id` filtering
- Use composite indexes on (company_id, ...) for query performance
- Auto-generated IDs: investors use `INV-XXX`, deals use `DEAL-XXX`, documents use `DOC-XXX`
- Database triggers handle: monthly interest calculation, auto-generated IDs
- Key relationships: deals → deal_investors → investors, deals → allocations, deals → broadcast_updates
