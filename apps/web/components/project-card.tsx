import Link from 'next/link'

const AVAIL_STYLE: Record<string, string> = {
  available:   'bg-accent-soft text-accent',
  limited:     'bg-surface-3 text-warning',
  sold_out:    'bg-surface-3 text-danger',
  coming_soon: 'bg-surface-3 text-text-secondary',
}
const AVAIL_LABEL: Record<string, string> = {
  available: 'Available', limited: 'Limited', sold_out: 'Sold out', coming_soon: 'Coming soon',
}

type Rel = { name: string } | { name: string }[] | null | undefined
const nameOf = (rel: Rel): string =>
  !rel ? '' : Array.isArray(rel) ? (rel[0]?.name ?? '') : rel.name

export type ProjectCardData = {
  id: string
  slug: string
  name: string
  price_from: number | null
  currency: string | null
  handover_quarter: string | null
  availability: string | null
  developer?: Rel
  area?: Rel
}

export function ProjectCard({ p }: { p: ProjectCardData }) {
  const avail = p.availability ?? 'available'
  const meta = [nameOf(p.developer), nameOf(p.area)].filter(Boolean).join(' · ')
  return (
    <Link href={`/app/explore/${p.slug}`}
      className="group rounded-2xl bg-surface-2 p-6 shadow-1 hover:bg-surface-3 transition-colors flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-[17px] font-semibold group-hover:text-accent transition-colors">{p.name}</h2>
        <span className={`shrink-0 inline-block rounded-pill text-[11px] font-semibold px-2 py-[2px] ${
          AVAIL_STYLE[avail] ?? 'bg-surface-3 text-text-secondary'
        }`}>
          {AVAIL_LABEL[avail] ?? avail}
        </span>
      </div>
      {meta && <p className="mt-1 text-[13px] text-text-tertiary">{meta}</p>}
      <p className="mt-1 text-[14px] text-text-secondary">Handover {p.handover_quarter ?? 'TBC'}</p>
      <p className="mt-auto pt-4 text-[15px]">
        From <span className="font-semibold tabular-nums">
          {p.currency ?? 'AED'} {Number(p.price_from ?? 0).toLocaleString()}
        </span>
      </p>
    </Link>
  )
}

export function ProjectGrid({ projects }: { projects: ProjectCardData[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => <ProjectCard key={p.id} p={p} />)}
    </div>
  )
}
