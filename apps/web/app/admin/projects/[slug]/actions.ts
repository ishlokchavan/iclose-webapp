'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const IMAGES_BUCKET = 'project-images'

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

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
}

export async function uploadProjectImages(formData: FormData) {
  const supabase = await assertStaff()
  if (!supabase) return

  const slug = String(formData.get('slug') ?? '').trim()
  const { data: project } = await supabase
    .from('projects').select('id').eq('slug', slug).maybeSingle()
  if (!project) return

  const files = formData.getAll('images').filter((f): f is File => f instanceof File && f.size > 0)
  if (files.length === 0) return

  const admin = createAdminClient()

  // Continue sort_order after any existing gallery images.
  const { data: existing } = await supabase
    .from('project_media')
    .select('sort_order')
    .eq('project_id', project.id)
    .eq('role', 'gallery')
    .order('sort_order', { ascending: false })
    .limit(1)
  let nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

  for (const file of files) {
    const ext  = EXT[file.type]
    if (!ext) continue // skip disallowed types
    const path = `${project.id}/${crypto.randomUUID()}.${ext}`
    const bytes = new Uint8Array(await file.arrayBuffer())

    const { error: upErr } = await admin.storage
      .from(IMAGES_BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: false })
    if (upErr) { console.error('[gallery] upload failed', upErr); continue }

    const { data: media, error: mErr } = await admin
      .from('media')
      .insert({ type: 'image', provider: 'upload', storage_path: path })
      .select('id')
      .single()
    if (mErr || !media) { console.error('[gallery] media insert failed', mErr); continue }

    await admin.from('project_media').insert({
      project_id: project.id,
      media_id:   media.id,
      role:       'gallery',
      sort_order: nextOrder++,
    })
  }

  revalidatePath(`/admin/projects/${slug}`)
  revalidatePath(`/app/explore/${slug}`)
}

export async function deleteProjectImage(formData: FormData) {
  const supabase = await assertStaff()
  if (!supabase) return

  const slug    = String(formData.get('slug') ?? '').trim()
  const mediaId = String(formData.get('media_id') ?? '').trim()
  if (!mediaId) return

  const admin = createAdminClient()

  const { data: media } = await admin
    .from('media').select('storage_path').eq('id', mediaId).maybeSingle()

  // Remove the join row, the media row, then the storage object.
  await admin.from('project_media').delete().eq('media_id', mediaId)
  await admin.from('media').delete().eq('id', mediaId)
  if (media?.storage_path) {
    await admin.storage.from(IMAGES_BUCKET).remove([media.storage_path])
  }

  revalidatePath(`/admin/projects/${slug}`)
  revalidatePath(`/app/explore/${slug}`)
}
