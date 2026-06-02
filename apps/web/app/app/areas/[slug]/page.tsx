import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProjectGrid, coverUrl, type ProjectCardData } from '@/components/project-card'

export const dynamic = 'force-dynamic'

export default async function AreaPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()

  const { data: area } = await supabase
    .from('areas')
    .select('id, name, city, description')
    .eq('slug', params.slug)
    .maybeSingle()
  if (!area) notFound()

  const { data: projectsData } = await supabase
    .from('projects')
    .select('id, slug, name, price_from, currency, handover_quarter, availability, developer:developers(name), project_media(role, sort_order, media:media(storage_path))')
    .eq('status', 'published')
    .eq('area_id', area.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const projects = ((projectsData ?? []) as any[]).map((p) => ({
    ...p, coverUrl: coverUrl(p.project_media),
  })) as ProjectCardData[]

  return (
    <div>
      <Link href="/app/explore"
        className="inline-flex items-center gap-1 text-[14px] text-text-secondary hover:text-text mb-6 -ml-1">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        Explore
      </Link>

      <p className="text-[13px] font-medium text-text-tertiary uppercase tracking-wide">{area.city ?? 'Dubai'}</p>
      <h1 className="mt-1 text-[32px] font-semibold tracking-[-0.02em]">{area.name}</h1>
      {area.description && (
        <p className="mt-3 max-w-[640px] text-[15px] text-text-secondary leading-relaxed">{area.description}</p>
      )}

      <p className="mt-6 text-[13px] text-text-tertiary tabular-nums">
        {projects.length} {projects.length === 1 ? 'project' : 'projects'}
      </p>

      {projects.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-surface-2 p-8 text-center">
          <p className="text-[15px] text-text-secondary">No published projects in {area.name} yet.</p>
        </div>
      ) : (
        <div className="mt-4">
          <ProjectGrid projects={projects} />
        </div>
      )}
    </div>
  )
}
