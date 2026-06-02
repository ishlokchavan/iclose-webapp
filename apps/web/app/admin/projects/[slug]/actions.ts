'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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
