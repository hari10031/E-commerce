'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart,
  Heart,
  Search,
  User,
  LogOut,
  Package,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import type { Category } from '@/types'
import { BrandLogo } from '@/components/brand/BrandLogo'

const NAV_TYPES = [
  { slug: 'saree', label: 'Sarees' },
  { slug: 'jewellery', label: 'Jewellery' },
] as const

export function Navbar() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  const { items } = useCartStore()
  const { productIds } = useWishlistStore()
  const { user, clearAuth } = useAuthStore()

  useEffect(() => {
    api.get<Category[]>('/api/categories')
      .then(setCategories)
      .catch((err) => console.error('Failed to load categories', err))
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  const cartCount = (items ?? []).reduce((sum, i) => sum + i.quantity, 0)
  const wishlistCount = (productIds ?? []).length

  function subsFor(slug: string) {
    const root = categories.find((c) => c.slug === slug)
    return root ? categories.filter((c) => c.parent_id === root.id) : []
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setMobileOpen(false)
    }
  }

  function handleLogout() {
    clearAuth()
    router.push('/')
  }

  return (
    <>
      {/* Announcement strip */}
      <div className="bg-[var(--color-ink)] text-cream/95 text-center text-[9px] sm:text-[10px] tracking-[0.18em] sm:tracking-[0.24em] font-sans uppercase py-2 px-3 sm:px-4 border-b border-brand-accent/10 leading-relaxed">
        <span className="text-[var(--color-gold)] font-medium">Free shipping above ₹999</span>
        <span className="text-white/50 hidden sm:inline"> · Handcrafted heritage weaves</span>
      </div>

      <header className="sticky top-0 z-50 bg-[var(--color-background)]/85 backdrop-blur-md border-b border-brand-accent/15 transition-all duration-300 pt-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-[72px] gap-3 sm:gap-4">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2.5 -ml-1 text-ink hover:text-brand transition-colors touch-target"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Logo */}
            <BrandLogo showTagline={false} className="shrink-0" />

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.15em] text-ink/80">
              {NAV_TYPES.map((t) => {
                const subs = subsFor(t.slug)
                return (
                  <div key={t.slug} className="relative group py-6">
                    <Link
                      href={`/products?type=${t.slug}`}
                      className="flex items-center gap-1 hover:text-brand transition-colors duration-300 relative py-1 after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-brand hover:after:w-full after:transition-all after:duration-300"
                    >
                      {t.label}
                      <ChevronDown className="h-3 w-3 text-neutral-400 group-hover:text-brand group-hover:rotate-180 transition-all duration-300" />
                    </Link>
                    {subs.length > 0 && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 hidden group-hover:block pt-0 w-56 z-50">
                        <div className="glass shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)] rounded-lg py-2.5 border border-brand-accent/25 animate-fade-in">
                          {subs.map((sub) => (
                            <Link
                              key={sub.id}
                              href={`/products?type=${t.slug}&category=${sub.id}`}
                              className="block px-4 py-2 text-[12px] text-ink/80 hover:bg-brand-soft/60 hover:text-brand font-medium normal-case tracking-normal transition-colors"
                            >
                              {sub.name}
                            </Link>
                          ))}
                          <div className="my-1.5 h-px bg-brand-accent/15" />
                          <Link
                            href={`/products?type=${t.slug}`}
                            className="block px-4 py-2 text-[11.5px] font-bold text-brand hover:bg-brand-soft/60 normal-case tracking-wide transition-colors"
                          >
                            View all {t.label}
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xs hidden lg:flex">
              <div className="relative w-full border-b border-neutral-300/60 focus-within:border-brand transition-colors duration-300 py-1">
                <Search className="absolute left-1 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sarees, jewellery..."
                  className="w-full pl-7 pr-3 text-[12px] bg-transparent focus:outline-none tracking-wide text-ink placeholder-neutral-400"
                />
              </div>
            </form>

            {/* Icons */}
            <div className="flex items-center gap-1">
              <Link
                href="/wishlist"
                className="relative p-2.5 text-ink/80 hover:text-brand transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="h-[1.15rem] w-[1.15rem] transition-transform duration-300 hover:scale-110" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-brand text-cream text-[9px] flex items-center justify-center font-bold shadow-sm">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>

              <Link
                href="/cart"
                className="relative p-2.5 text-ink/80 hover:text-brand transition-colors"
                aria-label="Cart"
              >
                <ShoppingCart className="h-[1.15rem] w-[1.15rem] transition-transform duration-300 hover:scale-110" />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-brand text-cream text-[9px] flex items-center justify-center font-bold shadow-sm">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {user ? (
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 ml-1 rounded-full text-ink hover:bg-brand-soft/40 transition-colors">
                      <span className="h-7 w-7 rounded-full bg-brand text-cream flex items-center justify-center text-xs font-bold uppercase shadow-sm">
                        {user.name.charAt(0)}
                      </span>
                      <span className="hidden md:block text-[12px] font-semibold tracking-wide">
                        {user.name.split(' ')[0]}
                      </span>
                      <ChevronDown className="h-3 w-3 hidden md:block text-neutral-400" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="z-50 min-w-[200px] glass rounded-lg shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)] border border-brand-accent/25 py-2 mt-2 animate-fade-in"
                      sideOffset={4}
                      align="end"
                    >
                      <div className="px-4 py-2 border-b border-brand-accent/15 mb-1.5">
                        <p className="text-xs font-bold text-ink uppercase tracking-wider">{user.name}</p>
                        <p className="text-[11px] text-neutral-400 truncate mt-0.5">{user.email}</p>
                      </div>
                      <DropdownMenu.Item asChild>
                        <Link
                          href="/orders"
                          className="flex items-center gap-2.5 px-4 py-2 text-[12.5px] text-ink/80 hover:bg-brand-soft/60 hover:text-brand cursor-pointer outline-none transition-colors"
                        >
                          <Package className="h-4 w-4 text-neutral-400" />
                          My Orders
                        </Link>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item asChild>
                        <Link
                          href="/wishlist"
                          className="flex items-center gap-2.5 px-4 py-2 text-[12.5px] text-ink/80 hover:bg-brand-soft/60 hover:text-brand cursor-pointer outline-none transition-colors"
                        >
                          <Heart className="h-4 w-4 text-neutral-400" />
                          My Wishlist
                        </Link>
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator className="my-1.5 h-px bg-brand-accent/15" />
                      <DropdownMenu.Item
                        onSelect={handleLogout}
                        className="flex items-center gap-2.5 px-4 py-2 text-[12.5px] text-red-600 hover:bg-red-50/50 cursor-pointer outline-none transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              ) : (
                <Link
                  href="/login"
                  className="hidden sm:flex items-center gap-1.5 ml-2 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-brand text-cream hover:bg-brand-dark transition-colors shadow-md shadow-brand/10"
                >
                  <User className="h-3.5 w-3.5" />
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-brand-accent/15 bg-background/95 backdrop-blur-md animate-fade-in max-h-[min(70vh,32rem)] overflow-y-auto overscroll-contain">
            <div className="px-4 py-5 pb-safe space-y-5">
              <form onSubmit={handleSearch}>
                <div className="relative border-b border-neutral-300/60 focus-within:border-brand py-1">
                  <Search className="absolute left-1 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-7 pr-3 text-sm bg-transparent focus:outline-none text-ink placeholder-neutral-400"
                  />
                </div>
              </form>
              <div className="space-y-3">
                {NAV_TYPES.map((t) => (
                  <div key={t.slug} className="border-b border-brand-accent/10 pb-3 last:border-0 last:pb-0">
                    <Link
                      href={`/products?type=${t.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="block text-[12px] font-bold uppercase tracking-wider text-ink hover:text-brand"
                    >
                      {t.label}
                    </Link>
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      {subsFor(t.slug).map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/products?type=${t.slug}&category=${sub.id}`}
                          onClick={() => setMobileOpen(false)}
                          className="px-3 py-1.5 text-xs text-ink/80 bg-neutral-100/60 hover:bg-brand-soft/50 rounded-full border border-neutral-200/50"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {!user && (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-1.5 w-full py-3 text-xs font-bold uppercase tracking-wider rounded-full bg-brand text-cream"
                >
                  <User className="h-4 w-4" />
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  )
}
