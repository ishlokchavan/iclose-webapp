'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { staffInvite, staffRoleAdded } from '@/lib/email/templates'
import { getSiteOrigin } from '@/lib/site'
import { recordAudit } from '@/lib/audit'

const STAFF_ROLES = ['rm', 'ops_manager', 'finance', 'super_admin'] as const

async function assertSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: roles } = await supabase
    .from('profile_roles').select('role').eq('profile_id', user.id)
  const ok = (roles ?? []).some((r: { role: string }) => r.role === 'super_admin')
  return ok ? { supabase, user } : null
}

export async function grantRole(formData: FormData) {
  const ctx = await assertSuperAdmin()
  if (!ctx) return
  const { supabase, user } = ctx

  const profileId = String(formData.get('profile_id') ?? '').trim()
  const role      = String(formData.get('role')       ?? '').trim()
  if (!profileId || !role) return

  // Idempotent: ignore duplicate
  await supabase.from('profile_roles').upsert(
    { profile_id: profileId, role },
    { onConflict: 'profile_id,role', ignoreDuplicates: true }
  )
  await recordAudit(supabase, {
    actorId: user.id, action: 'role.grant', entityType: 'profile', entityId: profileId, after: { role },
  })

  revalidatePath('/admin/users')
}

export async function revokeRole(formData: FormData) {
  const ctx = await assertSuperAdmin()
  if (!ctx) return
  const { supabase, user } = ctx

  const profileId = String(formData.get('profile_id') ?? '').trim()
  const role      = String(formData.get('role')       ?? '').trim()
  if (!profileId || !role) return

  // Never revoke someone's last role if it's 'buyer' — keep buyer role always
  if (role === 'buyer') return

  await supabase.from('profile_roles')
    .delete()
    .eq('profile_id', profileId)
    .eq('role', role)
  await recordAudit(supabase, {
    actorId: user.id, action: 'role.revoke', entityType: 'profile', entityId: profileId, before: { role },
  })

  revalidatePath('/admin/users')
}

// Hard-delete a user (auth.users → cascades to profile + CASCADE children;
// leads.buyer_id is nulled; append-only/financial tables block the delete).
export async function deleteUser(formData: FormData) {
  const ctx = await assertSuperAdmin()
  if (!ctx) redirect('/admin/users?delete_error=forbidden')
  const { supabase: userClient, user } = ctx

  const profileId = String(formData.get('profile_id') ?? '').trim()
  if (!profileId) redirect('/admin/users')

  // Never let a super admin delete their own account (lock-out protection).
  if (user.id === profileId) redirect('/admin/users?delete_error=self')

  // Capture the email for the audit record before deletion.
  const { data: target } = await userClient
    .from('profiles').select('email').eq('id', profileId).maybeSingle()

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(profileId)

  if (error) {
    console.error('[delete user] failed', error)
    redirect(`/admin/users?delete_error=${encodeURIComponent(error.message)}`)
  }

  await recordAudit(userClient, {
    actorId: user.id, action: 'user.delete', entityType: 'profile', entityId: profileId,
    before: { email: target?.email ?? null },
  })

  revalidatePath('/admin/users')
  redirect('/admin/users?deleted=1')
}

// Invite a teammate as staff. Creates the account if needed and emails the
// invite link via Brevo — Supabase's own mailer is never used.
export async function inviteStaff(formData: FormData) {
  const ctx = await assertSuperAdmin()
  if (!ctx) redirect('/admin/users?invite_error=forbidden')
  const { supabase: userClient, user: actor } = ctx

  const email    = String(formData.get('email')     ?? '').trim().toLowerCase()
  const fullName = String(formData.get('full_name') ?? '').trim()
  const role     = String(formData.get('role')      ?? '').trim()

  if (!email || !email.includes('@')) redirect('/admin/users?invite_error=email')
  if (!(STAFF_ROLES as readonly string[]).includes(role)) redirect('/admin/users?invite_error=role')

  const admin  = createAdminClient()
  const origin = await getSiteOrigin()

  // Does a profile already exist for this email?
  const { data: existing } = await userClient
    .from('profiles').select('id, full_name').ilike('email', email).maybeSingle()

  const nonce = Date.now()

  if (existing) {
    // Account exists — just grant the role and notify (no invite link needed).
    await admin.from('profile_roles').upsert(
      { profile_id: existing.id, role },
      { onConflict: 'profile_id,role', ignoreDuplicates: true }
    )
    await recordAudit(userClient, {
      actorId: actor.id, action: 'role.grant', entityType: 'profile', entityId: existing.id, after: { role, via: 'invite' },
    })
    const res = await sendEmail({
      to:      { email, name: existing.full_name ?? fullName ?? undefined },
      subject: 'Your iClose access changed',
      html:    staffRoleAdded({ name: existing.full_name ?? fullName, role, signInUrl: `${origin}/auth/sign-in` }),
    })

    revalidatePath('/admin/users')
    const fail = res.ok ? '' : `&email_failed=${encodeURIComponent(res.error ?? '1')}`
    redirect(`/admin/users?invited=${encodeURIComponent(email)}&mode=existing&t=${nonce}${fail}`)
  }

  // New account — generate an invite link WITHOUT sending Supabase's email.
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type:    'invite',
    email,
    options: { data: { full_name: fullName } },
  })

  if (linkErr || !linkData?.user) {
    console.error('[invite] generateLink failed', linkErr)
    redirect(`/admin/users?invite_error=create&t=${nonce}`)
  }

  const newUserId = linkData.user.id
  const tokenHash = linkData.properties?.hashed_token

  // handle_new_user() trigger has seeded profile + buyer role; set name and grant staff role.
  await admin.from('profiles').update({ full_name: fullName }).eq('id', newUserId)
  await admin.from('profile_roles').upsert(
    { profile_id: newUserId, role },
    { onConflict: 'profile_id,role', ignoreDuplicates: true }
  )
  await recordAudit(userClient, {
    actorId: actor.id, action: 'user.invite', entityType: 'profile', entityId: newUserId, after: { email, role },
  })

  const confirmUrl = `${origin}/auth/confirm?token_hash=${tokenHash}&type=invite&next=/admin`

  const res = await sendEmail({
    to:      { email, name: fullName || undefined },
    subject: 'You’ve been invited to iClose',
    html:    staffInvite({ name: fullName, role, confirmUrl }),
  })

  revalidatePath('/admin/users')
  const fail = res.ok ? '' : `&email_failed=${encodeURIComponent(res.error ?? '1')}`
  redirect(`/admin/users?invited=${encodeURIComponent(email)}&mode=invited&t=${nonce}${fail}`)
}
