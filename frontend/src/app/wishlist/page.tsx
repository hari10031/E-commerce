'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, ShoppingCart, Heart } from 'lucide-react'
import { useWishlistStore } from '@/store/wishlistStore'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { formatPrice, discountedPrice } from '@/lib/utils'
import { toast } from '@/components/ui/Toaster'
import type { Product } from '@/types'

export default function WishlistPage() {
  const { productIds, setIds, toggle } = useWishlistStore()
  const { items: cartItems, setItems: setCartItems } = useCartStore()
  const { token } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
  }, [token])

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
      toast({ title: 'Please login to add to cart', variant: 'destructive' })
      return
    }
    const firstVariant = product.variants?.[0]
    if (!firstVariant) {
      toast({ title: 'No variants available', variant: 'destructive' })
      return
    }
    try {
      const res = await api.post<{ items: typeof cartItems }>(
        '/api/cart',
        { product_id: product.id, variant_id: firstVariant.id, quantity: 1 },
        token
      )
      setCartItems(res.items)
      toast({ title: 'Moved to cart!', description: product.title })
      await handleRemove(product.id)
    } catch {
      toast({ title: 'Failed to move to cart', variant: 'destructive' })
    }
  }

  if (!token) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Heart className="h-20 w-20 mx-auto text-gray-200 mb-6" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Your wishlist is empty</h1>
        <p className="text-gray-500 mb-8">
          <Link href="/login" className="text-[oklch(0.60_0.22_35)] hover:underline font-medium">
            Sign in
          </Link>{' '}
          to save your favourite products
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[oklch(0.60_0.22_35)] text-white font-semibold rounded-xl hover:bg-[oklch(0.50_0.22_35)] transition-colors"
        >
          Browse Products
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">My Wishlist</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-gray-100 animate-pulse">
              <div className="aspect-[3/4] bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-5 bg-gray-200 rounded w-1/2" />
                <div className="h-8 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Heart className="h-20 w-20 mx-auto text-gray-200 mb-6" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Your wishlist is empty</h1>
        <p className="text-gray-500 mb-8">Save items you love for later!</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[oklch(0.60_0.22_35)] text-white font-semibold rounded-xl hover:bg-[oklch(0.50_0.22_35)] transition-colors"
        >
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        My Wishlist ({products.length} items)
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => {
          const primaryImage = product.images?.find((i) => i.is_primary) ?? product.images?.[0]
          const finalPrice = discountedPrice(product.base_price, product.discount_pct)
          const hasDiscount = product.discount_pct > 0

          return (
            <div key={product.id} className="relative rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm group">
              {/* Image */}
              <Link href={`/products/${product.id}`}>
                <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                  {primaryImage ? (
                    <Image
                      src={primaryImage.url}
                      alt={product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-4xl">🌸</div>
                  )}
                  {hasDiscount && (
                    <span className="absolute top-2 left-2 bg-[oklch(0.60_0.22_35)] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {product.discount_pct}% OFF
                    </span>
                  )}
                </div>
              </Link>

              {/* Remove button */}
              <button
                onClick={() => handleRemove(product.id)}
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white shadow flex items-center justify-center text-red-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>

              {/* Info */}
              <div className="p-3">
                <Link href={`/products/${product.id}`}>
                  <h3 className="text-sm font-medium text-gray-800 truncate hover:text-[oklch(0.60_0.22_35)]">
                    {product.title}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold">{formatPrice(finalPrice)}</span>
                  {hasDiscount && (
                    <span className="text-xs text-gray-400 line-through">{formatPrice(product.base_price)}</span>
                  )}
                </div>
                <button
                  onClick={() => handleMoveToCart(product)}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white bg-[oklch(0.60_0.22_35)] rounded-lg hover:bg-[oklch(0.50_0.22_35)] transition-colors"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Move to Cart
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
