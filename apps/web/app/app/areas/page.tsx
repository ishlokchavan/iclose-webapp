import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { coverUrl } from '@/components/project-card'

export const dynamic = 'force-dynamic'

type MediaRow = { role: string; sort_order: number | null; media: { storage_path: string | null } | { storage_path: string | null }[] | null }
type ProjRow  = { id: string; area_id: string | null; project_media: MediaRow[] }

function Placeholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-surface-3">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary opacity-60">
        <path d="M3 21V8l9-5 9 5v13" /><path d="M9 21v-7h6v7" />
      </svg>
    </div>
  )
}

export default async function AreasIndex() {
  const supabase = await createClient()

  const [{ data: areasData }, { data: projData }] = await Promise.all([
    supabase.from('areas').select('id, slug, name, city').order('name', { ascending: true }),
    supabase.from('projects')
      .select('id, area_id, project_media(role, sort_order, media:media(storage_path))')
      .eq('status', 'published').is('deleted_at', null),
  ])

  const areas = (areasData ?? []) as { id: string; slug: string; name: string; city: string | null }[]
  const projects = (projData ?? []) as unknown as ProjRow[]

  const byArea = new Map<string, ProjRow[]>()
  for (const p of projects) {
    if (!p.area_id) continue
    const list = byArea.get(p.area_id) ?? []
    list.push(p); byArea.set(p.area_id, list)
  }

  // Show areas that have at least one published project, most projects first.
  const cards = areas
    .map((a) => {
      const ps = byArea.get(a.id) ?? []
      const cover = ps.map((p) => coverUrl(p.project_media)).find(Boolean) ?? null
      return { ...a, count: ps.length, cover }
    })
    .filter((a) => a.count > 0)
    .sort((a, b) => b.count - a.count)

  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Areas</h1>
      <p className="mt-2 text-[15px] text-text-secondary">Browse Dubai off-plan by community.</p>

      {cards.length === 0 ? (
        <div className="mt-12 rounded-2xl bg-surface-2 p-8 text-center">
          <p className="text-[15px] text-text-secondary">No published projects yet.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((a) => (
            <Link key={a.id} href={`/app/areas/${a.slug}`}
              className="group rounded-2xl bg-surface-2 shadow-1 overflow-hidden hover:bg-surface-3 transition-colors">
              <div className="relative aspect-[16/10]">
                {a.cover ? (
                  <Image src={a.cover} alt={a.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                ) : <Placeholder />}
              </div>
              <div className="p-5">
                <h2 className="text-[17px] font-semibold group-hover:text-accent transition-colors">{a.name}</h2>
                <p className="mt-0.5 text-[13px] text-text-tertiary">
                  {a.city ?? 'Dubai'} · {a.count} {a.count === 1 ? 'project' : 'projects'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
