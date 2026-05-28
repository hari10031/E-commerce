'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingBag, Check } from 'lucide-react'
import { useWishlistStore } from '@/store/wishlistStore'
import { useCartStore, type CartItem } from '@/store/cartStore'
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
  const { setItems } = useCartStore()
  const { token } = useAuthStore()
  const [addingToCart, setAddingToCart] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  const isWishlisted = productIds.includes(product.id)
  const primaryImage = product.images?.find((i) => i.is_primary) ?? product.images?.[0]
  const finalPrice = discountedPrice(product.base_price, product.discount_pct)
  const hasDiscount = product.discount_pct > 0
  const firstVariant = product.variants?.[0]
  const inStock = product.variants?.some((v) => v.quantity > 0) ?? false

  async function handleWishlistToggle(e: React.MouseEvent) {
    e.preventDefault()
    if (!token) {
      toast({ title: 'Please sign in', description: 'Sign in to save items to your wishlist', variant: 'destructive' })
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
      toggle(product.id)
    }
  }

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    if (!token) {
      toast({ title: 'Please sign in', description: 'Sign in to add items to your bag', variant: 'destructive' })
      return
    }
    if (!firstVariant) {
      toast({ title: 'Unavailable', variant: 'destructive' })
      return
    }
    setAddingToCart(true)
    try {
      const updated = await api.post<{ items: CartItem[] }>(
        '/api/cart',
        { product_id: product.id, variant_id: firstVariant.id, quantity: 1 },
        token
      )
      setItems(updated.items)
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 1600)
      toast({ title: 'Added to bag', description: product.title })
    } catch {
      toast({ title: 'Could not add to bag', variant: 'destructive' })
    } finally {
      setAddingToCart(false)
    }
  }

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <article className="relative overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_48px_-12px_rgba(0,0,0,0.08)] transition-all duration-500 lift">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-50/50">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt_text ?? product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              quality={90}
              className="object-contain transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-brand-soft to-amber-50 flex items-center justify-center">
              <span className="text-4xl opacity-40">🌸</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {hasDiscount && (
              <span className="bg-brand text-white text-[9px] font-bold tracking-widest px-2.5 py-0.5 rounded-full border border-brand-accent/20 shadow-sm uppercase">
                {product.discount_pct}% OFF
              </span>
            )}
            {!inStock && (
              <span className="bg-neutral-900 text-[var(--color-cream)] text-[9px] font-semibold tracking-widest px-2.5 py-0.5 rounded-full border border-neutral-700/30 uppercase">
                SOLD OUT
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={handleWishlistToggle}
            aria-label="Toggle wishlist"
            className={cn(
              'absolute top-3 right-3 h-9 w-9 rounded-full flex items-center justify-center backdrop-blur-md shadow-sm transition-all duration-300 z-10 md:opacity-0 md:scale-90 md:group-hover:opacity-100 md:group-hover:scale-100',
              isWishlisted
                ? 'bg-brand text-white border border-brand/20'
                : 'bg-white/90 border border-brand-accent/15 text-neutral-600 hover:text-brand hover:bg-white hover:scale-105'
            )}
          >
            <Heart className={cn('h-4 w-4 transition-transform duration-300', isWishlisted && 'fill-current scale-105')} />
          </button>

          {/* Add to bag — always visible on touch, slides up flush from bottom on hover (desktop) */}
          <div className="absolute inset-x-0 bottom-0 transition-all duration-300 ease-out translate-y-0 md:translate-y-full md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 z-10">
            <button
              onClick={handleAddToCart}
              disabled={addingToCart || !firstVariant || !inStock}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3.5 text-xs font-semibold tracking-widest uppercase transition-all duration-300',
                justAdded
                  ? 'bg-brand-accent text-white'
                  : 'bg-neutral-900 text-white hover:bg-brand',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {justAdded ? (
                <><Check className="h-3.5 w-3.5" /> Added</>
              ) : (
                <><ShoppingBag className="h-3.5 w-3.5" /> {addingToCart ? 'Adding...' : 'Add to Bag'}</>
              )}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 sm:p-4 bg-white">
          {product.category && (
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand/75 mb-1.5 font-sans">
              {product.category.name}
            </p>
          )}
          <h3 className="text-sm font-semibold text-neutral-800 leading-snug line-clamp-1 group-hover:text-brand transition-colors duration-300 font-sans">
            {product.title}
          </h3>
          <div className="flex items-baseline gap-2 mt-2.5">
            <span className="text-[15px] font-bold text-neutral-900 font-sans">{formatPrice(finalPrice)}</span>
            {hasDiscount && (
              <span className="text-xs text-neutral-400 line-through font-light">{formatPrice(product.base_price)}</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
