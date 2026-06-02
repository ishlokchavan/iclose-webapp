'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

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
    .select('id')
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
    }
  }

  redirect(`/app/explore/${projectSlug}?enquired=1`)
}
