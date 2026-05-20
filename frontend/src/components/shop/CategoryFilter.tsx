'use client'

import React, { useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const PRODUCT_TYPES = [
  { value: 'saree', label: 'Sarees' },
  { value: 'dress', label: 'Dresses' },
  { value: 'jewellery', label: 'Jewellery' },
]

const SORT_OPTIONS = [
  { value: '', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
]

export function CategoryFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const selectedTypes = searchParams.get('type')?.split(',').filter(Boolean) ?? []
  const sort = searchParams.get('sort') ?? ''
  const minPrice = searchParams.get('minPrice') ?? '0'
  const maxPrice = searchParams.get('maxPrice') ?? '50000'

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  function toggleType(type: string) {
    let newTypes: string[]
    if (selectedTypes.includes(type)) {
      newTypes = selectedTypes.filter((t) => t !== type)
    } else {
      newTypes = [...selectedTypes, type]
    }
    updateParam('type', newTypes.join(',') || null)
  }

  return (
    <aside className="w-64 shrink-0 space-y-6">
      {/* Product Type */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Product Type</h3>
        <div className="space-y-2">
          {PRODUCT_TYPES.map((pt) => (
            <label key={pt.value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedTypes.includes(pt.value)}
                onChange={() => toggleType(pt.value)}
                className="h-4 w-4 rounded border-gray-300 text-[oklch(0.60_0.22_35)] focus:ring-[oklch(0.60_0.22_35)]"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900">{pt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Price Range</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Min (₹)</label>
              <input
                type="number"
                value={minPrice}
                min={0}
                max={50000}
                step={500}
                onChange={(e) => updateParam('minPrice', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-[oklch(0.60_0.22_35)]"
              />
            </div>
            <span className="text-gray-400 mt-5">–</span>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Max (₹)</label>
              <input
                type="number"
                value={maxPrice}
                min={0}
                max={500000}
                step={500}
                onChange={(e) => updateParam('maxPrice', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-[oklch(0.60_0.22_35)]"
              />
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={50000}
            step={500}
            value={maxPrice}
            onChange={(e) => updateParam('maxPrice', e.target.value)}
            className="w-full accent-[oklch(0.60_0.22_35)]"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>₹0</span>
            <span>₹50,000+</span>
          </div>
        </div>
      </div>

      {/* Sort */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Sort By</h3>
        <div className="space-y-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateParam('sort', opt.value)}
              className={cn(
                'w-full text-left px-3 py-2 text-sm rounded-md transition-colors',
                sort === opt.value
                  ? 'bg-[oklch(0.60_0.22_35)] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear filters */}
      {(selectedTypes.length > 0 || sort || minPrice !== '0' || maxPrice !== '50000') && (
        <button
          onClick={() => router.push(pathname)}
          className="w-full py-2 text-sm text-[oklch(0.60_0.22_35)] border border-[oklch(0.60_0.22_35)] rounded-md hover:bg-orange-50 transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </aside>
  )
}
