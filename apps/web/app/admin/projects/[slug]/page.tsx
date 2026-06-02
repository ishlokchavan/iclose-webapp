import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { YouTubeEmbed } from '@/components/ui/youtube-embed'
import { setHeroVideo } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdminProjectSettings({ params }: { params: { slug: string } }) {
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('id, slug, name, status')
    .eq('slug', params.slug)
    .is('deleted_at', null)
    .maybeSingle()
  if (!project) notFound()

  // Fetch current hero video
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

  return (
    <div className="max-w-[720px]">
      <Link href="/admin/projects"
        className="inline-flex items-center gap-1 text-[14px] text-text-secondary hover:text-text mb-6 -ml-1">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        Projects
      </Link>

      <h1 className="text-[28px] font-semibold tracking-[-0.02em]">{project.name}</h1>
      <p className="mt-1 text-[14px] text-text-tertiary">
        /{project.slug} · <span className="capitalize">{project.status}</span>
      </p>

      {/* Hero video */}
      <section className="mt-8 pt-8 border-t border-separator">
        <h2 className="text-[20px] font-semibold mb-1">Hero video</h2>
        <p className="text-[14px] text-text-secondary mb-6">
          Shown at the top of the project detail page. Use an unlisted YouTube video for privacy.
        </p>

        {currentVideoId && (
          <div className="mb-6">
            <YouTubeEmbed videoId={currentVideoId} title={project.name} />
          </div>
        )}

        <form action={setHeroVideo} className="flex flex-col gap-3">
          <input type="hidden" name="slug" value={project.slug} />
          <input
            type="text"
            name="video_url"
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
