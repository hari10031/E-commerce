import React, { Suspense } from 'react'
import { api } from '@/lib/api'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { CategoryFilter } from '@/components/shop/CategoryFilter'
import type { Product } from '@/types'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SearchParams {
  type?: string
  category?: string
  search?: string
  minPrice?: string
  maxPrice?: string
  page?: string
  sort?: string
}

interface PageProps {
  searchParams: Promise<SearchParams>
}

async function getProducts(params: SearchParams) {
  const query = new URLSearchParams()
  if (params.type) query.set('type', params.type)
  if (params.category) query.set('category', params.category)
  if (params.search) query.set('search', params.search)
  if (params.minPrice) query.set('minPrice', params.minPrice)
  if (params.maxPrice) query.set('maxPrice', params.maxPrice)
  if (params.sort) query.set('sort', params.sort)
  query.set('page', params.page ?? '1')
  query.set('limit', '20')
  query.set('published', 'true')

  try {
    const res = await api.get<{ data: Product[]; total: number; page: number; totalPages: number }>(
      `/api/products?${query.toString()}`
    )
    return res
  } catch {
    return { data: [], total: 0, page: 1, totalPages: 1 }
  }
}

function PaginationBar({ currentPage, totalPages, searchParams }: { currentPage: number; totalPages: number; searchParams: SearchParams }) {
  function buildHref(page: number) {
    const p = new URLSearchParams(searchParams as Record<string, string>)
    p.set('page', String(page))
    return `/products?${p.toString()}`
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      {currentPage > 1 && (
        <Link href={buildHref(currentPage - 1)} className="h-10 w-10 flex items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:border-brand hover:text-brand transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}

      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        const page = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i
        return (
          <Link
            key={page}
            href={buildHref(page)}
            className={`h-10 w-10 flex items-center justify-center rounded-full text-sm font-semibold transition-colors ${
              page === currentPage
                ? 'bg-ink text-white'
                : 'border border-neutral-200 text-neutral-600 hover:border-brand hover:text-brand'
            }`}
          >
            {page}
          </Link>
        )
      })}

      {currentPage < totalPages && (
        <Link href={buildHref(currentPage + 1)} className="h-10 w-10 flex items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:border-brand hover:text-brand transition-colors">
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { data: products, total, page, totalPages } = await getProducts(params)

  const typeLabel = params.type ? params.type.charAt(0).toUpperCase() + params.type.slice(1) : null
  const title = params.search
    ? `“${params.search}”`
    : typeLabel
    ? `${typeLabel} Collection`
    : 'All Products'
  const eyebrow = params.search ? 'Search Results' : 'Curated Selection'

  return (
    <div>
      {/* Page header */}
      <div className="bg-gradient-to-b from-brand-soft/60 to-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-center">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-ink font-[var(--font-display)] mt-2">
            {title}
          </h1>
          <p className="text-sm text-neutral-500 mt-3">
            {total} {total === 1 ? 'piece' : 'pieces'} crafted for you
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 lg:pb-8">
        <div className="flex gap-6 lg:gap-8">
          {/* Sidebar */}
          <Suspense fallback={<div className="hidden lg:block w-64 shrink-0" />}>
            <CategoryFilter />
          </Suspense>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <ProductGrid products={products} />
            <PaginationBar currentPage={page} totalPages={totalPages} searchParams={params} />
          </div>
        </div>
      </div>
    </div>
  )
}
