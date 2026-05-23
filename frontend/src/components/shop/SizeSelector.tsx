'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { Variant } from '@/types'

interface SizeSelectorProps {
  variants: Variant[]
  selectedColor: string | null
  selectedVariantId: string | null
  onSelect: (variant: Variant) => void
}

export function SizeSelector({ variants, selectedColor, selectedVariantId, onSelect }: SizeSelectorProps) {
  // Filter to variants of the selected color (or all if no color selected)
  const filtered = selectedColor
    ? variants.filter((v) => v.color.toLowerCase() === selectedColor.toLowerCase())
    : variants

  if (filtered.length === 0) return null

  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink block mb-2.5">Size</span>
      <div className="flex flex-wrap gap-2">
        {filtered.map((variant) => {
          const isSelected = variant.id === selectedVariantId
          const isOutOfStock = variant.quantity === 0

          return (
            <button
              key={variant.id}
              onClick={() => !isOutOfStock && onSelect(variant)}
              disabled={isOutOfStock}
              title={isOutOfStock ? 'Out of stock' : `${variant.quantity} in stock`}
              className={cn(
                'min-w-[3rem] px-3.5 py-2 text-sm rounded-xl border transition-all font-medium',
                isSelected
                  ? 'border-ink bg-ink text-white'
                  : 'border-neutral-200 text-neutral-700 hover:border-ink',
                isOutOfStock && 'opacity-40 cursor-not-allowed line-through'
              )}
            >
              {variant.size}
            </button>
          )
        })}
      </div>
    </div>
  )
}
