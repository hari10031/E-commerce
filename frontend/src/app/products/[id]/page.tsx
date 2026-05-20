import React from 'react'
import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import { ImageGallery } from '@/components/shop/ImageGallery'
import { AddToCartSection } from './AddToCartSection'
import { formatPrice, discountedPrice } from '@/lib/utils'
import type { Product } from '@/types'
import Link from 'next/link'
import { ChevronRight, Tag } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getProduct(id: string): Promise<Product | null> {
  try {
    return await api.get<Product>(`/api/products/${id}`)
  } catch {
    return null
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) notFound()

  const finalPrice = discountedPrice(product.base_price, product.discount_pct)
  const hasDiscount = product.discount_pct > 0
  const savings = product.base_price - finalPrice

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-800">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/products" className="hover:text-gray-800">Products</Link>
        {product.category && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link href={`/category/${product.category.slug}`} className="hover:text-gray-800">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-800 truncate max-w-xs">{product.title}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Left: Images */}
        <div>
          <ImageGallery images={product.images ?? []} title={product.title} />
        </div>

        {/* Right: Details */}
        <div className="space-y-6">
          {/* Title & category */}
          {product.category && (
            <p className="text-sm font-medium text-[oklch(0.60_0.22_35)] uppercase tracking-wide">
              {product.category.name}
            </p>
          )}
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">{product.title}</h1>

          {/* Pricing */}
          <div className="space-y-1">
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-gray-900">{formatPrice(finalPrice)}</span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-gray-400 line-through mb-1">
                    {formatPrice(product.base_price)}
                  </span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-sm font-bold rounded-full mb-1">
                    {product.discount_pct}% OFF
                  </span>
                </>
              )}
            </div>
            {hasDiscount && (
              <p className="text-sm text-green-600">You save {formatPrice(savings)}</p>
            )}
          </div>

          {/* Coupon */}
          {product.coupon_code && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
              <Tag className="h-4 w-4 text-[oklch(0.60_0.22_35)]" />
              <div>
                <span className="text-sm font-medium text-gray-700">Use code </span>
                <span className="text-sm font-bold text-[oklch(0.60_0.22_35)] bg-orange-100 px-1.5 py-0.5 rounded font-mono">
                  {product.coupon_code}
                </span>
                {product.coupon_disc && (
                  <span className="text-sm text-gray-600 ml-1">
                    for extra {product.coupon_disc}% off
                  </span>
                )}
              </div>
            </div>
          )}

          <hr className="border-gray-100" />

          {/* Add to cart section */}
          <AddToCartSection product={product} />

          <hr className="border-gray-100" />

          {/* Description */}
          {product.description && (
            <div>
              <h2 className="text-base font-semibold text-gray-800 mb-2">Description</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Variants table */}
          {product.variants && product.variants.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-gray-800 mb-3">Available Variants</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 pr-4 font-medium text-gray-600">Color</th>
                      <th className="text-left py-2 pr-4 font-medium text-gray-600">Size</th>
                      <th className="text-left py-2 pr-4 font-medium text-gray-600">SKU</th>
                      <th className="text-left py-2 font-medium text-gray-600">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((v) => (
                      <tr key={v.id} className="border-b border-gray-100">
                        <td className="py-2 pr-4 capitalize text-gray-700">{v.color}</td>
                        <td className="py-2 pr-4 text-gray-700">{v.size}</td>
                        <td className="py-2 pr-4 text-gray-500 font-mono text-xs">{v.sku}</td>
                        <td className="py-2">
                          {v.quantity > 0 ? (
                            <span className="text-green-600">{v.quantity}</span>
                          ) : (
                            <span className="text-red-500">Out of stock</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
