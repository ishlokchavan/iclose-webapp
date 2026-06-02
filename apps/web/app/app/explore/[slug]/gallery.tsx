'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [open, setOpen] = useState(false)
  const [idx, setIdx] = useState(0)

  const close = useCallback(() => setOpen(false), [])
  const prev  = useCallback(() => setIdx((i) => (i - 1 + images.length) % images.length), [images.length])
  const next  = useCallback(() => setIdx((i) => (i + 1) % images.length), [images.length])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, close, prev, next])

  if (images.length === 0) return null

  return (
    <>
      {/* Thumbnail grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {images.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => { setIdx(i); setOpen(true) }}
            className={`group relative block overflow-hidden rounded-2xl bg-surface-2 ${
              i === 0 ? 'col-span-2 aspect-[16/9]' : 'aspect-[4/3]'
            }`}
          >
            <Image
              src={url}
              alt={`${alt} photo ${i + 1}`}
              fill
              sizes={i === 0 ? '(max-width: 840px) 100vw, 840px' : '(max-width: 640px) 50vw, 420px'}
              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
              priority={i === 0}
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {open && (
        <div
          onClick={close}
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center select-none"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <span className="absolute top-4 left-4 text-white/70 text-[13px] tabular-nums">
            {idx + 1} / {images.length}
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full
              text-white/90 text-[24px] leading-none hover:bg-white/10 transition-colors"
          >
            ×
          </button>

          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prev() }}
              aria-label="Previous"
              className="absolute left-2 sm:left-4 w-11 h-11 flex items-center justify-center rounded-full
                text-white/90 text-[28px] leading-none hover:bg-white/10 transition-colors"
            >
              ‹
            </button>
          )}

          <div className="relative w-full max-w-[1100px] h-[78vh] mx-12" onClick={(e) => e.stopPropagation()}>
            <Image
              src={images[idx]}
              alt={`${alt} photo ${idx + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>

          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); next() }}
              aria-label="Next"
              className="absolute right-2 sm:right-4 w-11 h-11 flex items-center justify-center rounded-full
                text-white/90 text-[28px] leading-none hover:bg-white/10 transition-colors"
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  )
}
