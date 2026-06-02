'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'

type NavItem = {
  href: string
  label: string
  Icon: React.FC<{ active: boolean }>
}

const NAV: NavItem[] = [
  {
    href: '/app/explore',
    label: 'Explore',
    Icon: ({ active }) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.1 : 1.75} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
  },
  {
    href: '/app/saved',
    label: 'Saved',
    Icon: ({ active }) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor"
        strokeWidth={active ? 2.1 : 1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    href: '/app/me',
    label: 'My iClose',
    Icon: ({ active }) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.1 : 1.75} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
]

function isActive(pathname: string, href: string) {
  return pathname.startsWith(href)
}

export function AppNav() {
  const pathname = usePathname()
  return (
    <>
      {/* Desktop: fixed sidenav */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-[220px] border-r border-separator bg-surface z-20">
        <div className="flex items-center h-[64px] px-6 border-b border-separator shrink-0">
          <Link href="/app/explore" className="text-[20px] font-semibold tracking-tight">
            <span className="text-accent">i</span>Close
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1 min-h-0 overflow-y-auto">
          {NAV.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href)
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
        <div className="p-3 border-t border-separator flex items-center justify-between">
          <span className="text-[13px] text-text-tertiary px-1">Theme</span>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile: fixed bottom nav */}
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 bg-surface border-t border-separator z-20 flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {NAV.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href)
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
