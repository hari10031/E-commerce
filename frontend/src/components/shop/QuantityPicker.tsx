'use client'

import React from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuantityPickerProps {
  value: number
  onChange: (val: number) => void
  min?: number
  max?: number
}

export function QuantityPicker({ value, onChange, min = 1, max = 10 }: QuantityPickerProps) {
  function decrement() {
    if (value > min) onChange(value - 1)
  }
  function increment() {
    if (value < max) onChange(value + 1)
  }

  return (
    <div className="flex items-center border border-neutral-200 rounded-full overflow-hidden w-fit bg-white">
      <button
        onClick={decrement}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className={cn(
          'h-9 w-9 flex items-center justify-center text-neutral-600 transition-colors',
          value <= min ? 'opacity-30 cursor-not-allowed' : 'hover:bg-brand-soft hover:text-brand'
        )}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="h-9 w-10 flex items-center justify-center text-sm font-semibold text-ink">
        {value}
      </span>
      <button
        onClick={increment}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={cn(
          'h-9 w-9 flex items-center justify-center text-neutral-600 transition-colors',
          value >= max ? 'opacity-30 cursor-not-allowed' : 'hover:bg-brand-soft hover:text-brand'
        )}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
