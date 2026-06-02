import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Admin cockpit. Requires a staff role; RLS enforces data access at the DB regardless.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: roles } = await supabase.from('profile_roles').select('role').eq('profile_id', user.id)
  const staff = (roles ?? []).some((r) => ['rm', 'ops_manager', 'finance', 'super_admin'].includes(r.role))
  if (!staff) redirect('/app/explore')

  return (
    <div className="min-h-screen">
      <nav className="flex items-center gap-6 px-6 h-16 border-b border-separator">
        <Link href="/admin" className="text-[17px] font-semibold">iClose · Admin</Link>
        <Link href="/admin/projects" className="text-[15px] text-text-secondary hover:text-text">Projects</Link>
      </nav>
      <main className="px-6 max-w-[1280px] mx-auto py-8">{children}</main>
    </div>
  )
}
