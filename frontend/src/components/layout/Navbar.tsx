'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Heart, Search, User, LogOut, Package, ChevronDown } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

export function Navbar() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const { items } = useCartStore()
  const { productIds } = useWishlistStore()
  const { user, clearAuth } = useAuthStore()

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const wishlistCount = productIds.length

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  function handleLogout() {
    clearAuth()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0"
          >
            <span className="text-2xl font-bold text-[oklch(0.60_0.22_35)] font-[var(--font-display)]">
              NanaBanana
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
            <Link href="/products" className="hover:text-[oklch(0.60_0.22_35)] transition-colors">
              All Products
            </Link>
            <Link href="/products?type=saree" className="hover:text-[oklch(0.60_0.22_35)] transition-colors">
              Sarees
            </Link>
            <Link href="/products?type=dress" className="hover:text-[oklch(0.60_0.22_35)] transition-colors">
              Dresses
            </Link>
            <Link href="/products?type=jewellery" className="hover:text-[oklch(0.60_0.22_35)] transition-colors">
              Jewellery
            </Link>
          </nav>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:flex">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sarees, bangles..."
                className="w-full pl-4 pr-10 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:border-[oklch(0.60_0.22_35)] focus:ring-1 focus:ring-[oklch(0.60_0.22_35)]"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[oklch(0.60_0.22_35)]"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Icons */}
          <div className="flex items-center gap-1">
            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative p-2 text-gray-600 hover:text-[oklch(0.60_0.22_35)] transition-colors"
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[oklch(0.60_0.22_35)] text-white text-[10px] flex items-center justify-center font-bold">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 text-gray-600 hover:text-[oklch(0.60_0.22_35)] transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[oklch(0.60_0.22_35)] text-white text-[10px] flex items-center justify-center font-bold">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            {user ? (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex items-center gap-1 p-2 text-gray-600 hover:text-[oklch(0.60_0.22_35)] transition-colors">
                    <User className="h-5 w-5" />
                    <span className="hidden md:block text-sm font-medium">
                      {user.name.split(' ')[0]}
                    </span>
                    <ChevronDown className="h-3 w-3 hidden md:block" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="z-50 min-w-[160px] bg-white rounded-lg shadow-lg border border-gray-200 py-1 mt-1"
                    sideOffset={4}
                  >
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <DropdownMenu.Item asChild>
                      <Link
                        href="/orders"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer outline-none"
                      >
                        <Package className="h-4 w-4" />
                        My Orders
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />
                    <DropdownMenu.Item
                      onSelect={handleLogout}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer outline-none"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            ) : (
              <Link
                href="/login"
                className={cn(
                  'hidden sm:flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-full',
                  'bg-[oklch(0.60_0.22_35)] text-white hover:bg-[oklch(0.50_0.22_35)] transition-colors'
                )}
              >
                <User className="h-4 w-4" />
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
