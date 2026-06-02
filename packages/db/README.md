# @iclose/db

Database is **Supabase Postgres 17**. The canonical migrations live in
[`/supabase/migrations`](../../supabase/migrations) (Supabase CLI layout), so
`supabase db push` / `supabase db reset` work out of the box.

| Migration | Contents |
|-----------|----------|
| `0001_extensions_and_enums` | `pgcrypto`, `pg_trgm`; 9 enum state machines |
| `0002_core_schema`          | 28 tables (identity, catalog, media, CRM, transactions, cashback, platform) + indexes |
| `0003_functions_and_triggers` | `updated_at`, search-vector, `handle_new_user`, `has_role()`, `is_staff()` |
| `0004_rls_policies`         | RLS enabled on all 28 tables + 57 policies |

These four migrations have **already been applied** to project
`jvdmwvzlunmouvlvtebg`. The files exist so the repo is the source of truth and a
fresh environment can be rebuilt identically.

Regenerate TypeScript types after any schema change: `npm run db:types`.
