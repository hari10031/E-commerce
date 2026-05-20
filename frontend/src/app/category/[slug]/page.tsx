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
      <div className="relative bg-gradient-to-br from-orange-50 to-amber-100 overflow-hidden">
        {category.image_url && (
          <Image
            src={category.image_url}
            alt={category.name}
            fill
            className="object-cover opacity-20"
          />
        )}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <nav className="flex items-center gap-1 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-gray-800">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/products" className="hover:text-gray-800">Products</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-800">{category.name}</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
          {category.description && (
            <p className="text-gray-600 mt-2 max-w-xl">{category.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">{products.length} products</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ProductGrid products={products} />
      </div>
    </div>
  )
}
