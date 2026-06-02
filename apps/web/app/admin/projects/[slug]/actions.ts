'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function assertStaff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const STAFF = ['rm', 'ops_manager', 'finance', 'super_admin'] as const
  const { data: roles } = await supabase
    .from('profile_roles').select('role').eq('profile_id', user.id)
  const ok = (roles ?? []).some((r: { role: string }) => (STAFF as readonly string[]).includes(r.role))
  return ok ? supabase : null
}

function num(v: FormDataEntryValue | null): number | null {
  const n = parseFloat(String(v ?? ''))
  return isNaN(n) ? null : n
}

export async function updateProject(formData: FormData) {
  const supabase = await assertStaff()
  if (!supabase) return

  const currentSlug = String(formData.get('current_slug') ?? '').trim()
  const { data: project } = await supabase
    .from('projects').select('id, status').eq('slug', currentSlug).maybeSingle()
  if (!project) return

  const patch = {
    name:               String(formData.get('name')         ?? '').trim() || undefined,
    developer_id:       String(formData.get('developer_id') ?? '').trim() || null,
    area_id:            String(formData.get('area_id')      ?? '').trim() || null,
    description:        String(formData.get('description')  ?? '').trim() || null,
    handover_quarter:   String(formData.get('handover_quarter') ?? '').trim() || null,
    availability:       String(formData.get('availability') ?? '').trim() || null,
    price_from:         num(formData.get('price_from')),
    price_to:           num(formData.get('price_to')),
    currency:           String(formData.get('currency') ?? 'AED').trim(),
    est_yield_pct:      num(formData.get('est_yield_pct')),
    commission_pct:     num(formData.get('commission_pct')),
    cashback_payout_pct: num(formData.get('cashback_payout_pct')),
    cashback_floor:     num(formData.get('cashback_floor')) ?? 0,
    updated_at:         new Date().toISOString(),
  }

  await supabase.from('projects').update(patch).eq('id', project.id)
  revalidatePath(`/admin/projects/${currentSlug}`)
  revalidatePath(`/app/explore/${currentSlug}`)
  revalidatePath('/admin/projects')
}

function parseYouTubeId(raw: string): string | null {
  const s = raw.trim()
  const patterns = [/[?&]v=([^&]{11})/, /youtu\.be\/([^?]{11})/, /embed\/([^?]{11})/]
  for (const p of patterns) {
    const m = s.match(p)
    if (m) return m[1]
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s
  return null
}

export async function setHeroVideo(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const slug     = String(formData.get('slug')      ?? '').trim()
  const rawInput = String(formData.get('video_url') ?? '').trim()

  const { data: project } = await supabase
    .from('projects').select('id').eq('slug', slug).maybeSingle()
  if (!project) return

  // Remove existing hero video records
  const { data: existing } = await supabase
    .from('project_media')
    .select('id, media_id')
    .eq('project_id', project.id)
    .eq('role', 'hero_video')
  if (existing?.length) {
    const ids = existing.map((r: { id: string }) => r.id)
    await supabase.from('project_media').delete().in('id', ids)
    const mediaIds = existing.map((r: { media_id: string }) => r.media_id)
    await supabase.from('media').delete().in('id', mediaIds)
  }

  // If input is non-empty, create new media + project_media rows
  if (rawInput) {
    const videoId = parseYouTubeId(rawInput)
    if (videoId) {
      const { data: media } = await supabase
        .from('media')
        .insert({ type: 'video', provider: 'youtube', external_id: videoId })
        .select('id')
        .single()
      if (media) {
        await supabase.from('project_media').insert({
          project_id: project.id,
          media_id:   media.id,
          role:       'hero_video',
          sort_order: 0,
        })
      }
    }
  }

  revalidatePath(`/admin/projects/${slug}`)
  revalidatePath(`/app/explore/${slug}`)
}
