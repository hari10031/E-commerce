'use client'

import React, { useState } from 'react'
import { ShoppingCart, Heart } from 'lucide-react'
import { ColorSwatchSelector } from '@/components/shop/ColorSwatchSelector'
import { SizeSelector } from '@/components/shop/SizeSelector'
import { QuantityPicker } from '@/components/shop/QuantityPicker'
import { useCartStore } from '@/store/cartStore'
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
  const { items, setItems } = useCartStore()
  const { productIds, toggle } = useWishlistStore()
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    product.variants?.[0] ?? null
  )
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)

  const isWishlisted = productIds.includes(product.id)
  const selectedColor = selectedVariant?.color ?? null

  function handleColorSelect(variant: Variant) {
    setSelectedVariant(variant)
  }

  function handleSizeSelect(variant: Variant) {
    setSelectedVariant(variant)
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
      const updated = await api.post<{ items: typeof items }>(
        '/api/cart',
        { product_id: product.id, variant_id: selectedVariant.id, quantity },
        token
      )
      setItems(updated.items)
      toast({ title: 'Added to cart!', description: `${product.title} (${selectedVariant.color} / ${selectedVariant.size})` })
    } catch (err) {
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

      {/* Size selector */}
      {product.variants && product.variants.length > 0 && (
        <SizeSelector
          variants={product.variants}
          selectedColor={selectedColor}
          selectedVariantId={selectedVariant?.id ?? null}
          onSelect={handleSizeSelect}
        />
      )}

      {/* Stock info */}
      {selectedVariant && (
        <p className="text-sm text-gray-500">
          {selectedVariant.quantity > 0 ? (
            <span className="text-green-600 font-medium">
              In stock ({selectedVariant.quantity} available)
            </span>
          ) : (
            <span className="text-red-500 font-medium">Out of stock</span>
          )}
        </p>
      )}

      {/* Quantity */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">Qty:</span>
        <QuantityPicker
          value={quantity}
          onChange={setQuantity}
          min={1}
          max={Math.min(10, selectedVariant?.quantity ?? 10)}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleAddToCart}
          disabled={addingToCart || !selectedVariant || (selectedVariant?.quantity ?? 0) === 0}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-colors',
            'bg-[oklch(0.60_0.22_35)] hover:bg-[oklch(0.50_0.22_35)]',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <ShoppingCart className="h-4 w-4" />
          {addingToCart ? 'Adding...' : 'Add to Cart'}
        </button>

        <button
          onClick={handleWishlistToggle}
          className={cn(
            'h-12 w-12 flex items-center justify-center rounded-xl border-2 transition-colors',
            isWishlisted
              ? 'border-red-500 text-red-500 bg-red-50'
              : 'border-gray-300 text-gray-400 hover:border-red-400 hover:text-red-400'
          )}
        >
          <Heart className={cn('h-5 w-5', isWishlisted && 'fill-current')} />
        </button>
      </div>
    </div>
  )
}
