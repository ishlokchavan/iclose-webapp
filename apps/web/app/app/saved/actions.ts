'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function saveProject(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const projectId = String(formData.get('project_id') ?? '').trim()
  const slug      = String(formData.get('slug')       ?? '').trim()
  if (!projectId) return

  // Check before insert — unique index doesn't cover null unit_id in Postgres
  const { data: existing } = await supabase
    .from('saved_items')
    .select('id')
    .eq('buyer_id',  user.id)
    .eq('project_id', projectId)
    .is('unit_id', null)
    .maybeSingle()

  if (!existing) {
    await supabase.from('saved_items').insert({ buyer_id: user.id, project_id: projectId })
  }

  revalidatePath('/app/saved')
  if (slug) revalidatePath(`/app/explore/${slug}`)
}

export async function unsaveProject(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const projectId = String(formData.get('project_id') ?? '').trim()
  const slug      = String(formData.get('slug')       ?? '').trim()
  if (!projectId) return

  await supabase
    .from('saved_items')
    .delete()
    .eq('buyer_id',   user.id)
    .eq('project_id', projectId)
    .is('unit_id', null)

  revalidatePath('/app/saved')
  if (slug) revalidatePath(`/app/explore/${slug}`)
}
