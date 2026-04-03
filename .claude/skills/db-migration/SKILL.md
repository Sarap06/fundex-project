---
name: db-migration
description: Create a Supabase database migration with proper naming, RLS policies, and company_id
disable-model-invocation: true
---
Create a database migration for: $ARGUMENTS

Follow these steps:

1. Generate timestamp: use format `YYYYMMDDHHMMSS` (e.g., `20260403000000`)
2. Create file at `supabase/migrations/{timestamp}_{description}.sql`
3. Include in the migration:
   - `CREATE TABLE` with `company_id UUID NOT NULL` column
   - Foreign key to `companies(id)` with `ON DELETE CASCADE`
   - `created_at TIMESTAMPTZ DEFAULT NOW()`
   - `updated_at TIMESTAMPTZ DEFAULT NOW()`
4. Add RLS policies:
   - `ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;`
   - Policy for authenticated users filtered by `company_id`
5. Add indexes: composite index on `(company_id, ...)` for common query patterns
6. Add any necessary triggers (e.g., auto-update `updated_at`)

Reference existing migrations in `supabase/migrations/` for style consistency.
