'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

function num(v: FormDataEntryValue | null): number | null {
  const n = parseFloat(String(v ?? ''))
  return isNaN(n) ? null : n
}

export async function createProject(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const STAFF = ['rm', 'ops_manager', 'finance', 'super_admin'] as const
  const { data: roles } = await supabase
    .from('profile_roles').select('role').eq('profile_id', user.id)
  const isStaff = (roles ?? []).some((r: { role: string }) =>
    (STAFF as readonly string[]).includes(r.role))
  if (!isStaff) return

  const name = String(formData.get('name') ?? '').trim()
  const slug = String(formData.get('slug') ?? '').trim()
  if (!name || !slug) return

  const row = {
    name,
    slug,
    status:             'draft' as const,
    developer_id:       String(formData.get('developer_id') ?? '').trim() || null,
    area_id:            String(formData.get('area_id')      ?? '').trim() || null,
    description:        String(formData.get('description')  ?? '').trim() || null,
    handover_quarter:   String(formData.get('handover_quarter') ?? '').trim() || null,
    availability:       (String(formData.get('availability') ?? '').trim() || 'available') as 'available',
    price_from:         num(formData.get('price_from')),
    price_to:           num(formData.get('price_to')),
    currency:           String(formData.get('currency') ?? 'AED').trim(),
    est_yield_pct:      num(formData.get('est_yield_pct')),
    commission_pct:     num(formData.get('commission_pct')),
    cashback_payout_pct: num(formData.get('cashback_payout_pct')),
    cashback_floor:     num(formData.get('cashback_floor')) ?? 0,
  }

  const { error } = await supabase.from('projects').insert(row)
  if (error) return // slug conflict — form will stay with error; silently ignore for now

  revalidatePath('/admin/projects')
  redirect(`/admin/projects/${slug}`)
}
