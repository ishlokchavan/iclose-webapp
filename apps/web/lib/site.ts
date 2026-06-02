import 'server-only'
import { headers } from 'next/headers'

// Absolute origin for building links in emails. Prefers NEXT_PUBLIC_SITE_URL,
// falls back to the request host (correct on Vercel; http for localhost).
export async function getSiteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const h = await headers()
  const host  = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  return `${proto}://${host}`
}
