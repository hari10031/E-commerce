'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Tag, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { formatPrice, discountedPrice } from '@/lib/utils'
import { toast } from '@/components/ui/Toaster'
import { QuantityPicker } from '@/components/shop/QuantityPicker'

export default function CartPage() {
  const { items, setItems, clear } = useCartStore()
  const { token } = useAuthStore()
  const [coupon, setCoupon] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponError, setCouponError] = useState('')
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [loadingCart, setLoadingCart] = useState(false)

  // Sync cart from backend
  useEffect(() => {
    if (!token) return
    api.get<{ items: typeof items }>('/api/cart', token)
      .then((res) => setItems(res.items))
      .catch(() => {})
  }, [token])

  const subtotal = items.reduce((sum, item) => {
    const price = discountedPrice(item.product.base_price, item.product.discount_pct)
    return sum + price * item.quantity
  }, 0)
  const shipping = subtotal >= 999 ? 0 : 99
  const total = subtotal + shipping - couponDiscount

  async function handleQuantityChange(itemId: string, quantity: number) {
    if (!token) return
    setLoadingCart(true)
    try {
      const res = await api.patch<{ items: typeof items }>(
        `/api/cart/${itemId}`,
        { quantity },
        token
      )
      setItems(res.items)
    } catch {
      toast({ title: 'Failed to update cart', variant: 'destructive' })
    } finally {
      setLoadingCart(false)
    }
  }

  async function handleRemove(itemId: string) {
    if (!token) return
    try {
      const res = await api.delete<{ items: typeof items }>(`/api/cart/${itemId}`, token)
      setItems(res.items)
      toast({ title: 'Item removed from cart' })
    } catch {
      toast({ title: 'Failed to remove item', variant: 'destructive' })
    }
  }

  async function handleCoupon() {
    if (!coupon.trim()) return
    setValidatingCoupon(true)
    setCouponError('')
    try {
      const res = await api.get<{ valid: boolean; discount_pct: number; message?: string }>(
        `/api/coupons/validate/${coupon.trim()}`,
        token ?? undefined
      )
      if (res.valid) {
        const disc = Math.round(subtotal * res.discount_pct / 100)
        setCouponDiscount(disc)
        toast({ title: `Coupon applied! ${res.discount_pct}% off` })
      } else {
        setCouponError(res.message ?? 'Invalid coupon code')
        setCouponDiscount(0)
      }
    } catch {
      setCouponError('Failed to validate coupon')
    } finally {
      setValidatingCoupon(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-20 w-20 mx-auto text-gray-200 mb-6" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-8">Add some beautiful products to your cart!</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[oklch(0.60_0.22_35)] text-white font-semibold rounded-xl hover:bg-[oklch(0.50_0.22_35)] transition-colors"
        >
          Browse Products <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Shopping Cart ({items.length} items)</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items list */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const primaryImage = item.product.images?.find((i) => i.is_primary) ?? item.product.images?.[0]
            const price = discountedPrice(item.product.base_price, item.product.discount_pct)

            return (
              <div key={item.id} className="flex gap-4 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                {/* Image */}
                <div className="relative h-24 w-24 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {primaryImage ? (
                    <Image
                      src={primaryImage.url}
                      alt={item.product.title}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-200 flex items-center justify-center text-2xl">🌸</div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${item.product_id}`}
                    className="text-sm font-semibold text-gray-800 hover:text-[oklch(0.60_0.22_35)] line-clamp-2"
                  >
                    {item.product.title}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.variant.color} / {item.variant.size}
                  </p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">SKU: {item.variant.sku}</p>

                  <div className="flex items-center justify-between mt-3">
                    <QuantityPicker
                      value={item.quantity}
                      onChange={(q) => handleQuantityChange(item.id, q)}
                    />
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatPrice(price * item.quantity)}</p>
                      <p className="text-xs text-gray-400">{formatPrice(price)} each</p>
                    </div>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => handleRemove(item.id)}
                  className="shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm sticky top-24 space-y-4">
            <h2 className="text-base font-semibold text-gray-800">Order Summary</h2>

            {/* Coupon */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                <Tag className="h-3.5 w-3.5 inline mr-1" />
                Coupon Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[oklch(0.60_0.22_35)]"
                />
                <button
                  onClick={handleCoupon}
                  disabled={validatingCoupon}
                  className="px-3 py-2 text-sm font-medium text-[oklch(0.60_0.22_35)] border border-[oklch(0.60_0.22_35)] rounded-md hover:bg-orange-50 transition-colors disabled:opacity-60"
                >
                  Apply
                </button>
              </div>
              {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
              {couponDiscount > 0 && (
                <p className="text-xs text-green-600 mt-1">Saved {formatPrice(couponDiscount)}!</p>
              )}
            </div>

            <hr />

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="text-green-600">Free</span> : formatPrice(shipping)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon discount</span>
                  <span>-{formatPrice(couponDiscount)}</span>
                </div>
              )}
            </div>

            <hr />

            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>

            {shipping > 0 && (
              <p className="text-xs text-gray-500">
                Add {formatPrice(999 - subtotal)} more for free shipping
              </p>
            )}

            <Link
              href="/checkout"
              className="block w-full text-center py-3.5 bg-[oklch(0.60_0.22_35)] text-white rounded-xl font-bold text-sm hover:bg-[oklch(0.50_0.22_35)] transition-colors"
            >
              Proceed to Checkout
            </Link>

            <Link
              href="/products"
              className="block w-full text-center py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
