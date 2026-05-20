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
      <span className="text-sm font-medium text-gray-700 block mb-2">Size:</span>
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
                'px-3 py-1.5 text-sm rounded-md border transition-all font-medium',
                isSelected
                  ? 'border-[oklch(0.60_0.22_35)] bg-[oklch(0.60_0.22_35)] text-white'
                  : 'border-gray-300 text-gray-700 hover:border-[oklch(0.60_0.22_35)] hover:text-[oklch(0.60_0.22_35)]',
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
