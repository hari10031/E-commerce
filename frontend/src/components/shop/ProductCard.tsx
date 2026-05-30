'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, ShoppingBag, Check } from 'lucide-react'
import { useWishlistStore } from '@/store/wishlistStore'
import { useCartStore, type CartItem } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { formatPrice, discountedPrice, cn } from '@/lib/utils'
import { toast } from '@/components/ui/Toaster'
import { api } from '@/lib/api'
import { ProductImageFrame } from './ProductImageFrame'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter()
  const productHref = `/products/${product.id}`
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
    e.stopPropagation()
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
    e.stopPropagation()
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
    <Link
      href={productHref}
      prefetch
      onMouseEnter={() => router.prefetch(productHref)}
      className="group block min-w-0"
    >
      <article className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white border border-neutral-200/80 sm:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] sm:hover:shadow-[0_20px_48px_-12px_rgba(0,0,0,0.08)] transition-all duration-300 sm:lift">
        <div className="relative">
          {primaryImage ? (
            <ProductImageFrame
              src={primaryImage.url}
              alt={primaryImage.alt_text ?? product.title}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              fit="cover"
              className="rounded-t-xl sm:rounded-t-2xl"
            />
          ) : (
            <div className="aspect-[3/4] bg-gradient-to-br from-brand-soft to-amber-50 flex items-center justify-center rounded-t-xl sm:rounded-t-2xl">
              <span className="text-4xl opacity-40">🌸</span>
            </div>
          )}

          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-wrap gap-1 max-w-[70%] z-10">
            {hasDiscount && (
              <span className="bg-brand text-white text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full uppercase">
                {product.discount_pct}% OFF
              </span>
            )}
            {!inStock && (
              <span className="bg-neutral-900 text-[var(--color-cream)] text-[9px] font-semibold tracking-widest px-2 py-0.5 rounded-full uppercase">
                SOLD OUT
              </span>
            )}
          </div>

          <button
            onClick={handleWishlistToggle}
            aria-label="Toggle wishlist"
            className={cn(
              'absolute top-2 right-2 sm:top-3 sm:right-3 h-9 w-9 rounded-full flex items-center justify-center backdrop-blur-md shadow-sm transition-all duration-300 z-10 touch-target',
              isWishlisted
                ? 'bg-brand text-white'
                : 'bg-white/90 border border-neutral-200/80 text-neutral-600 hover:text-brand md:opacity-0 md:group-hover:opacity-100'
            )}
          >
            <Heart className={cn('h-4 w-4', isWishlisted && 'fill-current')} />
          </button>

          {/* Mobile: icon FAB; desktop: full bar on hover */}
          <button
            onClick={handleAddToCart}
            disabled={addingToCart || !firstVariant || !inStock}
            className={cn(
              'absolute z-10 touch-target transition-all duration-300',
              'bottom-2 right-2 h-10 w-10 rounded-full flex items-center justify-center shadow-md',
              'md:hidden',
              justAdded ? 'bg-brand-accent text-white' : 'bg-neutral-900 text-white',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            aria-label={justAdded ? 'Added to bag' : 'Add to bag'}
          >
            {justAdded ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
          </button>

          <div className="absolute inset-x-0 bottom-0 hidden md:block translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
            <button
              onClick={handleAddToCart}
              disabled={addingToCart || !firstVariant || !inStock}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3.5 text-xs font-semibold tracking-widest uppercase',
                justAdded ? 'bg-brand-accent text-white' : 'bg-neutral-900 text-white hover:bg-brand',
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

        <div className="p-2.5 sm:p-4 bg-white">
          {product.category && (
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand/75 mb-1 font-sans line-clamp-1">
              {product.category.name}
            </p>
          )}
          <h3 className="text-sm font-semibold text-neutral-800 leading-snug line-clamp-2 group-hover:text-brand transition-colors font-sans">
            {product.title}
          </h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[15px] font-bold text-neutral-900">{formatPrice(finalPrice)}</span>
            {hasDiscount && (
              <span className="text-xs text-neutral-400 line-through">{formatPrice(product.base_price)}</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
