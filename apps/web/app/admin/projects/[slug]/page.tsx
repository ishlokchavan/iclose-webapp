import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { YouTubeEmbed } from '@/components/ui/youtube-embed'
import { ProjectForm } from '../project-form'
import { GalleryManager } from './gallery-manager'
import { setHeroVideo, updateProject } from './actions'

export const dynamic = 'force-dynamic'

type Rel<T> = T | T[] | null
const one = <T,>(rel: Rel<T>): T | null =>
  !rel ? null : Array.isArray(rel) ? (rel[0] ?? null) : rel

export default async function AdminProjectSettings({ params }: { params: { slug: string } }) {
  const supabase = await createClient()

  const { data: projectRaw } = await supabase
    .from('projects')
    .select(`
      id, slug, name, status, description,
      handover_quarter, price_from, price_to, currency,
      availability, est_yield_pct,
      commission_pct, cashback_payout_pct, cashback_floor,
      developer:developers(id, name),
      area:areas(id, name)
    `)
    .eq('slug', params.slug)
    .is('deleted_at', null)
    .maybeSingle()
  if (!projectRaw) notFound()

  type Project = typeof projectRaw & {
    developer: Rel<{ id: string; name: string }>
    area: Rel<{ id: string; name: string }>
  }
  const project = projectRaw as unknown as Project
  const devRel  = one(project.developer)
  const areaRel = one(project.area)

  // Hero video
  const { data: heroRows } = await supabase
    .from('project_media')
    .select('media:media(external_id, title)')
    .eq('project_id', project.id)
    .eq('role', 'hero_video')
    .limit(1)

  type HeroRel = { external_id: string | null; title: string | null }
  type HeroRow = { media: HeroRel | HeroRel[] | null }
  const heroRow = ((heroRows ?? []) as HeroRow[])[0] ?? null
  const heroMedia = heroRow
    ? (Array.isArray(heroRow.media) ? heroRow.media[0] : heroRow.media)
    : null
  const currentVideoId = heroMedia?.external_id ?? null

  // Gallery images
  const { data: galleryRows } = await supabase
    .from('project_media')
    .select('media:media(id, storage_path)')
    .eq('project_id', project.id)
    .eq('role', 'gallery')
    .order('sort_order', { ascending: true })

  type GalleryMedia = { id: string; storage_path: string | null }
  const galleryImages = ((galleryRows ?? []) as { media: GalleryMedia | GalleryMedia[] | null }[])
    .map((r) => (Array.isArray(r.media) ? r.media[0] : r.media))
    .filter((m): m is GalleryMedia => !!m && !!m.storage_path)
    .map((m) => ({
      mediaId: m.id,
      url: supabase.storage.from('project-images').getPublicUrl(m.storage_path!).data.publicUrl,
    }))

  // Lookups for form dropdowns
  const [{ data: devs }, { data: areaRows }] = await Promise.all([
    supabase.from('developers').select('id, name').order('name'),
    supabase.from('areas').select('id, name').order('name'),
  ])

  const developers = (devs ?? []) as { id: string; name: string }[]
  const areas      = (areaRows ?? []) as { id: string; name: string }[]

  const slugLocked = project.status === 'published'

  return (
    <div className="max-w-[720px]">
      <Link href="/admin/projects"
        className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text transition-colors mb-6">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
        Projects
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em]">{project.name}</h1>
          <p className="mt-1 text-[13px] text-text-tertiary">/{project.slug} · <span className="capitalize">{project.status}</span></p>
        </div>
        {project.status === 'published' && (
          <Link href={`/app/explore/${project.slug}`} target="_blank"
            className="text-[13px] text-accent hover:opacity-80 transition-opacity shrink-0 mt-1">
            View live ↗
          </Link>
        )}
      </div>

      {/* Project details edit form */}
      <section className="mt-8 pt-8 border-t border-separator">
        <h2 className="text-[20px] font-semibold mb-6">Project details</h2>
        <form action={updateProject}>
          <input type="hidden" name="current_slug" value={project.slug} />
          <ProjectForm
            developers={developers}
            areas={areas}
            slugLocked={slugLocked}
            defaults={{
              name:               project.name,
              slug:               project.slug,
              developer_id:       devRel?.id ?? '',
              area_id:            areaRel?.id ?? '',
              description:        project.description ?? '',
              handover_quarter:   project.handover_quarter ?? '',
              price_from:         project.price_from != null ? String(project.price_from) : '',
              price_to:           project.price_to   != null ? String(project.price_to)   : '',
              currency:           project.currency   ?? 'AED',
              availability:       project.availability ?? 'available',
              est_yield_pct:      project.est_yield_pct      != null ? String(project.est_yield_pct)      : '',
              commission_pct:     project.commission_pct     != null ? String(project.commission_pct)     : '',
              cashback_payout_pct: project.cashback_payout_pct != null ? String(project.cashback_payout_pct) : '',
              cashback_floor:     project.cashback_floor     != null ? String(project.cashback_floor)     : '0',
            }}
          />
        </form>
      </section>

      {/* Gallery */}
      <section className="mt-10 pt-8 border-t border-separator">
        <h2 className="text-[20px] font-semibold mb-1">Photos</h2>
        <p className="text-[14px] text-text-secondary mb-6">
          Shown as a gallery on the project detail page. The first photo is used as the cover.
        </p>
        <GalleryManager slug={project.slug} images={galleryImages} />
      </section>

      {/* Hero video */}
      <section className="mt-10 pt-8 border-t border-separator">
        <h2 className="text-[20px] font-semibold mb-1">Hero video</h2>
        <p className="text-[14px] text-text-secondary mb-6">
          Shown at the top of the project detail page. Use an unlisted YouTube video.
        </p>

        {currentVideoId && (
          <div className="mb-6">
            <YouTubeEmbed videoId={currentVideoId} title={project.name} />
          </div>
        )}

        <form action={setHeroVideo} className="flex flex-col gap-3">
          <input type="hidden" name="slug" value={project.slug} />
          <input
            type="text" name="video_url"
            defaultValue={currentVideoId ? `https://youtu.be/${currentVideoId}` : ''}
            placeholder="YouTube URL or video ID — leave empty to remove"
            className="w-full h-11 px-4 rounded-lg bg-surface-2 text-[15px] outline-none
              focus:ring-2 focus:ring-accent/40 placeholder:text-text-tertiary"
          />
          <div>
            <Button type="submit" size="sm" variant="secondary">
              {currentVideoId ? 'Update video' : 'Set video'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
