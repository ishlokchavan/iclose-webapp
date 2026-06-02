import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { publishProject, unpublishProject, archiveProject } from './actions'

export const dynamic = 'force-dynamic'

type Row = {
  id: string
  slug: string
  name: string
  status: 'draft' | 'published' | 'archived'
  availability: string | null
  price_from: number | null
  currency: string | null
  handover_quarter: string | null
  published_at: string | null
  developer: { name: string } | { name: string }[] | null
  area: { name: string } | { name: string }[] | null
}

// Embedded relations come back as an object for a to-one FK, but type as a union; normalise.
function nameOf(rel: Row['developer']): string {
  if (!rel) return '—'
  return Array.isArray(rel) ? (rel[0]?.name ?? '—') : rel.name
}

const STATUS_STYLE: Record<Row['status'], string> = {
  published: 'bg-accent-soft text-accent',
  draft: 'bg-surface-3 text-text-secondary',
  archived: 'bg-surface-3 text-text-tertiary',
}

export default async function AdminProjects() {
  const supabase = await createClient()
  // Staff RLS (projects_staff_read_all) returns every project regardless of status.
  const { data, error } = await supabase
    .from('projects')
    .select(
      'id, slug, name, status, availability, price_from, currency, handover_quarter, published_at, developer:developers(name), area:areas(name)'
    )
    .is('deleted_at', null)
    .order('status', { ascending: true })
    .order('name', { ascending: true })

  const projects = (data ?? []) as Row[]
  const counts = projects.reduce(
    (acc, p) => ({ ...acc, [p.status]: (acc[p.status] ?? 0) + 1 }),
    {} as Record<string, number>
  )

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Projects</h1>
          <p className="mt-2 text-[15px] text-text-secondary">
            Publish a project to make it visible on Explore. Unpublish to pull it back to draft; archive to retire it.
          </p>
        </div>
        <Link href="/admin/projects/new" className="shrink-0">
          <Button type="button" size="sm">New project</Button>
        </Link>
      </div>

      <p className="mt-3 text-[13px] text-text-tertiary tabular-nums">
        {counts['published'] ?? 0} published · {counts['draft'] ?? 0} draft · {counts['archived'] ?? 0} archived
      </p>

      {error && (
        <p className="mt-8 text-[15px] text-danger">Could not load projects: {error.message}</p>
      )}

      {!error && projects.length === 0 && (
        <div className="mt-12 rounded-2xl bg-surface-2 p-8 text-center">
          <p className="text-[17px] font-semibold">No projects yet</p>
          <p className="mt-2 text-[15px] text-text-secondary">
            Seed the catalog (developers, areas, projects) and they will appear here for publishing.
          </p>
        </div>
      )}

      <div className="mt-8 overflow-hidden rounded-2xl border border-separator">
        {projects.map((p, i) => (
          <div
            key={p.id}
            className={`flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between ${
              i > 0 ? 'border-t border-separator' : ''
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h2 className="text-[17px] font-semibold truncate">{p.name}</h2>
                <span
                  className={`inline-block shrink-0 rounded-pill px-3 py-1 text-[12px] font-semibold ${STATUS_STYLE[p.status]}`}
                >
                  {p.status}
                </span>
              </div>
              <p className="mt-1 text-[13px] text-text-secondary">
                {nameOf(p.developer)} · {nameOf(p.area)} · Handover {p.handover_quarter ?? 'TBC'}
              </p>
              <p className="mt-1 text-[13px] text-text-tertiary tabular-nums">
                From {p.currency ?? 'AED'} {Number(p.price_from ?? 0).toLocaleString()} · {p.availability ?? '—'}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link href={`/admin/projects/${p.slug}`}>
                <Button type="button" size="sm" variant="secondary">Settings</Button>
              </Link>
              {p.status !== 'published' && (
                <form action={publishProject}>
                  <input type="hidden" name="id" value={p.id} />
                  <Button type="submit" size="sm">Publish</Button>
                </form>
              )}
              {p.status === 'published' && (
                <form action={unpublishProject}>
                  <input type="hidden" name="id" value={p.id} />
                  <Button type="submit" size="sm" variant="secondary">Unpublish</Button>
                </form>
              )}
              {p.status !== 'archived' && (
                <form action={archiveProject}>
                  <input type="hidden" name="id" value={p.id} />
                  <Button type="submit" size="sm" variant="plain">Archive</Button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
