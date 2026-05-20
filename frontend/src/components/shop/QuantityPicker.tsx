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
    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-fit">
      <button
        onClick={decrement}
        disabled={value <= min}
        className={cn(
          'h-9 w-9 flex items-center justify-center text-gray-600 transition-colors',
          value <= min ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100'
        )}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="h-9 w-10 flex items-center justify-center text-sm font-semibold text-gray-800 border-x border-gray-300">
        {value}
      </span>
      <button
        onClick={increment}
        disabled={value >= max}
        className={cn(
          'h-9 w-9 flex items-center justify-center text-gray-600 transition-colors',
          value >= max ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100'
        )}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
