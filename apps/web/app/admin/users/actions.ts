'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { staffInvite, staffRoleAdded } from '@/lib/email/templates'

const STAFF_ROLES = ['rm', 'ops_manager', 'finance', 'super_admin'] as const

async function assertSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: roles } = await supabase
    .from('profile_roles').select('role').eq('profile_id', user.id)
  const ok = (roles ?? []).some((r: { role: string }) => r.role === 'super_admin')
  return ok ? supabase : null
}

async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const h = await headers()
  const host  = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  return `${proto}://${host}`
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

// Invite a teammate as staff. Creates the account if needed and emails the
// invite link via Brevo — Supabase's own mailer is never used.
export async function inviteStaff(formData: FormData) {
  const userClient = await assertSuperAdmin()
  if (!userClient) redirect('/admin/users?invite_error=forbidden')

  const email    = String(formData.get('email')     ?? '').trim().toLowerCase()
  const fullName = String(formData.get('full_name') ?? '').trim()
  const role     = String(formData.get('role')      ?? '').trim()

  if (!email || !email.includes('@')) redirect('/admin/users?invite_error=email')
  if (!(STAFF_ROLES as readonly string[]).includes(role)) redirect('/admin/users?invite_error=role')

  const admin  = createAdminClient()
  const origin = await siteOrigin()

  // Does a profile already exist for this email?
  const { data: existing } = await userClient
    .from('profiles').select('id, full_name').ilike('email', email).maybeSingle()

  if (existing) {
    // Account exists — just grant the role and notify (no invite link needed).
    await admin.from('profile_roles').upsert(
      { profile_id: existing.id, role },
      { onConflict: 'profile_id,role', ignoreDuplicates: true }
    )
    try {
      await sendEmail({
        to:      { email, name: existing.full_name ?? fullName ?? undefined },
        subject: 'Your iClose access changed',
        html:    staffRoleAdded({ name: existing.full_name ?? fullName, role, signInUrl: `${origin}/auth/sign-in` }),
      })
    } catch (err) { console.error('[invite] role-added email failed', err) }

    revalidatePath('/admin/users')
    redirect(`/admin/users?invited=${encodeURIComponent(email)}&mode=existing`)
  }

  // New account — generate an invite link WITHOUT sending Supabase's email.
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type:    'invite',
    email,
    options: { data: { full_name: fullName } },
  })

  if (linkErr || !linkData?.user) {
    console.error('[invite] generateLink failed', linkErr)
    redirect('/admin/users?invite_error=create')
  }

  const newUserId = linkData.user.id
  const tokenHash = linkData.properties?.hashed_token

  // handle_new_user() trigger has seeded profile + buyer role; set name and grant staff role.
  await admin.from('profiles').update({ full_name: fullName }).eq('id', newUserId)
  await admin.from('profile_roles').upsert(
    { profile_id: newUserId, role },
    { onConflict: 'profile_id,role', ignoreDuplicates: true }
  )

  const confirmUrl = `${origin}/auth/confirm?token_hash=${tokenHash}&type=invite&next=/admin`

  try {
    await sendEmail({
      to:      { email, name: fullName || undefined },
      subject: 'You’ve been invited to iClose',
      html:    staffInvite({ name: fullName, role, confirmUrl }),
    })
  } catch (err) { console.error('[invite] invite email failed', err) }

  revalidatePath('/admin/users')
  redirect(`/admin/users?invited=${encodeURIComponent(email)}&mode=invited`)
}
