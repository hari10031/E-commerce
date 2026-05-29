import React from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { HeroSlider } from '@/components/shop/hero-slider'
import { CategoryShowcase } from '@/components/shop/CategoryShowcase'
import type { Product, Category } from '@/types'
import { ChevronRight, Sparkles, Truck, Shield, RotateCcw } from 'lucide-react'

async function getHomeData() {
  try {
    const [productsRes, categoriesRes] = await Promise.all([
      api.get<{ data: Product[]; total: number }>('/api/products?limit=100&published=true'),
      api.get<Category[]>('/api/categories'),
    ])
    return {
      products: productsRes.data ?? [],
      categories: categoriesRes ?? [],
    }
  } catch {
    return { products: [], categories: [] }
  }
}

export default async function HomePage() {
  const { products, categories } = await getHomeData()

  return (
    <div className="pb-12">
      {/* Luxury Hero Slider Section */}
      <HeroSlider />

      {/* Trust Badges */}
      <div className="bg-white border-y border-neutral-100 relative z-25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: Truck, title: 'Free Shipping', sub: 'Above ₹999 on all items' },
              { icon: Shield, title: 'Secure Payments', sub: '100% encrypted transactions' },
              { icon: RotateCcw, title: 'Easy Returns', sub: '7-day hassle-free policy' },
              { icon: Sparkles, title: '100% Authentic', sub: 'Directly sourced weaves' },
            ].map(({ icon: Icon, title, sub }) => (
              <div
                key={title}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left"
              >
                <div className="h-10 w-10 rounded-full bg-brand-soft flex items-center justify-center shrink-0">
                  <Icon className="h-[1.15rem] w-[1.15rem] text-brand" />
                </div>
                <div>
                  <p className="font-semibold text-ink text-xs uppercase tracking-[0.12em]">{title}</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Wise Product Showcase */}
      <CategoryShowcase products={products} categories={categories} />

      {/* Banner CTA */}
      <section className="relative bg-[var(--color-ink)] text-white mt-12 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand/25 blur-3xl" />
        <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-[var(--color-gold)]/10 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-gold)]">
            The Yuvarani Silks Edit
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold font-[var(--font-display)] mt-3 mb-4">
            Explore Our Full Heritage Collection
          </h2>
          <p className="text-white/55 mb-9 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Over 500 styles of traditional silk sarees, designer ensembles, and temple
            gold jewellery — secure payments and swift delivery, every time.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-white text-ink font-semibold px-8 py-4 rounded-full hover:bg-[var(--color-gold)] transition-colors text-xs uppercase tracking-[0.14em]"
          >
            Shop Entire Catalogue <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}

