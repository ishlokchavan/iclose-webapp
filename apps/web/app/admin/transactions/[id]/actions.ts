'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { recordAudit } from '@/lib/audit'
import { ALL_CASHBACK_STAGES } from '@/lib/txn'

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

const num = (v: FormDataEntryValue | null) => {
  const n = parseFloat(String(v ?? '')); return isNaN(n) ? null : n
}
const str = (v: FormDataEntryValue | null) => String(v ?? '').trim() || null

export async function updateTransaction(formData: FormData) {
  const ctx = await requireStaff()
  if (!ctx) return
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return

  const patch = {
    unit_no:       str(formData.get('unit_no')),
    category:      str(formData.get('category')),
    property_type: str(formData.get('property_type')),
    area_id:       str(formData.get('area_id')),
    developer_id:  str(formData.get('developer_id')),
    unit_price:    num(formData.get('unit_price')),
    currency:      String(formData.get('currency') ?? 'AED').trim(),
    updated_at:    new Date().toISOString(),
  }
  await ctx.supabase.from('transactions').update(patch).eq('id', id)
  revalidatePath(`/admin/transactions/${id}`)
  revalidatePath('/admin/transactions')
}

export async function updateCashbackStage(formData: FormData) {
  const ctx = await requireStaff()
  if (!ctx) return
  const id    = String(formData.get('id') ?? '').trim()
  const stage = String(formData.get('cashback_status') ?? '').trim()
  if (!id || !ALL_CASHBACK_STAGES.includes(stage as never)) return

  const { data: before } = await ctx.supabase
    .from('transactions').select('cashback_status').eq('id', id).maybeSingle()

  await ctx.supabase.from('transactions')
    .update({ cashback_status: stage, updated_at: new Date().toISOString() }).eq('id', id)

  await recordAudit(ctx.supabase, {
    actorId: ctx.user.id, action: 'txn.cashback_stage', entityType: 'transaction', entityId: id,
    before: { cashback_status: before?.cashback_status ?? null }, after: { cashback_status: stage },
  })

  revalidatePath(`/admin/transactions/${id}`)
  revalidatePath('/admin/transactions')
}
