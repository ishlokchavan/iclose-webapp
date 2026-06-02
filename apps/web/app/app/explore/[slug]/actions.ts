'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import { enquiryConfirmation, newLeadNotification } from '@/lib/email/templates'

export async function submitEnquiry(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const projectSlug = String(formData.get('project_slug') ?? '').trim()
  const name        = String(formData.get('name')         ?? '').trim()
  const phone       = String(formData.get('phone')        ?? '').trim()
  const unitType    = String(formData.get('unit_type')    ?? '').trim() || null

  // Fetch project (published check is a safety gate; RLS is primary)
  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('slug', projectSlug)
    .eq('status', 'published')
    .is('deleted_at', null)
    .maybeSingle()
  if (!project) redirect('/app/explore')

  // Persist name / phone improvements to the profile
  if (name || phone) {
    const patch: Record<string, string> = {}
    if (name)  patch.full_name = name
    if (phone) patch.phone     = phone
    await supabase.from('profiles').update(patch).eq('id', user.id)
  }

  // Idempotent: skip if an open lead for this buyer+project already exists
  const { data: existing } = await supabase
    .from('leads')
    .select('id')
    .eq('buyer_id',   user.id)
    .eq('project_id', project.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!existing) {
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({ buyer_id: user.id, project_id: project.id, unit_type: unitType, status: 'new' })
      .select('id')
      .single()

    if (!error && lead) {
      const headersList = await headers()
      const referer = headersList.get('referer') ?? null

      await supabase.from('lead_attribution').insert({
        lead_id:  lead.id,
        source:   'explore',
        referrer: referer,
        utm:      {},
      })

      // Emails are fire-and-forget; don't let failures block the redirect
      const buyerEmail = user.email ?? ''
      const buyerName  = name || ''
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .maybeSingle()
      const resolvedName  = buyerName  || (profile?.full_name as string | null) || ''
      const resolvedPhone = phone      || (profile?.phone     as string | null) || null

      void Promise.all([
        // Confirmation to buyer
        buyerEmail
          ? sendEmail({
              to:      { email: buyerEmail, name: resolvedName || undefined },
              subject: `Your enquiry for ${project.name} — iClose`,
              html:    enquiryConfirmation({
                buyerName:   resolvedName,
                projectName: project.name,
                projectSlug,
                unitType,
              }),
            })
          : Promise.resolve(),

        // Notification to admin inbox
        process.env.BREVO_ADMIN_EMAIL
          ? sendEmail({
              to:      { email: process.env.BREVO_ADMIN_EMAIL },
              subject: `New lead: ${resolvedName || buyerEmail} → ${project.name}`,
              html:    newLeadNotification({
                buyerName:   resolvedName,
                buyerEmail,
                buyerPhone:  resolvedPhone,
                projectName: project.name,
                projectSlug,
                unitType,
                leadId:      lead.id,
              }),
            })
          : Promise.resolve(),
      ]).catch((err) => console.error('[email] send error', err))
    }
  }

  redirect(`/app/explore/${projectSlug}?enquired=1`)
}
