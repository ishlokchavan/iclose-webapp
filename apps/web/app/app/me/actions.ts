'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const name       = String(formData.get('name')        ?? '').trim()
  const phone      = String(formData.get('phone')       ?? '').trim()
  const budgetBand = String(formData.get('budget_band') ?? '').trim()
  const areaIds    = formData.getAll('preferred_areas').map(String).filter(Boolean)

  // RLS (profiles_update_own) restricts this to the caller's own row.
  await supabase.from('profiles').update({
    full_name:       name || null,
    phone:           phone || null,
    budget_band:     budgetBand || null,
    preferred_areas: areaIds,
  }).eq('id', user.id)

  revalidatePath('/app/me')
}
