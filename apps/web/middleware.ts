import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Coarse auth gate at the edge. Fine-grained role checks live in (admin) layouts + RLS.
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/app/:path*', '/admin/:path*'],
}
