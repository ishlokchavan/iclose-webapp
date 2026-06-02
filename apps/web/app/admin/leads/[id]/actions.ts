'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { recordAudit } from '@/lib/audit'

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

// Convert a qualified lead into an off-plan transaction (status=reserved),
// mark the lead converted, and open the new transaction.
export async function convertLeadToTransaction(formData: FormData) {
  const ctx = await assertStaff()
  if (!ctx) return

  const leadId = String(formData.get('lead_id') ?? '').trim()
  if (!leadId) return

  const { data: lead } = await ctx.supabase
    .from('leads')
    .select('id, buyer_id, project_id, unit_type')
    .eq('id', leadId)
    .maybeSingle()
  if (!lead) return

  // Reuse an existing transaction for this lead if one already exists.
  const { data: existing } = await ctx.supabase
    .from('transactions').select('id').eq('lead_id', leadId).maybeSingle()
  if (existing) redirect(`/admin/transactions/${existing.id}`)

  // Prefill location + developer from the project the buyer enquired about.
  const { data: project } = lead.project_id
    ? await ctx.supabase.from('projects').select('area_id, developer_id').eq('id', lead.project_id).maybeSingle()
    : { data: null }

  const { data: txn } = await ctx.supabase
    .from('transactions')
    .insert({
      lead_id:         lead.id,
      buyer_id:        lead.buyer_id,
      project_id:      lead.project_id,
      area_id:         project?.area_id ?? null,
      developer_id:    project?.developer_id ?? null,
      type:            'offplan_primary',
      status:          'reserved',
      cashback_status: 'purchased',
      currency:        'AED',
    })
    .select('id')
    .single()

  if (!txn) return

  await ctx.supabase.from('leads').update({ status: 'converted' }).eq('id', leadId)

  await recordAudit(ctx.supabase, {
    actorId: ctx.user.id, action: 'txn.create', entityType: 'transaction', entityId: txn.id,
    after: { lead_id: leadId, cashback_status: 'purchased' },
  })

  revalidatePath(`/admin/leads/${leadId}`)
  redirect(`/admin/transactions/${txn.id}`)
}
