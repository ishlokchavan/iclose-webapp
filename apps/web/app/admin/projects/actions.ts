'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ProjectStatus = 'draft' | 'published' | 'archived'

// Mirrors the staff roles checked in apps/web/app/admin/layout.tsx.
const STAFF_ROLES = ['rm', 'ops_manager', 'finance', 'super_admin'] as const

// Verify the caller is staff at the app layer. RLS (projects_staff_write) is the
// primary backstop at the DB — this is the friendly first line, not the only one.
async function requireStaff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: roles } = await supabase
    .from('profile_roles')
    .select('role')
    .eq('profile_id', user.id)
  const isStaff = (roles ?? []).some((r: { role: string }) =>
    (STAFF_ROLES as readonly string[]).includes(r.role))
  if (!isStaff) throw new Error('Forbidden: staff role required')
  return { supabase, user }
}

const ACTION_LABEL: Record<ProjectStatus, string> = {
  published: 'project.publish',
  draft: 'project.unpublish',
  archived: 'project.archive',
}

// Single transition path for every status change so auditing and revalidation
// stay consistent. Runs as the signed-in user → RLS enforces the write.
async function transition(id: string, to: ProjectStatus) {
  if (!id) throw new Error('Missing project id')
  const { supabase, user } = await requireStaff()

  const { data: before, error: readErr } = await supabase
    .from('projects')
    .select('id, name, status, published_at')
    .eq('id', id)
    .maybeSingle()
  if (readErr) throw new Error(readErr.message)
  if (!before) throw new Error('Project not found')

  const patch: Record<string, unknown> = { status: to }
  // Stamp published_at on first publish; preserve the original date thereafter.
  if (to === 'published' && !before.published_at) {
    patch.published_at = new Date().toISOString()
  }

  const { data: after, error: writeErr } = await supabase
    .from('projects')
    .update(patch)
    .eq('id', id)
    .select('id, status')
    .single()
  if (writeErr) throw new Error(writeErr.message)

  // Append an audit trail entry (RLS allows authenticated insert; append-only table).
  await supabase.from('audit_log').insert({
    actor_id: user.id,
    action: ACTION_LABEL[to],
    entity_type: 'project',
    entity_id: id,
    before: { status: before.status },
    after: { status: after.status },
  })

  revalidatePath('/admin/projects')
  revalidatePath('/app/explore')
}

export async function publishProject(formData: FormData) {
  await transition(String(formData.get('id') ?? ''), 'published')
}

export async function unpublishProject(formData: FormData) {
  await transition(String(formData.get('id') ?? ''), 'draft')
}

export async function archiveProject(formData: FormData) {
  await transition(String(formData.get('id') ?? ''), 'archived')
}
