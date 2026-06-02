import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidenav } from '@/components/nav/admin-sidenav'

// Admin cockpit. Requires a staff role; RLS enforces data access at the DB regardless.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: roles } = await supabase.from('profile_roles').select('role').eq('profile_id', user.id)
  const staff = (roles ?? []).some((r: { role: string }) => ['rm', 'ops_manager', 'finance', 'super_admin'].includes(r.role))
  if (!staff) redirect('/app/explore')

  return (
    <div className="min-h-screen">
      <AdminSidenav />

      <div className="md:pl-[240px]">
        {/* Mobile-only top bar */}
        <div className="md:hidden flex items-center h-[56px] px-6 border-b border-separator">
          <Link href="/admin" className="text-[17px] font-semibold">
            <span className="text-accent">i</span>Close
            <span className="ml-2 text-[13px] font-medium text-text-secondary">Admin</span>
          </Link>
        </div>

        <main className="px-6 max-w-[1280px] mx-auto py-8 pb-[88px] md:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}
