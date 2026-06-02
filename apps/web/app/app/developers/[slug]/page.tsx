import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProjectGrid, type ProjectCardData } from '@/components/project-card'

export const dynamic = 'force-dynamic'

export default async function DeveloperPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()

  const { data: developer } = await supabase
    .from('developers')
    .select('id, name, description, website')
    .eq('slug', params.slug)
    .maybeSingle()
  if (!developer) notFound()

  const { data: projectsData } = await supabase
    .from('projects')
    .select('id, slug, name, price_from, currency, handover_quarter, availability, area:areas(name)')
    .eq('status', 'published')
    .eq('developer_id', developer.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const projects = (projectsData ?? []) as unknown as ProjectCardData[]

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

      <p className="text-[13px] font-medium text-text-tertiary uppercase tracking-wide">Developer</p>
      <h1 className="mt-1 text-[32px] font-semibold tracking-[-0.02em]">{developer.name}</h1>
      {developer.description && (
        <p className="mt-3 max-w-[640px] text-[15px] text-text-secondary leading-relaxed">{developer.description}</p>
      )}
      {developer.website && (
        <a href={developer.website} target="_blank" rel="noopener noreferrer"
          className="mt-3 inline-block text-[14px] text-accent hover:opacity-80 transition-opacity">
          Visit website ↗
        </a>
      )}

      <p className="mt-6 text-[13px] text-text-tertiary tabular-nums">
        {projects.length} {projects.length === 1 ? 'project' : 'projects'}
      </p>

      {projects.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-surface-2 p-8 text-center">
          <p className="text-[15px] text-text-secondary">No published projects from {developer.name} yet.</p>
        </div>
      ) : (
        <div className="mt-4">
          <ProjectGrid projects={projects} />
        </div>
      )}
    </div>
  )
}
