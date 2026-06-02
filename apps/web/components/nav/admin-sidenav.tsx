'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = {
  href: string
  label: string
  exact?: boolean
  Icon: React.FC<{ active: boolean }>
}

const NAV: NavItem[] = [
  {
    href: '/admin',
    label: 'Dashboard',
    exact: true,
    Icon: ({ active }) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.1 : 1.75} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/admin/projects',
    label: 'Projects',
    Icon: ({ active }) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.1 : 1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21V8l9-5 9 5v13" />
        <path d="M9 21v-7h6v7" />
        <path d="M9 11h.01M15 11h.01" />
      </svg>
    ),
  },
  {
    href: '/admin/leads',
    label: 'Leads',
    Icon: ({ active }) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.1 : 1.75} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="4" />
        <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
        <path d="M16 3.13a4 4 0 010 7.75" />
        <path d="M21 21v-2a4 4 0 00-3-3.87" />
      </svg>
    ),
  },
  {
    href: '/admin/transactions',
    label: 'Deals',
    Icon: ({ active }) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.1 : 1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7h18M3 7l2-3h14l2 3M3 7v12a1 1 0 001 1h16a1 1 0 001-1V7" />
        <path d="M9 11a3 3 0 006 0" />
      </svg>
    ),
  },
  {
    href: '/admin/users',
    label: 'Users',
    Icon: ({ active }) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.1 : 1.75} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    href: '/admin/audit',
    label: 'Audit',
    Icon: ({ active }) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.1 : 1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname.startsWith(href)
}

export function AdminSidenav() {
  const pathname = usePathname()
  return (
    <>
      {/* Desktop: fixed sidenav */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-[240px] border-r border-separator bg-surface z-20">
        <div className="flex items-center h-[64px] px-6 border-b border-separator shrink-0">
          <Link href="/admin" className="text-[17px] font-semibold">
            <span className="text-accent">i</span>Close
            <span className="ml-2 text-[13px] font-medium text-text-secondary">Admin</span>
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1 min-h-0 overflow-y-auto">
          {NAV.map(({ href, label, exact, Icon }) => {
            const active = isActive(pathname, href, exact)
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 h-11 px-3 rounded-lg text-[15px] font-medium transition-colors ${
                  active ? 'bg-accent-soft text-accent' : 'text-text-secondary hover:bg-surface-2 hover:text-text'
                }`}
              >
                <Icon active={active} />
                {label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile: fixed bottom nav */}
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 bg-surface border-t border-separator z-20 flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {NAV.map(({ href, label, exact, Icon }) => {
          const active = isActive(pathname, href, exact)
          return (
            <Link key={href} href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-[3px] h-[56px] text-[11px] font-medium transition-colors ${
                active ? 'text-accent' : 'text-text-tertiary'
              }`}
            >
              <Icon active={active} />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
