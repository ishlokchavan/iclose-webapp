'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function assertSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: roles } = await supabase
    .from('profile_roles').select('role').eq('profile_id', user.id)
  const ok = (roles ?? []).some((r: { role: string }) => r.role === 'super_admin')
  return ok ? supabase : null
}

export async function grantRole(formData: FormData) {
  const supabase = await assertSuperAdmin()
  if (!supabase) return

  const profileId = String(formData.get('profile_id') ?? '').trim()
  const role      = String(formData.get('role')       ?? '').trim()
  if (!profileId || !role) return

  // Idempotent: ignore duplicate
  await supabase.from('profile_roles').upsert(
    { profile_id: profileId, role },
    { onConflict: 'profile_id,role', ignoreDuplicates: true }
  )

  revalidatePath('/admin/users')
}

export async function revokeRole(formData: FormData) {
  const supabase = await assertSuperAdmin()
  if (!supabase) return

  const profileId = String(formData.get('profile_id') ?? '').trim()
  const role      = String(formData.get('role')       ?? '').trim()
  if (!profileId || !role) return

  // Never revoke someone's last role if it's 'buyer' — keep buyer role always
  if (role === 'buyer') return

  await supabase.from('profile_roles')
    .delete()
    .eq('profile_id', profileId)
    .eq('role', role)

  revalidatePath('/admin/users')
}
