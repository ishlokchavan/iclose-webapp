'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import { rmAssignmentNotification } from '@/lib/email/templates'

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

export async function assignLead(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: roles } = await supabase
    .from('profile_roles').select('role').eq('profile_id', user.id)
  const isStaff = (roles ?? []).some((r: { role: string }) =>
    (STAFF_ROLES as readonly string[]).includes(r.role))
  if (!isStaff) return

  const id     = String(formData.get('id')       ?? '').trim()
  const rawRm  = String(formData.get('assigned_rm') ?? '').trim()
  const rm     = rawRm || null
  if (!id) return

  // Assigning a previously-new lead moves it to 'assigned'; unassigning leaves status alone.
  const patch: Record<string, unknown> = { assigned_rm: rm }
  if (rm) {
    const { data: lead } = await supabase.from('leads').select('status').eq('id', id).maybeSingle()
    if (lead?.status === 'new') patch.status = 'assigned'
  }

  await supabase.from('leads').update(patch).eq('id', id)

  await supabase.from('audit_log').insert({
    actor_id:    user.id,
    action:      rm ? 'lead.assign' : 'lead.unassign',
    entity_type: 'lead',
    entity_id:   id,
    after:       { assigned_rm: rm },
  })

  // Notify the RM by email when they are assigned
  if (rm) {
    void (async () => {
      try {
        const [{ data: rmProfile }, { data: leadFull }] = await Promise.all([
          supabase.from('profiles').select('full_name, email').eq('id', rm).maybeSingle(),
          supabase.from('leads')
            .select(`
              unit_type, sla_first_response_due,
              buyer:profiles!leads_buyer_id_fkey(full_name, email, phone),
              project:projects(name)
            `)
            .eq('id', id)
            .maybeSingle(),
        ])

        if (!rmProfile?.email || !leadFull) return

        type Rel<T> = T | T[] | null
        const one = <T,>(r: Rel<T>): T | null =>
          !r ? null : Array.isArray(r) ? (r[0] ?? null) : r

        const buyer   = one((leadFull as any).buyer)
        const project = one((leadFull as any).project)

        await sendEmail({
          to:      { email: rmProfile.email, name: rmProfile.full_name ?? undefined },
          subject: `New lead: ${(buyer as any)?.full_name || (buyer as any)?.email || 'Buyer'} → ${(project as any)?.name ?? 'Project'}`,
          html:    rmAssignmentNotification({
            rmName:      rmProfile.full_name ?? '',
            buyerName:   (buyer as any)?.full_name ?? '',
            buyerEmail:  (buyer as any)?.email ?? '',
            buyerPhone:  (buyer as any)?.phone ?? null,
            projectName: (project as any)?.name ?? '—',
            unitType:    leadFull.unit_type ?? null,
            leadId:      id,
            slaDate:     leadFull.sla_first_response_due ?? null,
          }),
        })
      } catch (err) {
        console.error('[email] RM assignment notification failed', err)
      }
    })()
  }

  revalidatePath('/admin/leads')
}
