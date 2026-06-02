import Link from 'next/link'
import Image from 'next/image'

const AVAIL_STYLE: Record<string, string> = {
  available:   'bg-accent-soft text-accent',
  limited:     'bg-surface-3 text-warning',
  sold_out:    'bg-surface-3 text-danger',
  coming_soon: 'bg-surface-3 text-text-secondary',
}
const AVAIL_LABEL: Record<string, string> = {
  available: 'Available', limited: 'Limited', sold_out: 'Sold out', coming_soon: 'Coming soon',
}

type NameRel = { name: string } | { name: string }[] | null | undefined
const nameOf = (rel: NameRel): string =>
  !rel ? '' : Array.isArray(rel) ? (rel[0]?.name ?? '') : rel.name

// Shared media-row shape from a project_media(role, sort_order, media:media(storage_path)) embed.
type MediaRow = {
  role: string
  sort_order: number | null
  media: { storage_path: string | null } | { storage_path: string | null }[] | null
}

// First gallery image (lowest sort_order) → public URL, or null.
export function coverUrl(media: MediaRow[] | null | undefined): string | null {
  const first = (media ?? [])
    .filter((m) => m.role === 'gallery')
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]
  if (!first) return null
  const m = Array.isArray(first.media) ? first.media[0] : first.media
  const path = m?.storage_path
  if (!path) return null
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/project-images/${path}`
}

export type ProjectCardData = {
  id: string
  slug: string
  name: string
  price_from: number | null
  currency: string | null
  handover_quarter: string | null
  availability: string | null
  coverUrl?: string | null
  developer?: NameRel
  area?: NameRel
}

function CoverPlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-surface-3">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary opacity-60">
        <path d="M3 21V8l9-5 9 5v13" />
        <path d="M9 21v-7h6v7" />
      </svg>
    </div>
  )
}

export function ProjectCard({ p }: { p: ProjectCardData }) {
  const avail = p.availability ?? 'available'
  const meta = [nameOf(p.developer), nameOf(p.area)].filter(Boolean).join(' · ')
  return (
    <Link href={`/app/explore/${p.slug}`}
      className="group rounded-2xl bg-surface-2 shadow-1 hover:bg-surface-3 transition-colors flex flex-col overflow-hidden">
      <div className="relative aspect-[16/10]">
        {p.coverUrl ? (
          <Image
            src={p.coverUrl}
            alt={p.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <CoverPlaceholder />
        )}
        <span className={`absolute top-2.5 right-2.5 inline-block rounded-pill text-[11px] font-semibold px-2 py-[2px] ${
          AVAIL_STYLE[avail] ?? 'bg-surface-3 text-text-secondary'
        }`}>
          {AVAIL_LABEL[avail] ?? avail}
        </span>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h2 className="text-[17px] font-semibold group-hover:text-accent transition-colors">{p.name}</h2>
        {meta && <p className="mt-1 text-[13px] text-text-tertiary">{meta}</p>}
        <p className="mt-1 text-[14px] text-text-secondary">Handover {p.handover_quarter ?? 'TBC'}</p>
        <p className="mt-auto pt-4 text-[15px]">
          From <span className="font-semibold tabular-nums">
            {p.currency ?? 'AED'} {Number(p.price_from ?? 0).toLocaleString()}
          </span>
        </p>
      </div>
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
