import React from 'react'
import Link from 'next/link'
import { SearchX } from 'lucide-react'
import { ProductCard } from './ProductCard'
import type { Product } from '@/types'

interface ProductGridProps {
  products: Product[]
  loading?: boolean
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-neutral-200/70 bg-white">
      <div className="aspect-[3/4] shimmer" />
      <div className="p-4 space-y-2.5">
        <div className="h-2.5 shimmer rounded w-1/3" />
        <div className="h-4 shimmer rounded w-3/4" />
        <div className="h-4 shimmer rounded w-1/2" />
      </div>
    </div>
  )
}

export function ProductGrid({ products, loading = false }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-up">
        <div className="h-16 w-16 rounded-full bg-brand-soft flex items-center justify-center mb-5">
          <SearchX className="h-7 w-7 text-brand" />
        </div>
        <p className="text-lg font-semibold text-ink font-[var(--font-display)]">No products found</p>
        <p className="text-sm text-neutral-500 mt-1.5 max-w-xs">
          We couldn&apos;t find anything matching your filters. Try widening your search.
        </p>
        <Link
          href="/products"
          className="mt-6 px-6 py-2.5 text-sm font-semibold rounded-full bg-ink text-white hover:bg-brand transition-colors"
        >
          Browse all products
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
      {products.map((product, i) => (
        <div key={product.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}>
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  )
}
