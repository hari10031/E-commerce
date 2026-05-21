'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { ProductImage } from '@/types'

const COLOR_MAP: Record<string, string> = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308',
  purple: '#a855f7', pink: '#ec4899', orange: '#f97316', black: '#1f2937',
  white: '#f9fafb', navy: '#1e3a5f', maroon: '#7f1d1d', teal: '#14b8a6',
  gold: '#d4a017', silver: '#9ca3af', brown: '#92400e', cream: '#fef3c7',
  ivory: '#fffff0', 'rose gold': '#e6b9a6', beige: '#d4c5a9',
}

function colorHex(name: string) {
  return COLOR_MAP[name?.toLowerCase().trim()] ?? '#d1d5db'
}

interface ImageGalleryProps {
  images: ProductImage[]
  title: string
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const colors = [...new Set(images.map((i) => i.color).filter(Boolean))] as string[]
  const [activeColor, setActiveColor] = useState<string | null>(colors[0] ?? null)
  const [activeIndex, setActiveIndex] = useState(0)

  const shown = activeColor ? images.filter((i) => i.color === activeColor) : images
  const sorted = [...shown].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
  const activeImage = sorted[activeIndex] ?? sorted[0]

  function selectColor(c: string) {
    setActiveColor(c)
    setActiveIndex(0)
  }

  if (!activeImage) {
    return (
      <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center">
        <span className="text-6xl">🌸</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 cursor-zoom-in group">
        <Image
          src={activeImage.url}
          alt={activeImage.alt_text ?? title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Color selector — swaps the gallery to that colour's photos */}
      {colors.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-600 mr-1">Color:</span>
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => selectColor(c)}
              className={cn(
                'flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border-2 transition-colors',
                c === activeColor
                  ? 'border-[oklch(0.60_0.22_35)]'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <span
                className="h-5 w-5 rounded-full border border-gray-200"
                style={{ backgroundColor: colorHex(c) }}
              />
              <span className="text-xs font-medium capitalize text-gray-700">{c}</span>
            </button>
          ))}
        </div>
      )}

      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={cn(
                'relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors',
                idx === activeIndex
                  ? 'border-[oklch(0.60_0.22_35)]'
                  : 'border-transparent hover:border-gray-300'
              )}
            >
              <Image
                src={img.url}
                alt={img.alt_text ?? `${title} ${idx + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
