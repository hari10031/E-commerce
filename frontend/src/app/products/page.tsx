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
    <div className="flex items-center justify-center gap-2 mt-8">
      {currentPage > 1 && (
        <Link href={buildHref(currentPage - 1)} className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}

      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        const page = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i
        return (
          <Link
            key={page}
            href={buildHref(page)}
            className={`h-9 w-9 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
              page === currentPage
                ? 'bg-[oklch(0.60_0.22_35)] text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {page}
          </Link>
        )
      })}

      {currentPage < totalPages && (
        <Link href={buildHref(currentPage + 1)} className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors">
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {params.search
            ? `Search: "${params.search}"`
            : typeLabel
            ? `${typeLabel} Collection`
            : 'All Products'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{total} products</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <Suspense fallback={<div className="w-64 shrink-0" />}>
          <CategoryFilter />
        </Suspense>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <ProductGrid products={products} />
          <PaginationBar currentPage={page} totalPages={totalPages} searchParams={params} />
        </div>
      </div>
    </div>
  )
}
