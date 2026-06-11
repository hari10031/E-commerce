'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { resolveColorHex, isLightColor } from '@/lib/colors'
import type { Variant } from '@/types'

interface ColorSwatchSelectorProps {
  variants: Variant[]
  selectedVariantId: string | null
  onSelect: (variant: Variant) => void
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
          const colorCss = resolveColorHex(variant.color)
          const isLight = isLightColor(variant.color)

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
