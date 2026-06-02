import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '@/components/nav/app-nav'

// Gated buyer zone. Middleware already blocks anon; this is the server-side backstop.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  return (
    <div className="min-h-screen">
      <AppNav />

      <div className="md:pl-[220px]">
        {/* Mobile-only top bar */}
        <div className="md:hidden flex items-center h-[56px] px-6 border-b border-separator">
          <Link href="/app/explore" className="text-[20px] font-semibold tracking-tight">
            <span className="text-accent">i</span>Close
          </Link>
        </div>

        <main className="px-6 md:px-8 max-w-[1120px] mx-auto py-8 pb-[88px] md:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}
