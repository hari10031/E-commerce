'use client'

import React, { useMemo } from 'react'
import Image from 'next/image'
import type { Product, Category } from '@/types'
import { Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface CategoryShowcaseProps {
  products: Product[]
  categories: Category[]
}

export function CategoryShowcase({ products, categories }: CategoryShowcaseProps) {
  // Find root categories
  const sareeRoot = useMemo(() => categories.find((c) => c.slug === 'saree'), [categories])
  const jewelleryRoot = useMemo(() => categories.find((c) => c.slug === 'jewellery'), [categories])

  // Get subcategories for each root
  const sareeSubs = useMemo(() => {
    return sareeRoot ? categories.filter((c) => c.parent_id === sareeRoot.id) : []
  }, [categories, sareeRoot])

  const jewellerySubs = useMemo(() => {
    return jewelleryRoot ? categories.filter((c) => c.parent_id === jewelleryRoot.id) : []
  }, [categories, jewelleryRoot])

  // Helper to find cover image from any product belonging to a subcategory
  const getSubcategoryImage = (subCatId: string, typeKey: string) => {
    const product = products.find((p) => p.category?.id === subCatId)
    if (product && product.images && product.images.length > 0) {
      const primary = product.images.find(img => img.is_primary) || product.images[0]
      return primary.url
    }
    // High-quality fallback matching category type
    const fallbacks: Record<string, string> = {
      saree: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop',
      jewellery: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop'
    }
    return fallbacks[typeKey] || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop'
  }

  // Render a Category Section
  function renderSection(
    title: string,
    subtitle: string,
    description: string,
    typeKey: 'saree' | 'jewellery',
    subCats: Category[]
  ) {
    return (
      <section className="py-10 sm:py-14 lg:py-16 border-b border-gray-100 last:border-b-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              {subtitle && (
                <div className="inline-flex items-center gap-1 text-brand text-xs font-semibold uppercase tracking-wider mb-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{subtitle}</span>
                </div>
              )}
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-ink font-display">
                {title}
              </h2>
              <p className="text-sm text-neutral-500 mt-2 max-w-2xl font-light">
                {description}
              </p>
            </div>
            
            <Link
              href={`/products?type=${typeKey}`}
              className="group inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand hover:text-brand-dark transition-colors shrink-0"
            >
              View Full Collection
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Subcategory Slider — horizontal scroll, one row */}
          {subCats.length > 0 ? (
            <div className="flex gap-5 overflow-x-auto no-scrollbar pb-3 -mx-1 px-1 snap-x snap-mandatory">
              {subCats.map((cat) => {
                const coverImage = getSubcategoryImage(cat.id, typeKey)
                return (
                  <Link
                    key={cat.id}
                    href={`/products?type=${typeKey}&category=${cat.id}`}
                    className="group relative block w-[min(72vw,200px)] sm:w-[240px] md:w-[260px] shrink-0 snap-start aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-100/50 border border-brand-accent/15 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500"
                  >
                    <Image
                      src={coverImage}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover w-full h-full transition-transform duration-1000 group-hover:scale-110"
                    />
                    
                    {/* Elegant double overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10 opacity-90 transition-opacity duration-500 group-hover:opacity-95" />
                    
                    {/* Content inside card */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                      <h3 className="text-base sm:text-lg font-medium font-sans tracking-wide group-hover:text-[var(--color-gold)] transition-colors duration-300">
                        {cat.name}
                      </h3>
                      {cat.description && (
                        <p className="text-[10px] text-neutral-300 mt-1 line-clamp-1 font-light">
                          {cat.description}
                        </p>
                      )}
                      <p className="text-[9.5px] uppercase tracking-wider text-[var(--color-gold)] font-bold mt-2.5 translate-y-1 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-0.5">
                        Shop Now <span className="translate-y-[0.5px]">→</span>
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-12 text-center flex flex-col items-center">
              <span className="text-3xl mb-3">🌸</span>
              <h4 className="text-base font-semibold text-gray-800">Coming Soon</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                We are currently curating and handpicking the finest listings for this category. Check back shortly!
              </p>
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <div className="bg-white">
      {/* 1. Sarees Section */}
      {renderSection(
        'Saree Collections',
        '',
        'Discover our masterpieces woven in pure Kanjivaram, Banarasi, Chanderi, and soft Organzas by master weavers across India.',
        'saree',
        sareeSubs
      )}

      {/* 2. Jewellery Section */}
      {renderSection(
        'Fine Antique & Temple Jewellery',
        'Heritage Jewellery Collection',
        'Intricately designed temple necklaces, bangles, and jhumkas crafted in 22k gold to add a divine shimmer to your look.',
        'jewellery',
        jewellerySubs
      )}
    </div>
  )
}
