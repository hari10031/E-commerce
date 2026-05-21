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
      <div className="bg-white border-y border-gray-100 shadow-sm relative z-25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-sm text-gray-600">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 text-center sm:text-left">
              <div className="p-2 rounded-full bg-orange-50 shrink-0">
                <Truck className="h-5 w-5 text-[oklch(0.60_0.22_35)]" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-xs uppercase tracking-wider">Free Shipping</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Above ₹999 on all items</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 text-center sm:text-left">
              <div className="p-2 rounded-full bg-orange-50 shrink-0">
                <Shield className="h-5 w-5 text-[oklch(0.60_0.22_35)]" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-xs uppercase tracking-wider">Secure Payments</p>
                <p className="text-[11px] text-gray-400 mt-0.5">100% Encrypted transactions</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 text-center sm:text-left">
              <div className="p-2 rounded-full bg-orange-50 shrink-0">
                <RotateCcw className="h-5 w-5 text-[oklch(0.60_0.22_35)]" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-xs uppercase tracking-wider">Easy Returns</p>
                <p className="text-[11px] text-gray-400 mt-0.5">7-day hassle-free policy</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 text-center sm:text-left">
              <div className="p-2 rounded-full bg-orange-50 shrink-0">
                <Sparkles className="h-5 w-5 text-[oklch(0.60_0.22_35)]" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-xs uppercase tracking-wider">100% Authentic</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Directly sourced weaves</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Wise Product Showcase */}
      <CategoryShowcase products={products} categories={categories} />

      {/* Banner CTA */}
      <section className="bg-gradient-to-br from-[oklch(0.60_0.22_35)] to-[oklch(0.50_0.22_35)] text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold font-display tracking-wide mb-4">Explore Our Full Heritage Collection</h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto text-sm sm:text-base font-light leading-relaxed">
            Choose from over 500 styles of traditional silk sarees, designer suits, and gold temple jewellery — all with secure payments and fast delivery.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-white text-[oklch(0.60_0.22_35)] font-semibold px-8 py-3.5 rounded-md hover:bg-orange-50 transition-colors shadow-lg uppercase tracking-wider text-xs"
          >
            Shop Entire Catalog <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}

