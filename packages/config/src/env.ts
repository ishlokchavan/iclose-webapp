import { z } from 'zod'

// Fail fast on misconfiguration. Import getEnv() in server entrypoints when you want
// strict validation. Public vars are inlined by Next at build; server vars stay server-side.
const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(), // server-only; never in client
  BREVO_API_KEY: z.string().optional(),       // server-only; Brevo transactional email
  BREVO_FROM: z.string().email().optional(),  // verified sender address in Brevo
  BREVO_ADMIN_EMAIL: z.string().email().optional(), // receives new-lead notifications
})

export type Env = z.infer<typeof schema>
export function getEnv(): Env {
  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    throw new Error('Invalid environment: ' + JSON.stringify(parsed.error.flatten().fieldErrors))
  }
  return parsed.data
}
