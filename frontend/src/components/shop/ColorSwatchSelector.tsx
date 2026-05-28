'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { Variant } from '@/types'

interface ColorSwatchSelectorProps {
  variants: Variant[]
  selectedVariantId: string | null
  onSelect: (variant: Variant) => void
}

// Simple color name to CSS color mapping
const COLOR_MAP: Record<string, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  purple: '#a855f7',
  pink: '#ec4899',
  white: '#ffffff',
  black: '#000000',
  grey: '#6b7280',
  gray: '#6b7280',
  brown: '#92400e',
  gold: '#d4af37',
  silver: '#c0c0c0',
  beige: '#f5f5dc',
  maroon: '#800000',
  navy: '#001f5b',
  cream: '#fffdd0',
  indigo: '#4f46e5',
  burgundy: '#800020',
  wine: '#722f37',
  mustard: '#e1ad01',
  teal: '#008080',
  peach: '#ffcba4',
  olive: '#808000',
  emerald: '#50c878',
  turquoise: '#40e0d0',
  royal: '#4169e1',
  lavender: '#e6e6fa',
  magenta: '#ff00ff',
  plum: '#8e4585',
  violet: '#8f00ff',
  copper: '#b87333',
  bronze: '#cd7f32',
  rust: '#b7410e',
  coral: '#ff7f50',
  apricot: '#fbceb1',
  crimson: '#dc143c',
  khaki: '#c3b091',
  mint: '#98ff98',
}

function getColorStyle(color: string | undefined | null): string {
  if (!color) return '#e5e7eb'
  const trimmed = color.trim()
  
  if (trimmed.startsWith('#')) {
    return trimmed
  }
  
  if (/^[0-9A-Fa-f]{3}$/.test(trimmed) || /^[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return `#${trimmed}`
  }

  const lower = trimmed.toLowerCase()
  if (COLOR_MAP[lower]) {
    return COLOR_MAP[lower]
  }

  // Keyword check
  const sortedKeys = Object.keys(COLOR_MAP).sort((a, b) => b.length - a.length)
  for (const key of sortedKeys) {
    if (lower.includes(key)) {
      return COLOR_MAP[key]
    }
  }

  return '#e5e7eb'
}

// Deduplicate by color safely
function uniqueColors(variants: Variant[]) {
  const seen = new Set<string>()
  return (variants || []).filter((v) => {
    if (!v || !v.color) return false
    const key = v.color.trim().toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function ColorSwatchSelector({ variants, selectedVariantId, onSelect }: ColorSwatchSelectorProps) {
  const colors = uniqueColors(variants)
  const selectedVariant = variants.find((v) => v.id === selectedVariantId)

  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink">Colour</span>
        {selectedVariant && (
          <span className="text-sm text-neutral-500 capitalize">— {selectedVariant.color}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2.5">
        {colors.map((variant) => {
          const isSelected = variant.id === selectedVariantId || (
            selectedVariant?.color.toLowerCase() === variant.color.toLowerCase()
          )
          const isOutOfStock = variant.quantity === 0
          const colorCss = getColorStyle(variant.color)
          const isLight = ['white', 'cream', 'beige', 'silver', 'yellow', 'peach', 'lavender'].some(
            (c) => variant.color?.toLowerCase().includes(c)
          )

          return (
            <button
              key={variant.id}
              onClick={() => !isOutOfStock && onSelect(variant)}
              disabled={isOutOfStock}
              title={`${variant.color}${isOutOfStock ? ' (Out of stock)' : ''}`}
              className={cn(
                'relative h-10 w-10 sm:h-9 sm:w-9 rounded-full transition-all ring-1 ring-inset ring-black/5 touch-target',
                isSelected
                  ? 'outline outline-2 outline-offset-2 outline-brand scale-105'
                  : 'hover:scale-105',
                isOutOfStock && 'opacity-40 cursor-not-allowed'
              )}
              style={{ backgroundColor: colorCss }}
            >
              {isOutOfStock && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="block w-6 h-0.5 rotate-45"
                    style={{ backgroundColor: isLight ? '#666' : '#fff' }}
                  />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
