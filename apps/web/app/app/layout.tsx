import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Gated buyer zone. Middleware already blocks anon; this is the server-side backstop.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  return (
    <div className="min-h-screen">
      <nav className="flex items-center gap-6 px-6 md:px-16 h-16 border-b border-separator">
        <Link href="/app/explore" className="text-[20px] font-semibold tracking-tight">
          <span className="text-accent">i</span>Close
        </Link>
        <Link href="/app/explore" className="text-[15px] text-text-secondary hover:text-text">Explore</Link>
        <Link href="/app/saved" className="text-[15px] text-text-secondary hover:text-text">Saved</Link>
        <Link href="/app/me" className="text-[15px] text-text-secondary hover:text-text">My iClose</Link>
      </nav>
      <main className="px-6 md:px-16 max-w-[1120px] mx-auto py-8">{children}</main>
    </div>
  )
}
