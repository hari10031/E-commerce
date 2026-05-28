'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, ShoppingBag, Heart, ArrowRight } from 'lucide-react'
import { useWishlistStore } from '@/store/wishlistStore'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { formatPrice, discountedPrice } from '@/lib/utils'
import { toast } from '@/components/ui/Toaster'
import type { Product } from '@/types'

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center animate-fade-up">
      <div className="h-20 w-20 rounded-full bg-brand-soft flex items-center justify-center mx-auto mb-6">
        <Heart className="h-9 w-9 text-brand" />
      </div>
      {children}
    </div>
  )
}

export default function WishlistPage() {
  const { setIds, toggle } = useWishlistStore()
  const { setItems: setCartItems } = useCartStore()
  const token = useAuthStore((s) => s.token)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasHydrated) return
    async function fetchWishlist() {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const res = await api.get<{ data: Product[] }>('/api/wishlist', token)
        const data = res.data ?? []
        setProducts(data)
        setIds(data.map((p) => p.id))
      } catch {
        toast({ title: 'Failed to load wishlist', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    fetchWishlist()
  }, [token, hasHydrated, setIds])

  async function handleRemove(productId: string) {
    if (!token) return
    try {
      await api.delete(`/api/wishlist/${productId}`, token)
      toggle(productId)
      setProducts((prev) => prev.filter((p) => p.id !== productId))
      toast({ title: 'Removed from wishlist' })
    } catch {
      toast({ title: 'Failed to remove', variant: 'destructive' })
    }
  }

  async function handleMoveToCart(product: Product) {
    if (!token) {
      toast({ title: 'Please sign in to add to bag', variant: 'destructive' })
      return
    }
    const firstVariant = product.variants?.[0]
    if (!firstVariant) {
      toast({ title: 'No variants available', variant: 'destructive' })
      return
    }
    try {
      const res = await api.post<{ items: Parameters<typeof setCartItems>[0] }>(
        '/api/cart',
        { product_id: product.id, variant_id: firstVariant.id, quantity: 1 },
        token
      )
      setCartItems(res.items)
      toast({ title: 'Moved to bag', description: product.title })
      await handleRemove(product.id)
    } catch {
      toast({ title: 'Failed to move to bag', variant: 'destructive' })
    }
  }

  if (hasHydrated && !token) {
    return (
      <EmptyState>
        <h1 className="text-2xl font-semibold text-ink font-[var(--font-display)] mb-2">
          Save your favourites
        </h1>
        <p className="text-neutral-500 mb-8">
          <Link href="/login" className="text-brand hover:underline font-medium">Sign in</Link>
          {' '}to keep track of the pieces you love.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-ink text-white font-semibold rounded-full hover:bg-brand transition-colors"
        >
          Browse Collections <ArrowRight className="h-4 w-4" />
        </Link>
      </EmptyState>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-9 w-48 shimmer rounded mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-neutral-200/70 bg-white">
              <div className="aspect-[3/4] shimmer" />
              <div className="p-4 space-y-2.5">
                <div className="h-4 shimmer rounded w-3/4" />
                <div className="h-4 shimmer rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <EmptyState>
        <h1 className="text-2xl font-semibold text-ink font-[var(--font-display)] mb-2">
          Your wishlist is empty
        </h1>
        <p className="text-neutral-500 mb-8">Save the pieces you love and find them here later.</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-ink text-white font-semibold rounded-full hover:bg-brand transition-colors"
        >
          Browse Collections <ArrowRight className="h-4 w-4" />
        </Link>
      </EmptyState>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-safe">
      <div className="mb-6 sm:mb-8">
        <p className="eyebrow">Saved For Later</p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-ink font-[var(--font-display)] mt-1.5">
          My Wishlist{' '}
          <span className="text-neutral-400 text-base sm:text-xl font-sans font-normal">· {products.length} items</span>
        </h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {products.map((product, i) => {
          const primaryImage = product.images?.find((img) => img.is_primary) ?? product.images?.[0]
          const finalPrice = discountedPrice(product.base_price, product.discount_pct)
          const hasDiscount = product.discount_pct > 0

          return (
            <article
              key={product.id}
              className="relative rounded-2xl overflow-hidden border border-neutral-200/70 bg-white lift animate-fade-up"
              style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
            >
              <Link href={`/products/${product.id}`} className="group block">
                <div className="relative aspect-[3/4] bg-neutral-50 overflow-hidden">
                  {primaryImage ? (
                    <Image
                      src={primaryImage.url}
                      alt={product.title}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-contain group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-4xl opacity-40">🌸</div>
                  )}
                  {hasDiscount && (
                    <span className="absolute top-3 left-3 bg-brand text-white text-[10px] font-bold px-2 py-1 rounded-full">
                      {product.discount_pct}% OFF
                    </span>
                  )}
                </div>
              </Link>

              <button
                onClick={() => handleRemove(product.id)}
                aria-label="Remove from wishlist"
                className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/85 backdrop-blur-sm shadow-sm flex items-center justify-center text-neutral-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <div className="p-4">
                <Link href={`/products/${product.id}`}>
                  <h3 className="text-sm font-medium text-ink line-clamp-1 hover:text-brand transition-colors">
                    {product.title}
                  </h3>
                </Link>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="text-[15px] font-bold text-ink">{formatPrice(finalPrice)}</span>
                  {hasDiscount && (
                    <span className="text-xs text-neutral-400 line-through">{formatPrice(product.base_price)}</span>
                  )}
                </div>
                <button
                  onClick={() => handleMoveToCart(product)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-white bg-ink rounded-xl hover:bg-brand transition-colors"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Move to Bag
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
