import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { api } from '@/lib/api'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { formatPrice, discountedPrice } from '@/lib/utils'
import type { Product, Category } from '@/types'
import { ChevronRight, Sparkles, Truck, Shield, RotateCcw } from 'lucide-react'

async function getHomeData() {
  try {
    const [productsRes, categoriesRes] = await Promise.all([
      api.get<{ data: Product[]; total: number }>('/api/products?limit=8&published=true'),
      api.get<Category[]>('/api/categories'),
    ])
    return {
      products: productsRes.data ?? [],
      categories: (categoriesRes ?? []).filter((c) => !c.parent_id),
    }
  } catch {
    return { products: [], categories: [] }
  }
}

const HERO_SLIDES = [
  {
    title: 'Handwoven Sarees',
    subtitle: 'From the looms of Tamil Nadu',
    description: 'Discover authentic Kanjivaram, Banarasi, and Chanderi sarees crafted by master weavers.',
    cta: 'Shop Sarees',
    href: '/products?type=saree',
    gradient: 'from-orange-900/70 to-red-900/50',
    emoji: '🌸',
  },
  {
    title: 'Designer Dresses',
    subtitle: 'Ethnic & contemporary wear',
    description: 'Elegant dresses for every occasion — festive, casual, and party styles.',
    cta: 'Shop Dresses',
    href: '/products?type=dress',
    gradient: 'from-yellow-900/70 to-green-900/50',
    emoji: '👗',
  },
  {
    title: 'Fine Jewellery',
    subtitle: 'Timeless elegance',
    description: 'Temple jewellery, bangles, and necklace sets crafted in 22k and 18k gold.',
    cta: 'View Jewellery',
    href: '/products?type=jewellery',
    gradient: 'from-yellow-800/70 to-amber-900/50',
    emoji: '✨',
  },
]

export default async function HomePage() {
  const { products, categories } = await getHomeData()

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-3 gap-6">
            {HERO_SLIDES.map((slide, i) => (
              <Link
                key={i}
                href={slide.href}
                className={`group relative rounded-2xl overflow-hidden bg-gradient-to-br ${slide.gradient} aspect-[4/3] flex flex-col justify-end p-6 hover:shadow-xl transition-shadow`}
                style={{
                  background: i === 0
                    ? 'linear-gradient(135deg, oklch(0.35 0.15 35), oklch(0.55 0.20 25))'
                    : i === 1
                    ? 'linear-gradient(135deg, oklch(0.45 0.15 130), oklch(0.60 0.18 145))'
                    : 'linear-gradient(135deg, oklch(0.50 0.18 75), oklch(0.65 0.22 85))',
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-10 text-[8rem]">
                  {slide.emoji}
                </div>
                <div className="relative z-10">
                  <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-1">
                    {slide.subtitle}
                  </p>
                  <h2 className="text-white text-2xl font-bold mb-2">{slide.title}</h2>
                  <p className="text-white/80 text-sm mb-4 hidden lg:block">{slide.description}</p>
                  <span className="inline-flex items-center gap-1 text-white text-sm font-semibold group-hover:gap-2 transition-all">
                    {slide.cta} <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <div className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm text-gray-600">
            <div className="flex items-center justify-center gap-2">
              <Truck className="h-5 w-5 text-[oklch(0.60_0.22_35)]" />
              <span>Free shipping above ₹999</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-[oklch(0.60_0.22_35)]" />
              <span>Secure payments</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <RotateCcw className="h-5 w-5 text-[oklch(0.60_0.22_35)]" />
              <span>Easy 7-day returns</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-[oklch(0.60_0.22_35)]" />
              <span>100% Authentic</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Cards */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
            <Link href="/products" className="text-sm text-[oklch(0.60_0.22_35)] font-medium hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.slice(0, 4).map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="group relative rounded-xl overflow-hidden aspect-square bg-gray-100 hover:shadow-md transition-shadow"
              >
                {cat.image_url ? (
                  <Image
                    src={cat.image_url}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-orange-100 to-amber-50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-white font-semibold text-sm">{cat.name}</h3>
                  {cat.description && (
                    <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{cat.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <p className="text-sm text-gray-500 mt-1">Handpicked for you</p>
          </div>
          <Link
            href="/products"
            className="text-sm text-[oklch(0.60_0.22_35)] font-medium hover:underline flex items-center gap-1"
          >
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <ProductGrid products={products} />
      </section>

      {/* Banner CTA */}
      <section className="bg-[oklch(0.60_0.22_35)] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-3xl font-bold mb-3">Explore Our Full Collection</h2>
          <p className="text-white/80 mb-6 max-w-lg mx-auto">
            Over 500 styles of sarees, designer dresses, and fine jewellery — all with free shipping.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-white text-[oklch(0.60_0.22_35)] font-semibold px-6 py-3 rounded-full hover:bg-orange-50 transition-colors"
          >
            Shop Now <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
