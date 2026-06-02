'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { recordAudit } from '@/lib/audit'
import { ALL_TXN_STATUSES } from '@/lib/txn'

const STAFF_ROLES = ['rm', 'ops_manager', 'finance', 'super_admin'] as const

async function requireStaff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: roles } = await supabase
    .from('profile_roles').select('role').eq('profile_id', user.id)
  const ok = (roles ?? []).some((r: { role: string }) => (STAFF_ROLES as readonly string[]).includes(r.role))
  return ok ? { supabase, user } : null
}

const num  = (v: FormDataEntryValue | null) => {
  const n = parseFloat(String(v ?? '')); return isNaN(n) ? null : n
}
const date = (v: FormDataEntryValue | null) => {
  const s = String(v ?? '').trim(); return s || null
}

export async function updateTransaction(formData: FormData) {
  const ctx = await requireStaff()
  if (!ctx) return
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return

  const patch = {
    unit_price:                 num(formData.get('unit_price')),
    currency:                   String(formData.get('currency') ?? 'AED').trim(),
    developer_registration_ref: String(formData.get('developer_registration_ref') ?? '').trim() || null,
    booked_at:                  date(formData.get('booked_at')),
    spa_signed_at:              date(formData.get('spa_signed_at')),
    oqood_registered_at:        date(formData.get('oqood_registered_at')),
    handover_estimate:          date(formData.get('handover_estimate')),
    updated_at:                 new Date().toISOString(),
  }
  await ctx.supabase.from('transactions').update(patch).eq('id', id)
  revalidatePath(`/admin/transactions/${id}`)
}

export async function updateTransactionStatus(formData: FormData) {
  const ctx = await requireStaff()
  if (!ctx) return
  const id     = String(formData.get('id') ?? '').trim()
  const status = String(formData.get('status') ?? '').trim()
  if (!id || !ALL_TXN_STATUSES.includes(status as never)) return

  const { data: before } = await ctx.supabase
    .from('transactions').select('status').eq('id', id).maybeSingle()

  await ctx.supabase.from('transactions')
    .update({ status, updated_at: new Date().toISOString() }).eq('id', id)

  await recordAudit(ctx.supabase, {
    actorId: ctx.user.id, action: 'txn.status_change', entityType: 'transaction', entityId: id,
    before: { status: before?.status ?? null }, after: { status },
  })

  revalidatePath(`/admin/transactions/${id}`)
  revalidatePath('/admin/transactions')
}

// ── Milestones ──────────────────────────────────────────────────────────────
export async function addMilestone(formData: FormData) {
  const ctx = await requireStaff()
  if (!ctx) return
  const txnId = String(formData.get('transaction_id') ?? '').trim()
  const label = String(formData.get('label') ?? '').trim()
  if (!txnId || !label) return

  const { data: last } = await ctx.supabase
    .from('transaction_milestones').select('sort_order')
    .eq('transaction_id', txnId).order('sort_order', { ascending: false }).limit(1)
  const sort = (last?.[0]?.sort_order ?? -1) + 1

  await ctx.supabase.from('transaction_milestones').insert({
    transaction_id: txnId,
    kind:           String(formData.get('kind') ?? 'construction').trim() || 'construction',
    label,
    status:         'pending',
    progress_pct:   num(formData.get('progress_pct')),
    due_date:       date(formData.get('due_date')),
    sort_order:     sort,
  })
  revalidatePath(`/admin/transactions/${txnId}`)
}

export async function toggleMilestone(formData: FormData) {
  const ctx = await requireStaff()
  if (!ctx) return
  const id    = String(formData.get('id') ?? '').trim()
  const txnId = String(formData.get('transaction_id') ?? '').trim()
  const done  = String(formData.get('done') ?? '') === '1'
  if (!id) return

  await ctx.supabase.from('transaction_milestones').update({
    status:       done ? 'completed' : 'pending',
    completed_at: done ? new Date().toISOString() : null,
    progress_pct: done ? 100 : null,
    updated_at:   new Date().toISOString(),
  }).eq('id', id)
  revalidatePath(`/admin/transactions/${txnId}`)
}

export async function deleteMilestone(formData: FormData) {
  const ctx = await requireStaff()
  if (!ctx) return
  const id    = String(formData.get('id') ?? '').trim()
  const txnId = String(formData.get('transaction_id') ?? '').trim()
  if (!id) return
  await ctx.supabase.from('transaction_milestones').delete().eq('id', id)
  revalidatePath(`/admin/transactions/${txnId}`)
}

// ── Payment schedule ────────────────────────────────────────────────────────
export async function addInstallment(formData: FormData) {
  const ctx = await requireStaff()
  if (!ctx) return
  const txnId  = String(formData.get('transaction_id') ?? '').trim()
  const amount = num(formData.get('amount'))
  if (!txnId || amount == null) return

  const { data: last } = await ctx.supabase
    .from('payment_schedule').select('installment_no')
    .eq('transaction_id', txnId).order('installment_no', { ascending: false }).limit(1)
  const no = (last?.[0]?.installment_no ?? 0) + 1

  await ctx.supabase.from('payment_schedule').insert({
    transaction_id: txnId,
    installment_no: no,
    amount,
    currency:       String(formData.get('currency') ?? 'AED').trim(),
    due_date:       date(formData.get('due_date')),
    status:         'due',
  })
  revalidatePath(`/admin/transactions/${txnId}`)
}

export async function toggleInstallmentPaid(formData: FormData) {
  const ctx = await requireStaff()
  if (!ctx) return
  const id    = String(formData.get('id') ?? '').trim()
  const txnId = String(formData.get('transaction_id') ?? '').trim()
  const paid  = String(formData.get('paid') ?? '') === '1'
  if (!id) return
  await ctx.supabase.from('payment_schedule').update({
    status:  paid ? 'paid' : 'due',
    paid_at: paid ? new Date().toISOString() : null,
  }).eq('id', id)
  revalidatePath(`/admin/transactions/${txnId}`)
}

export async function deleteInstallment(formData: FormData) {
  const ctx = await requireStaff()
  if (!ctx) return
  const id    = String(formData.get('id') ?? '').trim()
  const txnId = String(formData.get('transaction_id') ?? '').trim()
  if (!id) return
  await ctx.supabase.from('payment_schedule').delete().eq('id', id)
  revalidatePath(`/admin/transactions/${txnId}`)
}
