import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProjectForm } from '../project-form'
import { createProject } from './actions'

export const dynamic = 'force-dynamic'

export default async function NewProject() {
  const supabase = await createClient()

  const [{ data: devs }, { data: areaRows }] = await Promise.all([
    supabase.from('developers').select('id, name').order('name'),
    supabase.from('areas').select('id, name').order('name'),
  ])

  const developers = (devs ?? []) as { id: string; name: string }[]
  const areas      = (areaRows ?? []) as { id: string; name: string }[]

  return (
    <div className="max-w-[720px]">
      <Link href="/admin/projects"
        className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text transition-colors mb-6">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
        Projects
      </Link>

      <h1 className="text-[28px] font-semibold tracking-[-0.02em]">New project</h1>
      <p className="mt-2 text-[15px] text-text-secondary mb-8">
        Created as <strong>draft</strong> — publish it from the projects list when ready.
      </p>

      <form action={createProject}>
        <ProjectForm developers={developers} areas={areas} slugLocked={false} />
      </form>
    </div>
  )
}
