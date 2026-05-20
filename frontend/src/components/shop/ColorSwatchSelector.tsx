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
}

function getColorStyle(color: string): string {
  const lower = color.toLowerCase()
  return COLOR_MAP[lower] ?? '#e5e7eb'
}

// Deduplicate by color
function uniqueColors(variants: Variant[]) {
  const seen = new Set<string>()
  return variants.filter((v) => {
    const key = v.color.toLowerCase()
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
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-gray-700">Color:</span>
        {selectedVariant && (
          <span className="text-sm text-gray-500 capitalize">{selectedVariant.color}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {colors.map((variant) => {
          const isSelected = variant.id === selectedVariantId || (
            selectedVariant?.color.toLowerCase() === variant.color.toLowerCase()
          )
          const isOutOfStock = variant.quantity === 0
          const colorCss = getColorStyle(variant.color)
          const isLight = ['white', 'cream', 'beige', 'silver', 'yellow'].includes(variant.color.toLowerCase())

          return (
            <button
              key={variant.id}
              onClick={() => !isOutOfStock && onSelect(variant)}
              disabled={isOutOfStock}
              title={`${variant.color}${isOutOfStock ? ' (Out of stock)' : ''}`}
              className={cn(
                'relative h-8 w-8 rounded-full border-2 transition-all',
                isSelected ? 'border-[oklch(0.60_0.22_35)] scale-110 shadow-md' : 'border-transparent hover:border-gray-400',
                isOutOfStock && 'opacity-40 cursor-not-allowed',
                isLight && 'border-gray-200'
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
