'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition, useRef } from 'react'

type Area = { id: string; name: string }

const AVAIL_OPTIONS = [
  { value: '',             label: 'All' },
  { value: 'available',    label: 'Available' },
  { value: 'limited',      label: 'Limited' },
  { value: 'coming_soon',  label: 'Coming soon' },
]

export function ExploreFilters({ areas, total }: { areas: Area[]; total: number }) {
  const router      = useRouter()
  const pathname    = usePathname()
  const params      = useSearchParams()
  const [pending, startTransition] = useTransition()
  const inputRef    = useRef<HTMLInputElement>(null)

  function push(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else        next.delete(key)
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false })
    })
  }

  const q     = params.get('q')     ?? ''
  const area  = params.get('area')  ?? ''
  const avail = params.get('avail') ?? ''

  const hasFilters = q || area || avail

  function clearAll() {
    if (inputRef.current) inputRef.current.value = ''
    startTransition(() => {
      router.replace(pathname, { scroll: false })
    })
  }

  return (
    <div className={`flex flex-col gap-3 transition-opacity ${pending ? 'opacity-60 pointer-events-none' : ''}`}>
      {/* Search row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none"
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            type="search"
            placeholder="Search projects…"
            defaultValue={q}
            onChange={(e) => push('q', e.target.value.trim())}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-surface-2 text-[14px] outline-none
              focus:ring-2 focus:ring-accent/40 placeholder:text-text-tertiary"
          />
        </div>

        {areas.length > 0 && (
          <select
            value={area}
            onChange={(e) => push('area', e.target.value)}
            className="h-10 px-3 rounded-xl bg-surface-2 text-[14px] outline-none cursor-pointer
              focus:ring-2 focus:ring-accent/40 appearance-none pr-7 min-w-[120px]"
          >
            <option value="">All areas</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Availability chips + result count */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {AVAIL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => push('avail', opt.value)}
              className={`rounded-pill px-3 py-1 text-[12px] font-medium transition-colors ${
                avail === opt.value
                  ? 'bg-accent text-white'
                  : 'bg-surface-2 text-text-secondary hover:bg-surface-3'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[13px] text-text-tertiary tabular-nums">{total} project{total !== 1 ? 's' : ''}</span>
          {hasFilters && (
            <button onClick={clearAll}
              className="text-[13px] text-text-secondary hover:text-text transition-colors">
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
