'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import type { Category } from '@/types'

const PRODUCT_TYPES = [
  { value: 'saree', label: 'Sarees' },
  { value: 'jewellery', label: 'Jewellery' },
]

const SORT_OPTIONS = [
  { value: '', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
]

const PRICE_PRESETS = [
  { label: 'Under ₹2K', min: '0', max: '2000' },
  { label: '₹2K – ₹5K', min: '2000', max: '5000' },
  { label: '₹5K – ₹10K', min: '5000', max: '10000' },
  { label: '₹10K – ₹25K', min: '10000', max: '25000' },
  { label: '₹25K – ₹50K', min: '25000', max: '50000' },
  { label: '₹50K+', min: '50000', max: '500000' },
]

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink mb-3.5">
      {children}
    </h3>
  )
}

export function CategoryFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    api.get<Category[]>('/api/categories')
      .then(setCategories)
      .catch((err) => console.error('Failed to load categories', err))
  }, [])

  const selectedTypes = searchParams.get('type')?.split(',').filter(Boolean) ?? []
  const selectedCategories = searchParams.get('category')?.split(',').filter(Boolean) ?? []
  const sort = searchParams.get('sort') ?? ''
  const minPrice = searchParams.get('minPrice') ?? '0'
  const maxPrice = searchParams.get('maxPrice') ?? '200000'

  const hasActiveFilters =
    selectedTypes.length > 0 ||
    selectedCategories.length > 0 ||
    !!sort ||
    minPrice !== '0' ||
    maxPrice !== '200000'

  const pushParams = useCallback(
    (params: URLSearchParams) => {
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname]
  )

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null || value === '') params.delete(key)
      else params.set(key, value)
      pushParams(params)
    },
    [searchParams, pushParams]
  )

  // Toggle a product type. Deselecting a type also drops its sub-category filters.
  function toggleType(typeValue: string, subCatIds: string[]) {
    const params = new URLSearchParams(searchParams.toString())
    const isSelected = selectedTypes.includes(typeValue)

    const newTypes = isSelected
      ? selectedTypes.filter((t) => t !== typeValue)
      : [...selectedTypes, typeValue]
    if (newTypes.length) params.set('type', newTypes.join(','))
    else params.delete('type')

    if (isSelected) {
      const newCats = selectedCategories.filter((c) => !subCatIds.includes(c))
      if (newCats.length) params.set('category', newCats.join(','))
      else params.delete('category')
    }
    pushParams(params)
  }

  // Toggle one sub-category. Multiple sub-categories can be active at once.
  function toggleSubcategory(subId: string, typeValue: string) {
    const params = new URLSearchParams(searchParams.toString())
    const isSelected = selectedCategories.includes(subId)

    const newCats = isSelected
      ? selectedCategories.filter((c) => c !== subId)
      : [...selectedCategories, subId]
    if (newCats.length) params.set('category', newCats.join(','))
    else params.delete('category')

    // Adding a sub-category implies its parent type is in scope.
    if (!isSelected && !selectedTypes.includes(typeValue)) {
      params.set('type', [...selectedTypes, typeValue].join(','))
    }
    pushParams(params)
  }

  function FilterBody() {
    return (
      <div className="space-y-7">
        {/* Categories */}
        <div>
          <SectionTitle>Categories</SectionTitle>
          <div className="space-y-4">
            {PRODUCT_TYPES.map((pt) => {
              const rootCat = categories.find((c) => c.slug === pt.value)
              const subCats = rootCat ? categories.filter((c) => c.parent_id === rootCat.id) : []
              const subCatIds = subCats.map((c) => c.id)
              const isTypeSelected = selectedTypes.includes(pt.value)

              return (
                <div key={pt.value} className="space-y-2.5">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={isTypeSelected}
                      onChange={() => toggleType(pt.value, subCatIds)}
                      className="h-4 w-4 rounded border-neutral-300 text-brand focus:ring-brand/30"
                    />
                    <span className="text-sm font-medium text-neutral-700 group-hover:text-ink transition-colors">
                      {pt.label}
                    </span>
                  </label>

                  {/* Sub-categories — multi-select chips */}
                  {subCats.length > 0 && (isTypeSelected || selectedTypes.length === 0) && (
                    <div className="flex flex-wrap gap-1.5 pl-6">
                      {subCats.map((sub) => {
                        const isSubSelected = selectedCategories.includes(sub.id)
                        return (
                          <button
                            key={sub.id}
                            onClick={() => toggleSubcategory(sub.id, pt.value)}
                            className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] border transition-all',
                              isSubSelected
                                ? 'bg-brand text-white border-brand'
                                : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-ink'
                            )}
                          >
                            {isSubSelected && <Check className="h-3 w-3" />}
                            {sub.name}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="h-px bg-neutral-100" />

        {/* Price Range */}
        <div>
          <SectionTitle>Price Range</SectionTitle>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[11px] text-neutral-400 mb-1 block">Min (₹)</label>
                <input
                  type="number"
                  value={minPrice}
                  min={0}
                  max={200000}
                  step={500}
                  onChange={(e) => updateParam('minPrice', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                />
              </div>
              <span className="text-neutral-300 mt-5">–</span>
              <div className="flex-1">
                <label className="text-[11px] text-neutral-400 mb-1 block">Max (₹)</label>
                <input
                  type="number"
                  value={maxPrice}
                  min={0}
                  max={500000}
                  step={500}
                  onChange={(e) => updateParam('maxPrice', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={200000}
              step={1000}
              value={Number(maxPrice) > 200000 ? 200000 : maxPrice}
              onChange={(e) => updateParam('maxPrice', e.target.value)}
              className="w-full accent-brand"
            />
            <div className="grid grid-cols-2 gap-2">
              {PRICE_PRESETS.map((preset, idx) => {
                const isPresetActive = minPrice === preset.min && maxPrice === preset.max
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString())
                      if (isPresetActive) {
                        params.delete('minPrice')
                        params.delete('maxPrice')
                      } else {
                        params.set('minPrice', preset.min)
                        params.set('maxPrice', preset.max)
                      }
                      pushParams(params)
                    }}
                    className={cn(
                      'py-1.5 px-2 text-[11px] rounded-lg border transition-all text-center',
                      isPresetActive
                        ? 'bg-brand-soft border-brand text-brand font-semibold'
                        : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-ink'
                    )}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="h-px bg-neutral-100" />

        {/* Sort */}
        <div>
          <SectionTitle>Sort By</SectionTitle>
          <div className="space-y-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateParam('sort', opt.value)}
                className={cn(
                  'w-full text-left px-3 py-2 text-[13px] rounded-lg transition-colors',
                  sort === opt.value
                    ? 'bg-ink text-white font-medium'
                    : 'text-neutral-600 hover:bg-neutral-100'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => router.push(pathname)}
            className="w-full py-2.5 text-sm font-semibold text-brand border border-brand/40 rounded-full hover:bg-brand-soft transition-colors"
          >
            Clear All Filters
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-28 rounded-2xl border border-neutral-200/70 bg-white p-6">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-neutral-100">
            <SlidersHorizontal className="h-4 w-4 text-brand" />
            <span className="text-sm font-semibold text-ink">Refine</span>
          </div>
          <FilterBody />
        </div>
      </aside>

      {/* Mobile filter trigger */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="lg:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-5 py-3 rounded-full bg-ink text-white text-sm font-semibold shadow-[0_12px_30px_-8px_rgba(0,0,0,0.5)]"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-[var(--color-gold)]" />}
      </button>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative ml-auto w-[85%] max-w-sm h-full bg-white shadow-2xl overflow-y-auto animate-fade-in">
            <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-neutral-100 z-10">
              <span className="text-base font-semibold text-ink font-[var(--font-display)]">Refine</span>
              <button onClick={() => setDrawerOpen(false)} className="p-1.5 text-neutral-500 hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 pb-safe">
              <FilterBody />
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-full mt-6 py-3.5 min-h-[48px] text-sm font-semibold rounded-full bg-brand text-white hover:bg-brand-dark transition-colors"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
