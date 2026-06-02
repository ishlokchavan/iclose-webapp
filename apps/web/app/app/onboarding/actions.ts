'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const name       = String(formData.get('name')        ?? '').trim()
  const phone      = String(formData.get('phone')       ?? '').trim()
  const budgetBand = String(formData.get('budget_band') ?? '').trim()
  const areaIds    = formData.getAll('preferred_areas').map(String).filter(Boolean)

  await supabase.from('profiles').update({
    full_name:            name  || undefined,
    phone:                phone || undefined,
    budget_band:          budgetBand || undefined,
    preferred_areas:      areaIds,
    onboarding_completed: true,
  }).eq('id', user.id)

  redirect('/app/explore')
}
