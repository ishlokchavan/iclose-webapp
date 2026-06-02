'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, rectSortingStrategy, useSortable, arrayMove, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { uploadProjectImages, deleteProjectImage, reorderProjectImages } from './actions'

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
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full
        bg-black/55 text-white text-[15px] leading-none hover:bg-danger disabled:opacity-50 transition-colors">
      ×
    </button>
  )
}

function SortableThumb({ img, slug, isCover }: { img: Image; slug: string; isCover: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: img.mediaId })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
    opacity: isDragging ? 0.85 : 1,
  }
  return (
    <div ref={setNodeRef} style={style}
      className="relative aspect-[4/3] rounded-xl overflow-hidden bg-surface-2 touch-none cursor-grab active:cursor-grabbing"
      {...attributes} {...listeners}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img.url} alt="" className="w-full h-full object-cover pointer-events-none" loading="lazy" />
      {isCover && (
        <span className="absolute top-2 left-2 rounded-pill bg-accent text-white text-[10px] font-semibold px-2 py-[2px]">
          Cover
        </span>
      )}
      <form action={deleteProjectImage}>
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="media_id" value={img.mediaId} />
        <DeleteButton />
      </form>
    </div>
  )
}

export function GalleryManager({ slug, images }: { slug: string; images: Image[] }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [items, setItems] = useState<Image[]>(images)
  const [, startTransition] = useTransition()

  // Re-sync when server data changes (after upload/delete).
  useEffect(() => { setItems(images) }, [images])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((i) => i.mediaId === active.id)
    const newIndex = items.findIndex((i) => i.mediaId === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(items, oldIndex, newIndex)
    setItems(next) // optimistic
    startTransition(() => { reorderProjectImages(slug, next.map((i) => i.mediaId)) })
  }

  async function handleUpload(formData: FormData) {
    await uploadProjectImages(formData)
    formRef.current?.reset()
  }

  return (
    <div className="flex flex-col gap-5">
      {items.length > 0 && (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={items.map((i) => i.mediaId)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {items.map((img, i) => (
                  <SortableThumb key={img.mediaId} img={img} slug={slug} isCover={i === 0} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <p className="text-[12px] text-text-tertiary">Drag to reorder · the first photo is the cover.</p>
        </>
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
