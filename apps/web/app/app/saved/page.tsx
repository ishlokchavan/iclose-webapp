import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { unsaveProject } from './actions'

export const dynamic = 'force-dynamic'

type Rel<T> = T | T[] | null
const one = <T,>(rel: Rel<T>): T | null =>
  !rel ? null : Array.isArray(rel) ? (rel[0] ?? null) : rel

const AVAIL_STYLE: Record<string, string> = {
  available:   'bg-accent-soft text-accent',
  limited:     'bg-surface-3 text-warning',
  sold_out:    'bg-surface-3 text-danger',
  coming_soon: 'bg-surface-3 text-text-secondary',
}
const AVAIL_LABEL: Record<string, string> = {
  available: 'Available', limited: 'Limited', sold_out: 'Sold out', coming_soon: 'Coming soon',
}

export default async function Saved() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data } = await supabase
    .from('saved_items')
    .select(`
      id, project_id, created_at,
      project:projects!saved_items_project_id_fkey(
        id, slug, name, price_from, currency,
        handover_quarter, availability,
        developer:developers(name),
        area:areas(name)
      )
    `)
    .is('unit_id', null)
    .order('created_at', { ascending: false })

  type SavedRow = {
    id: string
    project_id: string
    created_at: string
    project: Rel<{
      id: string; slug: string; name: string
      price_from: number | null; currency: string | null
      handover_quarter: string | null; availability: string | null
      developer: Rel<{ name: string }>
      area: Rel<{ name: string }>
    }>
  }

  const rows = (data ?? []) as unknown as SavedRow[]

  const nameOf = (rel: { name: string } | { name: string }[] | null | undefined): string =>
    !rel ? '' : Array.isArray(rel) ? (rel[0]?.name ?? '') : rel.name

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Saved</h1>
        {rows.length > 0 && (
          <span className="text-[14px] text-text-tertiary tabular-nums">
            {rows.length} project{rows.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="mt-12 rounded-2xl bg-surface-2 p-8 text-center">
          <p className="text-[17px] font-semibold">Nothing saved yet</p>
          <p className="mt-2 text-[15px] text-text-secondary">
            Tap the bookmark on any project to save it here.
          </p>
          <Link href="/app/explore"
            className="mt-4 inline-block text-[15px] font-medium text-accent hover:opacity-80 transition-opacity">
            Explore projects
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => {
            const p = one(row.project)
            if (!p) return null
            const avail = p.availability ?? 'available'
            return (
              <div key={row.id} className="group relative rounded-2xl bg-surface-2 shadow-1 flex flex-col overflow-hidden">
                {/* Unsave button */}
                <form action={unsaveProject}
                  className="absolute top-3 right-3 z-10">
                  <input type="hidden" name="project_id" value={p.id} />
                  <input type="hidden" name="slug"       value={p.slug} />
                  <button type="submit"
                    title="Remove from saved"
                    className="w-8 h-8 flex items-center justify-center rounded-full
                      bg-surface-1/80 backdrop-blur-sm hover:bg-danger/10 hover:text-danger
                      text-text-secondary transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                    </svg>
                  </button>
                </form>

                <Link href={`/app/explore/${p.slug}`} className="flex flex-col flex-1 p-6 hover:bg-surface-3 transition-colors">
                  <div className="flex items-start justify-between gap-2 pr-8">
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
                  <p className="mt-1 text-[14px] text-text-secondary">
                    Handover {p.handover_quarter ?? 'TBC'}
                  </p>
                  <p className="mt-auto pt-4 text-[15px]">
                    From <span className="font-semibold tabular-nums">
                      {p.currency ?? 'AED'} {Number(p.price_from ?? 0).toLocaleString()}
                    </span>
                  </p>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
