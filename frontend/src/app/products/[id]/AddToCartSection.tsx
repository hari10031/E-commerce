'use client'

import React, { useState } from 'react'
import { ShoppingCart, Heart } from 'lucide-react'
import { ColorSwatchSelector } from '@/components/shop/ColorSwatchSelector'
import { SizeSelector } from '@/components/shop/SizeSelector'
import { QuantityPicker } from '@/components/shop/QuantityPicker'
import { useCartStore, CartItem } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/Toaster'
import { cn } from '@/lib/utils'
import type { Variant, Product } from '@/types'

interface AddToCartSectionProps {
  product: Product
}

export function AddToCartSection({ product }: AddToCartSectionProps) {
  const { token } = useAuthStore()
  const { setItems } = useCartStore()
  const { productIds, toggle } = useWishlistStore()
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    product.variants?.[0] ?? null
  )
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)

  const isWishlisted = productIds.includes(product.id)
  const selectedColor = selectedVariant?.color ?? null

  function selectVariant(variant: Variant) {
    setSelectedVariant(variant)
    // Never leave the quantity above the new variant's available stock.
    setQuantity((q) => Math.min(q, Math.max(1, variant.quantity || 1)))
  }

  function handleColorSelect(variant: Variant) {
    selectVariant(variant)
  }

  function handleSizeSelect(variant: Variant) {
    selectVariant(variant)
  }

  async function handleWishlistToggle() {
    if (!token) {
      toast({ title: 'Please login to save items', variant: 'destructive' })
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

  async function handleAddToCart() {
    if (!token) {
      toast({ title: 'Please login to add to cart', variant: 'destructive' })
      return
    }
    if (!selectedVariant) {
      toast({ title: 'Please select a variant', variant: 'destructive' })
      return
    }
    setAddingToCart(true)
    try {
      const updated = await api.post<{ items: CartItem[] }>(
        '/api/cart',
        { product_id: product.id, variant_id: selectedVariant.id, quantity },
        token
      )
      setItems(updated.items)
      toast({ title: 'Added to cart!', description: `${product.title} (${selectedVariant.color} / ${selectedVariant.size})` })
    } catch {
      toast({ title: 'Failed to add to cart', variant: 'destructive' })
    } finally {
      setAddingToCart(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Color selector */}
      {product.variants && product.variants.length > 0 && (
        <ColorSwatchSelector
          variants={product.variants}
          selectedVariantId={selectedVariant?.id ?? null}
          onSelect={handleColorSelect}
        />
      )}

      {/* Size selector — sarees have no size, only colour */}
      {product.type !== 'saree' && product.variants && product.variants.length > 0 && (
        <SizeSelector
          variants={product.variants}
          selectedColor={selectedColor}
          selectedVariantId={selectedVariant?.id ?? null}
          onSelect={handleSizeSelect}
        />
      )}

      {/* Stock info */}
      {selectedVariant && (
        <div className="flex items-center gap-2 text-sm">
          {selectedVariant.quantity > 0 ? (
            <>
              <span className="h-2 w-2 rounded-full bg-brand-accent" />
              <span className="text-neutral-600 font-medium">
                In stock
                {selectedVariant.quantity <= 5 && (
                  <span className="text-brand"> — only {selectedVariant.quantity} left</span>
                )}
              </span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-red-500 font-medium">Out of stock</span>
            </>
          )}
        </div>
      )}

      {/* Quantity */}
      <div className="flex items-center gap-4">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink">Quantity</span>
        <QuantityPicker
          value={quantity}
          onChange={setQuantity}
          min={1}
          max={Math.max(1, selectedVariant?.quantity ?? 1)}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        <button
          onClick={handleAddToCart}
          disabled={addingToCart || !selectedVariant || (selectedVariant?.quantity ?? 0) === 0}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-4 min-h-[52px] rounded-full text-sm font-bold text-white transition-all w-full sm:w-auto',
            'bg-ink hover:bg-brand',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <ShoppingCart className="h-4 w-4" />
          {addingToCart ? 'Adding...' : 'Add to Bag'}
        </button>

        <button
          onClick={handleWishlistToggle}
          aria-label="Toggle wishlist"
          className={cn(
            'h-[52px] w-full sm:w-[52px] flex items-center justify-center rounded-full border transition-colors shrink-0',
            isWishlisted
              ? 'border-red-500 text-red-500 bg-red-50'
              : 'border-neutral-300 text-neutral-400 hover:border-red-400 hover:text-red-400'
          )}
        >
          <Heart className={cn('h-5 w-5', isWishlisted && 'fill-current')} />
        </button>
      </div>
    </div>
  )
}
