'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const STAFF_ROLES = ['rm', 'ops_manager', 'finance', 'super_admin'] as const

async function assertStaff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: roles } = await supabase
    .from('profile_roles').select('role').eq('profile_id', user.id)
  const ok = (roles ?? []).some((r: { role: string }) =>
    (STAFF_ROLES as readonly string[]).includes(r.role))
  return ok ? { supabase, user } : null
}

export async function addActivity(formData: FormData) {
  const ctx = await assertStaff()
  if (!ctx) return

  const leadId = String(formData.get('lead_id') ?? '').trim()
  const type   = String(formData.get('type')    ?? '').trim()
  const body   = String(formData.get('body')    ?? '').trim()
  if (!leadId || !type || !body) return

  await ctx.supabase.from('lead_activities').insert({
    lead_id:  leadId,
    actor_id: ctx.user.id,
    type,
    body,
  })

  // Mark first_responded_at on the lead if not yet set
  await ctx.supabase
    .from('leads')
    .update({ first_responded_at: new Date().toISOString() })
    .eq('id', leadId)
    .is('first_responded_at', null)

  revalidatePath(`/admin/leads/${leadId}`)
}
