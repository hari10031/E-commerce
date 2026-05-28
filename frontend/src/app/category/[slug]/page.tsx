import React from 'react'
import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import { ProductGrid } from '@/components/shop/ProductGrid'
import type { Product, Category } from '@/types'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import Image from 'next/image'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getCategoryData(slug: string) {
  try {
    const category = await api.get<Category>(`/api/categories/${slug}`)
    const productsRes = await api.get<{ data: Product[] }>(
      `/api/products?category=${category.id}&published=true&limit=40`
    )
    return { category, products: productsRes.data ?? [] }
  } catch {
    return null
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params
  const data = await getCategoryData(slug)

  if (!data) notFound()

  const { category, products } = data

  return (
    <div>
      {/* Hero */}
      <div className="relative bg-[var(--color-ink)] overflow-hidden">
        {category.image_url && (
          <Image
            src={category.image_url}
            alt={category.name}
            fill
            className="object-cover opacity-25"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-ink)] via-[var(--color-ink)]/70 to-[var(--color-ink)]/40" />
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
          <nav className="flex items-center gap-1 text-xs sm:text-[13px] text-white/50 mb-4 sm:mb-5 overflow-x-auto no-scrollbar">
            <Link href="/" className="hover:text-[var(--color-gold)] transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/products" className="hover:text-[var(--color-gold)] transition-colors">Products</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/80">{category.name}</span>
          </nav>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-gold)]">
            Collection
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white font-[var(--font-display)] mt-2">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-white/60 mt-3 max-w-xl text-sm leading-relaxed">{category.description}</p>
          )}
          <p className="text-sm text-white/40 mt-4">
            {products.length} {products.length === 1 ? 'piece' : 'pieces'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-safe">
        <ProductGrid products={products} />
      </div>
    </div>
  )
}
