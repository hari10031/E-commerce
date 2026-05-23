'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Tag, ShoppingBag, ArrowRight, Check } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { formatPrice, discountedPrice } from '@/lib/utils'
import { toast } from '@/components/ui/Toaster'
import { QuantityPicker } from '@/components/shop/QuantityPicker'

export default function CartPage() {
  const { items, setItems, coupon: appliedCoupon, couponPct, setCoupon } = useCartStore()
  const { token } = useAuthStore()
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState('')
  const [validatingCoupon, setValidatingCoupon] = useState(false)

  useEffect(() => {
    if (!token) return
    api.get<{ items: typeof items }>('/api/cart', token)
      .then((res) => setItems(res.items))
      .catch(() => {})
  }, [token, setItems])

  useEffect(() => {
    if (appliedCoupon) setCouponInput(appliedCoupon)
  }, [appliedCoupon])

  const subtotal = items.reduce((sum, item) => {
    const price = discountedPrice(item.product.base_price, item.product.discount_pct)
    return sum + price * item.quantity
  }, 0)
  const shipping = subtotal >= 999 ? 0 : 99
  const couponDiscount = Math.round((subtotal * couponPct) / 100)
  const total = subtotal + shipping - couponDiscount

  async function handleQuantityChange(itemId: string, quantity: number) {
    if (!token) return
    try {
      const res = await api.patch<{ items: typeof items }>(`/api/cart/${itemId}`, { quantity }, token)
      setItems(res.items)
    } catch {
      toast({ title: 'Failed to update cart', variant: 'destructive' })
    }
  }

  async function handleRemove(itemId: string) {
    if (!token) return
    try {
      const res = await api.delete<{ items: typeof items }>(`/api/cart/${itemId}`, token)
      setItems(res.items)
      toast({ title: 'Item removed from bag' })
    } catch {
      toast({ title: 'Failed to remove item', variant: 'destructive' })
    }
  }

  async function handleCoupon() {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    setValidatingCoupon(true)
    setCouponError('')
    try {
      const res = await api.get<{ code: string; discount_pct: number }>(
        `/api/coupons/validate/${code}`,
        token ?? undefined
      )
      setCoupon(code, res.discount_pct)
      toast({ title: `Coupon applied — ${res.discount_pct}% off` })
    } catch (e) {
      setCoupon(null, 0)
      setCouponError(e instanceof Error ? e.message : 'Invalid coupon code')
    } finally {
      setValidatingCoupon(false)
    }
  }

  function removeCoupon() {
    setCoupon(null, 0)
    setCouponInput('')
    setCouponError('')
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center animate-fade-up">
        <div className="h-20 w-20 rounded-full bg-brand-soft flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="h-9 w-9 text-brand" />
        </div>
        <h1 className="text-2xl font-semibold text-ink font-[var(--font-display)] mb-2">
          Your bag is empty
        </h1>
        <p className="text-neutral-500 mb-8">
          Discover our handcrafted collections and add something you love.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-ink text-white font-semibold rounded-full hover:bg-brand transition-colors"
        >
          Browse Collections <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  const itemCount = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <p className="eyebrow">Shopping Bag</p>
        <h1 className="text-3xl font-semibold text-ink font-[var(--font-display)] mt-1.5">
          Your Bag <span className="text-neutral-400 text-xl font-sans font-normal">· {itemCount} items</span>
        </h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items list */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const primaryImage = item.product.images?.find((i) => i.is_primary) ?? item.product.images?.[0]
            const price = discountedPrice(item.product.base_price, item.product.discount_pct)

            return (
              <div key={item.id} className="flex gap-4 sm:gap-5 bg-white border border-neutral-200/70 rounded-2xl p-4 sm:p-5">
                {/* Image */}
                <Link
                  href={`/products/${item.product_id}`}
                  className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-xl overflow-hidden bg-neutral-50 shrink-0"
                >
                  {primaryImage ? (
                    <Image src={primaryImage.url} alt={item.product.title} fill className="object-contain" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-2xl opacity-40">🌸</div>
                  )}
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/products/${item.product_id}`}
                        className="text-sm sm:text-[15px] font-semibold text-ink hover:text-brand transition-colors line-clamp-2"
                      >
                        {item.product.title}
                      </Link>
                      <p className="text-xs text-neutral-500 mt-1 capitalize">
                        {item.variant.color} · {item.variant.size}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemove(item.id)}
                      aria-label="Remove"
                      className="shrink-0 p-1.5 text-neutral-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-end justify-between mt-auto pt-3">
                    <QuantityPicker
                      value={item.quantity}
                      onChange={(q) => handleQuantityChange(item.id, q)}
                    />
                    <div className="text-right">
                      <p className="text-[15px] font-bold text-ink">{formatPrice(price * item.quantity)}</p>
                      <p className="text-xs text-neutral-400">{formatPrice(price)} each</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-neutral-200/70 rounded-2xl p-6 sticky top-28 space-y-5">
            <h2 className="text-base font-semibold text-ink font-[var(--font-display)]">Order Summary</h2>

            {/* Coupon */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-ink mb-2 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" /> Coupon Code
              </label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-brand/30 bg-brand-soft px-3 py-2.5">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-brand min-w-0">
                    <Check className="h-4 w-4 shrink-0" />
                    <span className="truncate">{appliedCoupon}</span>
                    <span className="font-normal text-neutral-500 shrink-0">· {couponPct}% off</span>
                  </span>
                  <button
                    onClick={removeCoupon}
                    className="text-xs font-medium text-neutral-500 hover:text-red-500 shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="flex-1 min-w-0 px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                    />
                    <button
                      onClick={handleCoupon}
                      disabled={validatingCoupon}
                      className="px-4 py-2.5 text-sm font-semibold text-white bg-ink rounded-xl hover:bg-brand transition-colors disabled:opacity-60"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-500 mt-1.5">{couponError}</p>}
                </>
              )}
            </div>

            <div className="h-px bg-neutral-100" />

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal</span>
                <span className="text-ink font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="text-brand-accent font-medium">Free</span> : <span className="text-ink font-medium">{formatPrice(shipping)}</span>}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-brand-accent">
                  <span>Coupon discount</span>
                  <span>−{formatPrice(couponDiscount)}</span>
                </div>
              )}
            </div>

            {shipping > 0 && (
              <p className="text-xs text-neutral-500 bg-brand-soft rounded-lg px-3 py-2">
                Add {formatPrice(999 - subtotal)} more for free shipping
              </p>
            )}

            <div className="h-px bg-neutral-100" />

            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-ink">Total</span>
              <span className="text-xl font-bold text-ink">{formatPrice(total)}</span>
            </div>

            <Link
              href="/checkout"
              className="flex items-center justify-center gap-2 w-full py-4 bg-ink text-white rounded-full font-bold text-sm hover:bg-brand transition-colors"
            >
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/products"
              className="block text-center py-1 text-sm text-neutral-500 hover:text-brand transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
