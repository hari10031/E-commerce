'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingCart } from 'lucide-react'
import { useWishlistStore } from '@/store/wishlistStore'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { formatPrice, discountedPrice, cn } from '@/lib/utils'
import { toast } from '@/components/ui/Toaster'
import { api } from '@/lib/api'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { productIds, toggle } = useWishlistStore()
  const { items, setItems } = useCartStore()
  const { token } = useAuthStore()
  const [addingToCart, setAddingToCart] = useState(false)

  const isWishlisted = productIds.includes(product.id)
  const primaryImage = product.images?.find((i) => i.is_primary) ?? product.images?.[0]
  const finalPrice = discountedPrice(product.base_price, product.discount_pct)
  const hasDiscount = product.discount_pct > 0

  const firstVariant = product.variants?.[0]

  async function handleWishlistToggle(e: React.MouseEvent) {
    e.preventDefault()
    if (!token) {
      toast({ title: 'Please login', description: 'Login to save items to wishlist', variant: 'destructive' })
      return
    }
    toggle(product.id)
    try {
      if (isWishlisted) {
        await api.delete(`/api/wishlist/${product.id}`, token)
      } else {
        await api.post('/api/wishlist', { product_id: product.id }, token)
      }
    } catch {
      toggle(product.id) // rollback
    }
  }

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    if (!token) {
      toast({ title: 'Please login', description: 'Login to add items to cart', variant: 'destructive' })
      return
    }
    if (!firstVariant) {
      toast({ title: 'No variant available', variant: 'destructive' })
      return
    }
    setAddingToCart(true)
    try {
      const updated = await api.post<{ items: typeof items }>(
        '/api/cart',
        { product_id: product.id, variant_id: firstVariant.id, quantity: 1 },
        token
      )
      setItems(updated.items)
      toast({ title: 'Added to cart', description: product.title })
    } catch (err) {
      toast({ title: 'Failed to add to cart', variant: 'destructive' })
    } finally {
      setAddingToCart(false)
    }
  }

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-gray-50 border border-gray-100 hover:shadow-md transition-shadow">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt_text ?? product.title}
              fill
              className="object-contain transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
              <span className="text-4xl">🌸</span>
            </div>
          )}

          {/* Discount badge */}
          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-[oklch(0.60_0.22_35)] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {product.discount_pct}% OFF
            </div>
          )}

          {/* Wishlist button */}
          <button
            onClick={handleWishlistToggle}
            className={cn(
              'absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center transition-colors',
              isWishlisted
                ? 'bg-red-50 text-red-500'
                : 'bg-white/80 text-gray-400 hover:text-red-500 hover:bg-red-50'
            )}
          >
            <Heart className={cn('h-4 w-4', isWishlisted && 'fill-current')} />
          </button>
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="text-sm font-medium text-gray-800 truncate leading-tight">{product.title}</h3>
          {product.category && (
            <p className="text-xs text-gray-400 mt-0.5">{product.category.name}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-base font-bold text-gray-900">{formatPrice(finalPrice)}</span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">{formatPrice(product.base_price)}</span>
            )}
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={addingToCart || !firstVariant}
            className={cn(
              'mt-3 w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-colors',
              'bg-[oklch(0.60_0.22_35)] text-white hover:bg-[oklch(0.50_0.22_35)]',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {addingToCart ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </Link>
  )
}
