'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { magicLink } from '@/lib/email/templates'
import { getSiteOrigin } from '@/lib/site'

// Passwordless sign-in routed entirely through Brevo. We generate the link
// server-side with the admin API (which does NOT send an email) and deliver it
// via Brevo — Supabase's own mailer is never used.
export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!email || !email.includes('@')) redirect('/auth/sign-in?error=email')

  const admin  = createAdminClient()
  const origin = await getSiteOrigin()

  // Create the account if this is a first-time sign-in (no email is sent by createUser).
  // The handle_new_user() trigger seeds profile + buyer role.
  const { data: existing } = await admin
    .from('profiles').select('id').ilike('email', email).maybeSingle()

  if (!existing) {
    const { error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true, // mark confirmed so the magic link works immediately
    })
    if (createErr && !/already.*regist/i.test(createErr.message)) {
      console.error('[magiclink] createUser failed', createErr)
      redirect('/auth/sign-in?error=send')
    }
  }

  const { data: linkData, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (error || !linkData?.properties?.hashed_token) {
    console.error('[magiclink] generateLink failed', error)
    redirect('/auth/sign-in?error=send')
  }

  const confirmUrl =
    `${origin}/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=magiclink&next=/app/explore`

  try {
    await sendEmail({
      to:      { email },
      subject: 'Your iClose sign-in link',
      html:    magicLink({ confirmUrl }),
    })
  } catch (err) {
    console.error('[magiclink] email send failed', err)
    redirect('/auth/sign-in?error=send')
  }

  redirect(`/auth/sign-in?sent=${encodeURIComponent(email)}`)
}
