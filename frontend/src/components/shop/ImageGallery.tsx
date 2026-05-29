'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Expand } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTouchDevice } from '@/hooks/use-touch-device'
import { ProductImageLightbox } from './ProductImageLightbox'
import type { ProductImage } from '@/types'

const COLOR_MAP: Record<string, string> = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308',
  purple: '#a855f7', pink: '#ec4899', orange: '#f97316', black: '#1f2937',
  white: '#f9fafb', navy: '#1e3a5f', maroon: '#7f1d1d', teal: '#14b8a6',
  gold: '#d4a017', silver: '#9ca3af', brown: '#92400e', cream: '#fef3c7',
  ivory: '#fffff0', 'rose gold': '#e6b9a6', beige: '#d4c5a9',
}

const IMAGE_QUALITY = 90

function colorHex(name: string) {
  return COLOR_MAP[name?.toLowerCase().trim()] ?? '#d1d5db'
}

interface ImageGalleryProps {
  images: ProductImage[]
  title: string
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const isTouch = useTouchDevice()
  const colors = [...new Set(images.map((i) => i.color).filter(Boolean))] as string[]
  const [activeColor, setActiveColor] = useState<string | null>(colors[0] ?? null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({
    transformOrigin: 'center center',
    transform: 'scale(1)',
  })

  const shown = activeColor ? images.filter((i) => i.color === activeColor) : images
  const sorted = [...shown].sort((a, b) => {
    const primaryDiff = (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)
    if (primaryDiff !== 0) return primaryDiff
    return (Number(a.display_order) || 0) - (Number(b.display_order) || 0)
  })
  const activeImage = sorted[activeIndex] ?? sorted[0]

  function selectColor(c: string) {
    setActiveColor(c)
    setActiveIndex(0)
  }

  function handleMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
    if (isTouch) return
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(2.2)',
    })
  }

  function handleMouseLeave() {
    if (isTouch) return
    setZoomStyle({
      transformOrigin: 'center center',
      transform: 'scale(1)',
    })
  }

  function openLightbox() {
    if (activeImage?.url) setLightboxOpen(true)
  }

  if (!activeImage) {
    return (
      <div className="aspect-[3/4] bg-neutral-100 rounded-2xl sm:rounded-3xl flex items-center justify-center">
        <span className="text-6xl opacity-40">🌸</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={openLightbox}
        className={cn(
          'relative w-full aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-50 border border-neutral-200/70 group text-left',
          isTouch ? 'cursor-pointer active:opacity-95' : 'cursor-zoom-in'
        )}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        aria-label="Open full screen product image"
      >
        <Image
          src={activeImage.url}
          alt={activeImage.alt_text ?? title}
          fill
          className={cn(
            'object-contain transition-transform duration-150 ease-out',
            !isTouch && 'group-hover:transition-transform'
          )}
          style={isTouch ? undefined : zoomStyle}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
          quality={IMAGE_QUALITY}
          priority
        />
        <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1.5 text-[11px] font-medium text-white/90 pointer-events-none">
          <Expand className="h-3.5 w-3.5" />
          {isTouch ? 'Tap to zoom' : 'Click to zoom'}
        </span>
      </button>

      {colors.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink mr-1 w-full sm:w-auto">Colour</span>
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => selectColor(c)}
              className={cn(
                'flex items-center gap-1.5 pl-1 pr-3 py-1.5 min-h-[44px] rounded-full border transition-colors',
                c === activeColor
                  ? 'border-brand bg-brand-soft'
                  : 'border-neutral-200 hover:border-neutral-300'
              )}
            >
              <span
                className="h-5 w-5 rounded-full ring-1 ring-inset ring-black/10 shrink-0"
                style={{ backgroundColor: colorHex(c) }}
              />
              <span className="text-xs font-medium capitalize text-neutral-700">{c}</span>
            </button>
          ))}
        </div>
      )}

      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory no-scrollbar">
          {sorted.map((img, idx) => (
            <button
              key={`${img.url}-${idx}`}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={cn(
                'relative w-12 sm:w-14 shrink-0 aspect-[3/4] rounded-xl overflow-hidden border-2 bg-neutral-50 transition-colors snap-start',
                idx === activeIndex
                  ? 'border-brand'
                  : 'border-neutral-200 hover:border-neutral-300'
              )}
            >
              <Image
                src={img.url}
                alt={img.alt_text ?? `${title} ${idx + 1}`}
                fill
                className="object-contain"
                sizes="72px"
                quality={85}
              />
            </button>
          ))}
        </div>
      )}

      <ProductImageLightbox
        src={activeImage.url}
        alt={activeImage.alt_text ?? title}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  )
}
