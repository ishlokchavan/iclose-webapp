import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ExploreFilters } from './explore-filters'
import { ProjectGrid, coverUrl, type ProjectCardData } from '@/components/project-card'

export const dynamic = 'force-dynamic'

type SearchParams = { q?: string; area?: string; avail?: string }

export default async function Explore({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()

  const q     = (searchParams.q     ?? '').trim()
  const area  = (searchParams.area  ?? '').trim()
  const avail = (searchParams.avail ?? '').trim()

  let query = supabase
    .from('projects')
    .select('id, slug, name, price_from, currency, handover_quarter, availability, area_id, developer:developers(name), area:areas(name), project_media(role, sort_order, media:media(storage_path))')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (q)     query = query.ilike('name', `%${q}%`)
  if (area)  query = query.eq('area_id', area)
  if (avail) query = query.eq('availability', avail)

  const { data: projects, error } = await query

  // Fetch areas for the filter bar
  const { data: allAreas } = await supabase
    .from('areas')
    .select('id, name')
    .order('name', { ascending: true })

  const areas = (allAreas ?? []) as { id: string; name: string }[]

  const list = ((projects ?? []) as any[]).map((p) => ({
    ...p, coverUrl: coverUrl(p.project_media),
  })) as ProjectCardData[]
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

      {list.length > 0 && (
        <div className="mt-6">
          <ProjectGrid projects={list} />
        </div>
      )}
    </div>
  )
}
