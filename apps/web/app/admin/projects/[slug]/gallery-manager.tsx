'use client'

import { useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { uploadProjectImages, deleteProjectImage } from './actions'

type Image = { mediaId: string; url: string }

function UploadButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="h-9 px-4 rounded-lg bg-accent text-white text-[13px] font-semibold
        hover:opacity-90 disabled:opacity-50 transition-opacity">
      {pending ? 'Uploading…' : 'Upload'}
    </button>
  )
}

function DeleteButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      title="Remove image"
      className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full
        bg-black/55 text-white text-[15px] leading-none hover:bg-danger disabled:opacity-50 transition-colors">
      ×
    </button>
  )
}

export function GalleryManager({ slug, images }: { slug: string; images: Image[] }) {
  const formRef = useRef<HTMLFormElement>(null)

  async function handleUpload(formData: FormData) {
    await uploadProjectImages(formData)
    formRef.current?.reset()
  }

  return (
    <div className="flex flex-col gap-5">
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img) => (
            <div key={img.mediaId} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
              <form action={deleteProjectImage}>
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="media_id" value={img.mediaId} />
                <DeleteButton />
              </form>
            </div>
          ))}
        </div>
      )}

      <form ref={formRef} action={handleUpload} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="slug" value={slug} />
        <input
          type="file" name="images" accept="image/jpeg,image/png,image/webp" multiple
          className="text-[13px] text-text-secondary file:mr-3 file:h-9 file:px-4 file:rounded-lg
            file:border-0 file:bg-surface-2 file:text-text file:text-[13px] file:font-medium
            file:cursor-pointer hover:file:bg-surface-3"
        />
        <UploadButton />
      </form>
      <p className="text-[12px] text-text-tertiary">JPG, PNG or WebP · up to 5MB each · select multiple at once.</p>
    </div>
  )
}
