'use client'

import { useFormStatus } from 'react-dom'
import { saveProject, unsaveProject } from '@/app/app/saved/actions'

function BookmarkIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
    </svg>
  )
}

function Btn({ saved }: { saved: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      title={saved ? 'Remove from saved' : 'Save project'}
      className={`flex items-center gap-1.5 h-9 px-3 rounded-lg text-[13px] font-medium
        transition-colors disabled:opacity-50
        ${saved
          ? 'bg-accent-soft text-accent hover:bg-accent/20'
          : 'bg-surface-2 text-text-secondary hover:bg-surface-3'
        }`}>
      <BookmarkIcon filled={saved} />
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}

export function SaveButton({
  projectId, slug, saved,
}: {
  projectId: string
  slug: string
  saved: boolean
}) {
  const action = saved ? unsaveProject : saveProject
  return (
    <form action={action}>
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="slug"       value={slug} />
      <Btn saved={saved} />
    </form>
  )
}
