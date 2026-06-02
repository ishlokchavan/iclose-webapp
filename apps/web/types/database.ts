// PLACEHOLDER. Generate real types from the live schema with:
//   npm run db:types
// (requires: supabase login && supabase link --project-ref jvdmwvzlunmouvlvtebg)
// Then parametrize clients, e.g. createServerClient<Database>(...).
export type Database = {
  public: { Tables: Record<string, { Row: Record<string, unknown> }> }
}
