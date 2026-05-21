'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

import heroSaree1 from '@/assets/hero-saree-1.jpg'
import heroSaree2 from '@/assets/hero-saree-2.jpg'
import fabric1 from '@/assets/fabric-1.jpg'
import fabric2 from '@/assets/fabric-2.jpg'
import storefront from '@/assets/storefront.jpg'

const SLIDES = [
  {
    title: 'The Kanjivaram Legacy',
    subtitle: 'Handcrafted Silk Sarees',
    description: 'Timeless weaves dipped in pure gold zari, directly from heritage looms. Crafted for the modern bride who treasures tradition.',
    cta: 'Explore Sarees',
    href: '/products?type=saree',
    image: heroSaree1,
    accent: 'border-orange-500/35 text-orange-400 bg-orange-500/10',
  },
  {
    title: 'Heritage Banarasi',
    subtitle: 'Pure Silk & Zari Brocades',
    description: 'Luxurious textures and royal motifs, hand-woven in the heart of Varanasi. Embodying grace, heritage, and pure elegance.',
    cta: 'Shop Banarasi',
    href: '/products?type=saree',
    image: heroSaree2,
    accent: 'border-rose-500/35 text-rose-400 bg-rose-500/10',
  },
  {
    title: 'Designer Lehengas & Gowns',
    subtitle: 'Contemporary Ethnic Wear',
    description: 'Captivating silhouettes, hand-embroidery, and flowy fabrics. Designed to make every occasion memorable and elegant.',
    cta: 'View Dresses',
    href: '/products?type=dress',
    image: fabric1,
    accent: 'border-emerald-500/35 text-emerald-400 bg-emerald-500/10',
  },
  {
    title: 'Temple Jewellery',
    subtitle: '22k Gold Antique Masterpieces',
    description: 'Exquisite craftsmanship inspired by divine motifs. Hand-carved necklaces, jhumkas, and bangles designed to be passed down generations.',
    cta: 'Shop Jewellery',
    href: '/products?type=jewellery',
    image: fabric2,
    accent: 'border-amber-500/35 text-amber-400 bg-amber-500/10',
  },
  {
    title: 'Traditional Splendor',
    subtitle: 'Exclusive Collection Since 1992',
    description: 'Step into a world of pure silk and traditional Indian artistry. Handpicked collections celebrating the spirit of Indian weaves.',
    cta: 'Browse All Products',
    href: '/products',
    image: storefront,
    accent: 'border-yellow-500/35 text-yellow-400 bg-yellow-500/10',
  },
]

export function HeroSlider() {
  const [current, setCurrent] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % SLIDES.length)
  }, [])

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)
  }, [])

  useEffect(() => {
    if (isHovered) return
    const timer = setInterval(nextSlide, 4500)
    return () => clearInterval(timer)
  }, [nextSlide, isHovered])

  return (
    <section 
      className="relative h-[65vh] md:h-[78vh] min-h-[460px] md:min-h-[580px] overflow-hidden bg-gray-950 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slides Container */}
      <div className="relative w-full h-full">
        {SLIDES.map((slide, idx) => {
          const isActive = idx === current
          return (
            <div
              key={idx}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              {/* Image */}
              <div className="absolute inset-0 w-full h-full select-none">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  priority={idx === 0}
                  className={`object-cover object-center w-full h-full transition-transform duration-[4500ms] ease-out ${
                    isActive ? 'scale-105' : 'scale-100'
                  }`}
                />
                {/* Modern luxury gradient mask */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
              </div>

              {/* Slide Content */}
              <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center">
                <div 
                  className={`max-w-2xl text-white transition-all duration-700 delay-300 transform ${
                    isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                >
                  {/* Accent Pill */}
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-widest mb-4 backdrop-blur-md ${slide.accent}`}>
                    <Sparkles className="h-3 w-3" />
                    <span>{slide.subtitle}</span>
                  </div>

                  {/* Main Title */}
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold leading-tight font-display tracking-wide mb-4">
                    {slide.title}
                  </h1>

                  {/* Description */}
                  <p className="text-gray-200 text-sm sm:text-base md:text-lg mb-8 max-w-xl font-sans font-light leading-relaxed">
                    {slide.description}
                  </p>

                  {/* CTA Button */}
                  <div className="flex flex-wrap gap-4">
                    <Link
                      href={slide.href}
                      className="px-8 py-3.5 bg-[oklch(0.60_0.22_35)] hover:bg-[oklch(0.50_0.22_35)] text-white font-semibold text-sm tracking-wider uppercase rounded-md shadow-lg shadow-orange-900/30 transition-all duration-300 flex items-center gap-2 hover:scale-[1.02]"
                    >
                      {slide.cta}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Navigation Arrows (Glassmorphic, hover visible) */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full border border-white/10 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full border border-white/10 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Progress Dots (Luxury, thin lines indicator) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2.5">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-1 rounded-full transition-all duration-500 ${
              idx === current ? 'w-10 bg-[oklch(0.60_0.22_35)]' : 'w-3.5 bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
