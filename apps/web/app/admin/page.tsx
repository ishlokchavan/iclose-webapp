import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const CLOSED = ['converted', 'disqualified', 'dormant']

export default async function AdminHome() {
  const supabase = await createClient()

  const [
    { data: leads },
    { count: publishedProjects },
    { count: totalUsers },
  ] = await Promise.all([
    supabase
      .from('leads')
      .select('status, assigned_rm')
      .is('deleted_at', null),
    supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .is('deleted_at', null),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true }),
  ])

  const allLeads     = leads ?? []
  const totalLeads   = allLeads.length
  const newLeads     = allLeads.filter((l) => l.status === 'new').length
  const openLeads    = allLeads.filter((l) => !CLOSED.includes(l.status)).length
  const unassigned   = allLeads.filter((l) => !l.assigned_rm && !CLOSED.includes(l.status)).length

  const kpis = [
    { label: 'Total leads',        value: totalLeads,             href: '/admin/leads' },
    { label: 'New',                value: newLeads,               href: '/admin/leads' },
    { label: 'Open',               value: openLeads,              href: '/admin/leads' },
    { label: 'Unassigned',         value: unassigned,             href: '/admin/leads', warn: unassigned > 0 },
    { label: 'Published projects', value: publishedProjects ?? 0, href: '/admin/projects' },
    { label: 'Registered users',   value: totalUsers ?? 0,        href: '/admin/users' },
  ]

  const quickLinks = [
    {
      href: '/admin/projects', title: 'Projects',
      desc: 'Publish, edit, and manage the catalog.',
    },
    {
      href: '/admin/leads', title: 'Leads',
      desc: 'All buyer enquiries, assign RMs, log activity.',
    },
    {
      href: '/admin/users', title: 'Users',
      desc: 'Everyone who has signed up. Grant staff roles.',
    },
  ]

  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Dashboard</h1>
      <p className="mt-2 text-[15px] text-text-secondary">Platform overview.</p>

      {/* KPI grid */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {kpis.map(({ label, value, href, warn }) => (
          <Link key={label} href={href}
            className="rounded-2xl bg-surface-2 px-5 py-4 hover:bg-surface-3 transition-colors">
            <p className="text-[12px] font-medium text-text-tertiary uppercase tracking-wide">{label}</p>
            <p className={`mt-1 text-[28px] font-semibold tabular-nums ${warn ? 'text-warning' : ''}`}>
              {value}
            </p>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {quickLinks.map(({ href, title, desc }) => (
          <Link key={href} href={href}
            className="rounded-2xl bg-surface-2 p-6 shadow-1 hover:bg-surface-3 transition-colors">
            <h2 className="text-[17px] font-semibold">{title}</h2>
            <p className="mt-2 text-[14px] text-text-secondary">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
