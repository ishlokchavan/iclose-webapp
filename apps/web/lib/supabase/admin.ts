import 'server-only' // build-time guard: this module can NEVER be imported into client code
import { createClient } from '@supabase/supabase-js'

// Service-role client — BYPASSES RLS. SERVER-ONLY, behind RBAC + audit. (Blueprint §39.2)
// Never expose the service-role key to the browser. Never import this from a client component.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
