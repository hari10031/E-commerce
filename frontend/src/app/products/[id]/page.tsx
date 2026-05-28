import React from 'react'
import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import { ImageGallery } from '@/components/shop/ImageGallery'
import { AddToCartSection } from './AddToCartSection'
import { formatPrice, discountedPrice } from '@/lib/utils'
import type { Product } from '@/types'
import Link from 'next/link'
import { ChevronRight, Tag, Truck, ShieldCheck, RotateCcw } from 'lucide-react'

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

const ASSURANCES = [
  { icon: Truck, label: 'Free shipping', sub: 'On orders above ₹999' },
  { icon: ShieldCheck, label: 'Authentic', sub: 'Directly sourced' },
  { icon: RotateCcw, label: 'Easy returns', sub: '7-day policy' },
]

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) notFound()

  const finalPrice = discountedPrice(product.base_price, product.discount_pct)
  const hasDiscount = product.discount_pct > 0
  const savings = product.base_price - finalPrice

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs sm:text-[13px] text-neutral-400 mb-5 sm:mb-7 overflow-x-auto no-scrollbar">
        <Link href="/" className="hover:text-brand transition-colors shrink-0">Home</Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <Link href="/products" className="hover:text-brand transition-colors shrink-0">Products</Link>
        {product.category && (
          <>
            <ChevronRight className="h-3 w-3 shrink-0 hidden sm:inline" />
            <Link
              href={`/category/${product.category.slug}`}
              className="hover:text-brand transition-colors shrink-0 hidden sm:inline"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3 shrink-0" />
        <span className="text-neutral-600 truncate min-w-0">{product.title}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-14">
        {/* Left: Images */}
        <div className="animate-fade-in">
          <ImageGallery images={product.images ?? []} title={product.title} />
        </div>

        {/* Right: Details */}
        <div className="space-y-6 animate-fade-up">
          {/* Title & category */}
          <div>
            {product.category && (
              <p className="eyebrow">{product.category.name}</p>
            )}
            <h1 className="text-2xl sm:text-3xl md:text-[2.5rem] leading-tight font-semibold text-ink font-[var(--font-display)] mt-2">
              {product.title}
            </h1>
          </div>

          {/* Pricing */}
          <div className="space-y-1.5">
            <div className="flex items-end gap-3 flex-wrap">
              <span className="text-3xl sm:text-4xl font-bold text-ink">{formatPrice(finalPrice)}</span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-neutral-400 line-through mb-1">
                    {formatPrice(product.base_price)}
                  </span>
                  <span className="px-2.5 py-1 bg-brand-accent/15 text-brand-accent text-xs font-bold rounded-full mb-1.5">
                    {product.discount_pct}% OFF
                  </span>
                </>
              )}
            </div>
            {hasDiscount && (
              <p className="text-sm text-brand-accent font-medium">You save {formatPrice(savings)}</p>
            )}
            <p className="text-xs text-neutral-400">Inclusive of all taxes</p>
          </div>

          {/* Coupon */}
          {product.coupon_code && (
            <div className="flex items-center gap-3 bg-brand-soft border border-brand/20 rounded-xl p-3.5">
              <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center shrink-0">
                <Tag className="h-4 w-4 text-brand" />
              </div>
              <div className="text-sm">
                <span className="text-neutral-600">Use code </span>
                <span className="font-bold text-brand bg-white px-1.5 py-0.5 rounded font-mono text-xs">
                  {product.coupon_code}
                </span>
                {product.coupon_disc && (
                  <span className="text-neutral-600"> for extra {product.coupon_disc}% off</span>
                )}
              </div>
            </div>
          )}

          <div className="gold-rule" />

          {/* Add to cart section */}
          <AddToCartSection product={product} />

          {/* Assurances */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
            {ASSURANCES.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="text-center rounded-xl border border-neutral-200/70 py-3 px-1.5 sm:py-3.5 sm:px-2">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-brand mx-auto mb-1 sm:mb-1.5" />
                <p className="text-[10px] sm:text-xs font-semibold text-ink leading-tight">{label}</p>
                <p className="text-[9px] sm:text-[10px] text-neutral-400 mt-0.5 leading-tight hidden sm:block">{sub}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {product.description && (
            <div className="pt-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink mb-2.5">
                Description
              </h2>
              <p className="text-sm text-neutral-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Variants table */}
          {product.variants && product.variants.length > 0 && (
            <div className="pt-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink mb-3">
                Available Variants
              </h2>
              <div className="overflow-x-auto rounded-xl border border-neutral-200/70 -mx-1 px-1 sm:mx-0 sm:px-0">
                <table className="w-full text-sm min-w-[28rem]">
                  <thead>
                    <tr className="bg-neutral-50 text-left text-xs text-neutral-500">
                      <th className="py-2.5 px-4 font-medium">Colour</th>
                      <th className="py-2.5 px-4 font-medium">Size</th>
                      <th className="py-2.5 px-4 font-medium">SKU</th>
                      <th className="py-2.5 px-4 font-medium">Availability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((v) => (
                      <tr key={v.id} className="border-t border-neutral-100">
                        <td className="py-2.5 px-4 capitalize text-neutral-700">{v.color}</td>
                        <td className="py-2.5 px-4 text-neutral-700">{v.size}</td>
                        <td className="py-2.5 px-4 text-neutral-400 font-mono text-xs">{v.sku}</td>
                        <td className="py-2.5 px-4">
                          {v.quantity > 0 ? (
                            <span className="text-brand-accent font-medium">In stock</span>
                          ) : (
                            <span className="text-red-500 font-medium">Out of stock</span>
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
