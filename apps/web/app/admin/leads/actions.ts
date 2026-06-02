'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const STAFF_ROLES = ['rm', 'ops_manager', 'finance', 'super_admin'] as const

export async function updateLeadStatus(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: roles } = await supabase
    .from('profile_roles').select('role').eq('profile_id', user.id)
  const isStaff = (roles ?? []).some((r: { role: string }) =>
    (STAFF_ROLES as readonly string[]).includes(r.role))
  if (!isStaff) return

  const id     = String(formData.get('id')     ?? '').trim()
  const status = String(formData.get('status') ?? '').trim()
  if (!id || !status) return

  await supabase.from('leads').update({ status }).eq('id', id)

  await supabase.from('audit_log').insert({
    actor_id:    user.id,
    action:      'lead.status_change',
    entity_type: 'lead',
    entity_id:   id,
    after:       { status },
  })

  revalidatePath('/admin/leads')
}
