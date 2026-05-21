'use client'

import React, { useState, useMemo } from 'react'
import { ProductCard } from '@/components/shop/ProductCard'
import type { Product, Category } from '@/types'
import { Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface CategoryShowcaseProps {
  products: Product[]
  categories: Category[]
}

export function CategoryShowcase({ products, categories }: CategoryShowcaseProps) {
  // Active subcategory filters (null means 'All' under that category)
  const [activeSareeSub, setActiveSareeSub] = useState<string | null>(null)
  const [activeDressSub, setActiveDressSub] = useState<string | null>(null)
  const [activeJewellerySub, setActiveJewellerySub] = useState<string | null>(null)

  // Find root categories
  const sareeRoot = useMemo(() => categories.find((c) => c.slug === 'saree'), [categories])
  const dressRoot = useMemo(() => categories.find((c) => c.slug === 'dress'), [categories])
  const jewelleryRoot = useMemo(() => categories.find((c) => c.slug === 'jewellery'), [categories])

  // Get subcategories for each root
  const sareeSubs = useMemo(() => {
    return sareeRoot ? categories.filter((c) => c.parent_id === sareeRoot.id) : []
  }, [categories, sareeRoot])

  const dressSubs = useMemo(() => {
    return dressRoot ? categories.filter((c) => c.parent_id === dressRoot.id) : []
  }, [categories, dressRoot])

  const jewellerySubs = useMemo(() => {
    return jewelleryRoot ? categories.filter((c) => c.parent_id === jewelleryRoot.id) : []
  }, [categories, jewelleryRoot])

  // Filter products for each category
  const filteredSarees = useMemo(() => {
    return products.filter((p) => {
      const isSaree = p.type === 'saree'
      if (!isSaree) return false
      return activeSareeSub ? p.category?.id === activeSareeSub : true
    })
  }, [products, activeSareeSub])

  const filteredDresses = useMemo(() => {
    return products.filter((p) => {
      const isDress = p.type === 'dress'
      if (!isDress) return false
      return activeDressSub ? p.category?.id === activeDressSub : true
    })
  }, [products, activeDressSub])

  const filteredJewellery = useMemo(() => {
    return products.filter((p) => {
      const isJewellery = p.type === 'jewellery'
      if (!isJewellery) return false
      return activeJewellerySub ? p.category?.id === activeJewellerySub : true
    })
  }, [products, activeJewellerySub])

  // Render a Category Section
  function renderSection(
    title: string,
    subtitle: string,
    description: string,
    typeKey: 'saree' | 'dress' | 'jewellery',
    subCats: Category[],
    activeSubId: string | null,
    setActiveSubId: (id: string | null) => void,
    sectionProducts: Product[]
  ) {
    return (
      <section className="py-16 border-b border-gray-100 last:border-b-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1 text-[oklch(0.60_0.22_35)] text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{subtitle}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 font-display">
                {title}
              </h2>
              <p className="text-sm text-gray-500 mt-2 max-w-2xl font-light">
                {description}
              </p>
            </div>
            
            <Link
              href={`/products?type=${typeKey}`}
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[oklch(0.60_0.22_35)] hover:text-[oklch(0.50_0.22_35)] transition-colors hover:underline shrink-0"
            >
              View Full Collection
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Subcategory Pills Tabs */}
          {subCats.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                onClick={() => setActiveSubId(null)}
                className={`px-5 py-2 text-xs font-medium rounded-full border transition-all shrink-0 cursor-pointer ${
                  activeSubId === null
                    ? 'bg-[oklch(0.60_0.22_35)] border-[oklch(0.60_0.22_35)] text-white shadow-sm shadow-orange-500/10'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                All {typeKey.charAt(0).toUpperCase() + typeKey.slice(1)}s
              </button>
              {subCats.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveSubId(cat.id)}
                  className={`px-5 py-2 text-xs font-medium rounded-full border transition-all shrink-0 cursor-pointer ${
                    activeSubId === cat.id
                      ? 'bg-[oklch(0.60_0.22_35)] border-[oklch(0.60_0.22_35)] text-white shadow-sm shadow-orange-500/10'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Product Grid */}
          {sectionProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
              {sectionProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
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
        'Exclusive Silk & Handloom Sarees',
        'Bridal & Festive Handweaves',
        'Discover our masterpieces woven in pure Kanjivaram, Banarasi, Chanderi, and soft Organzas by master weavers across India.',
        'saree',
        sareeSubs,
        activeSareeSub,
        setActiveSareeSub,
        filteredSarees
      )}

      {/* 2. Dresses Section */}
      {renderSection(
        'Designer Dresses & Salwars',
        'Charming Festive Outfits',
        'Stunning silhouettes tailored with delicate hand embroidery, Gota Patti, and traditional brocades for festive elegance.',
        'dress',
        dressSubs,
        activeDressSub,
        setActiveDressSub,
        filteredDresses
      )}

      {/* 3. Jewellery Section */}
      {renderSection(
        'Fine Antique & Temple Jewellery',
        'Heritage Jewellery Collection',
        'Intricately designed temple necklaces, bangles, and jhumkas crafted in 22k gold to add a divine shimmer to your look.',
        'jewellery',
        jewellerySubs,
        activeJewellerySub,
        setActiveJewellerySub,
        filteredJewellery
      )}
    </div>
  )
}
