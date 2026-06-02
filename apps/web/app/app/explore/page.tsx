import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ExploreFilters } from './explore-filters'

export const dynamic = 'force-dynamic'

const AVAIL_STYLE: Record<string, string> = {
  available:   'bg-accent-soft text-accent',
  limited:     'bg-surface-3 text-warning',
  sold_out:    'bg-surface-3 text-danger',
  coming_soon: 'bg-surface-3 text-text-secondary',
}
const AVAIL_LABEL: Record<string, string> = {
  available: 'Available', limited: 'Limited', sold_out: 'Sold out', coming_soon: 'Coming soon',
}

type SearchParams = { q?: string; area?: string; avail?: string }

export default async function Explore({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()

  const q     = (searchParams.q     ?? '').trim()
  const area  = (searchParams.area  ?? '').trim()
  const avail = (searchParams.avail ?? '').trim()

  let query = supabase
    .from('projects')
    .select('id, slug, name, price_from, currency, handover_quarter, availability, area_id, developer:developers(name), area:areas(name)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (q)     query = query.ilike('name', `%${q}%`)
  if (area)  query = query.eq('area_id', area)
  if (avail) query = query.eq('availability', avail)

  const { data: projects, error } = await query

  // Fetch areas for the filter bar (all areas that have published projects)
  const { data: allAreas } = await supabase
    .from('areas')
    .select('id, name')
    .order('name', { ascending: true })

  const areas = (allAreas ?? []) as { id: string; name: string }[]

  const nameOf = (rel: { name: string } | { name: string }[] | null | undefined): string =>
    !rel ? '' : Array.isArray(rel) ? (rel[0]?.name ?? '') : rel.name

  const list = projects ?? []
  const hasFilters = q || area || avail

  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Explore off-plan projects</h1>
      <p className="mt-2 text-[15px] text-text-secondary">Every project, one honest view.</p>

      <div className="mt-6">
        <Suspense>
          <ExploreFilters areas={areas} total={list.length} />
        </Suspense>
      </div>

      {error && (
        <p className="mt-8 text-danger text-[15px]">Could not load projects: {error.message}</p>
      )}

      {!error && list.length === 0 && (
        <div className="mt-12 rounded-2xl bg-surface-2 p-8 text-center">
          {hasFilters ? (
            <>
              <p className="text-[17px] font-semibold">No projects match your filters</p>
              <p className="mt-2 text-[15px] text-text-secondary">Try adjusting your search or clearing the filters.</p>
            </>
          ) : (
            <>
              <p className="text-[17px] font-semibold">No projects published yet</p>
              <p className="mt-2 text-[15px] text-text-secondary">
                Publish projects via the admin portal and they will appear here.
              </p>
            </>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => {
          const avail = p.availability ?? 'available'
          return (
            <Link key={p.id} href={`/app/explore/${p.slug}`}
              className="group rounded-2xl bg-surface-2 p-6 shadow-1 hover:bg-surface-3 transition-colors flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-[17px] font-semibold group-hover:text-accent transition-colors">
                  {p.name}
                </h2>
                <span className={`shrink-0 inline-block rounded-pill text-[11px] font-semibold px-2 py-[2px] ${
                  AVAIL_STYLE[avail] ?? 'bg-surface-3 text-text-secondary'
                }`}>
                  {AVAIL_LABEL[avail] ?? avail}
                </span>
              </div>
              <p className="mt-1 text-[13px] text-text-tertiary">
                {[nameOf(p.developer), nameOf(p.area)].filter(Boolean).join(' · ')}
              </p>
              <p className="mt-1 text-[14px] text-text-secondary">Handover {p.handover_quarter ?? 'TBC'}</p>
              <p className="mt-auto pt-4 text-[15px]">
                From{' '}
                <span className="font-semibold tabular-nums">
                  {p.currency} {Number(p.price_from ?? 0).toLocaleString()}
                </span>
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
