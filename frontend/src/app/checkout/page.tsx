'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, MapPin, CreditCard, Package, ShieldCheck } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { AddressForm, type AddressFormData } from '@/components/checkout/AddressForm'
import { RazorpayButton } from '@/components/checkout/RazorpayButton'
import { api } from '@/lib/api'
import { formatPrice, discountedPrice } from '@/lib/utils'

type Step = 1 | 2 | 3

interface SavedAddress {
  id: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const { items, clear, coupon, couponPct } = useCartStore()
  const [step, setStep] = useState<Step>(1)
  const [address, setAddress] = useState<AddressFormData | null>(null)
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null)
  const [loadingAddress, setLoadingAddress] = useState(false)

  useEffect(() => {
    if (!hasHydrated) return
    if (!token) {
      router.push('/login')
      return
    }
    if (items.length === 0 && step === 1) {
      router.push('/cart')
      return
    }
    api.get<{ data: SavedAddress[] }>('/api/addresses', token)
      .then((res) => setSavedAddresses(res.data ?? []))
      .catch(() => {})
  }, [token, hasHydrated, items.length, router, step])

  const subtotal = items.reduce((sum, item) => {
    const price = discountedPrice(item.product.base_price, item.product.discount_pct)
    return sum + price * item.quantity
  }, 0)
  const shipping = subtotal >= 999 ? 0 : 99
  const couponDiscount = Math.round((subtotal * couponPct) / 100)
  const total = subtotal + shipping - couponDiscount

  async function handleAddressSubmit(data: AddressFormData) {
    setLoadingAddress(true)
    try {
      await api.post('/api/addresses', data, token!)
    } catch {
      // continue even if save fails
    } finally {
      setAddress(data)
      setStep(2)
      setLoadingAddress(false)
    }
  }

  function handlePaymentSuccess(orderId: string) {
    setSuccessOrderId(orderId)
    setStep(3)
    clear()
  }

  const STEPS = [
    { n: 1, label: 'Address', icon: MapPin },
    { n: 2, label: 'Payment', icon: CreditCard },
    { n: 3, label: 'Confirmation', icon: CheckCircle },
  ]

  if (!hasHydrated || !token) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="h-8 w-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-safe">
      <div className="text-center mb-6 sm:mb-9">
        <p className="eyebrow">Secure Checkout</p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-ink font-[var(--font-display)] mt-1.5">
          Complete Your Order
        </h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center mb-6 sm:mb-10 max-w-md sm:max-w-lg mx-auto px-1">
        {STEPS.map((s, idx) => {
          const Icon = s.icon
          const isActive = step === s.n
          const isDone = step > s.n
          return (
            <React.Fragment key={s.n}>
              <div className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0">
                <div
                  className={`h-9 w-9 sm:h-11 sm:w-11 rounded-full flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-ink text-white'
                      : isDone
                      ? 'bg-brand-accent text-white'
                      : 'bg-neutral-100 text-neutral-400'
                  }`}
                >
                  {isDone ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={`text-[10px] sm:text-xs font-medium hidden sm:block ${isActive || isDone ? 'text-ink' : 'text-neutral-400'}`}>
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 min-w-2 h-0.5 mx-1.5 sm:mx-3 mb-4 sm:mb-5 rounded-full ${step > s.n ? 'bg-brand-accent' : 'bg-neutral-200'}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Order summary first on mobile for context */}
        {step !== 3 && (
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-white rounded-2xl border border-neutral-200/70 p-5 sm:p-6 lg:sticky lg:top-28">
              <h2 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2 flex-wrap">
                <Package className="h-4 w-4 text-brand shrink-0" />
                Order Summary
                <span className="text-neutral-400 font-normal">· {items.length} items</span>
              </h2>
              <div className="space-y-3 text-sm">
                {items.map((item) => {
                  const price = discountedPrice(item.product.base_price, item.product.discount_pct)
                  return (
                    <div key={item.id} className="flex justify-between gap-2">
                      <span className="text-neutral-500 truncate flex-1 min-w-0">
                        {item.product.title}
                        <span className="text-neutral-400"> ×{item.quantity}</span>
                      </span>
                      <span className="font-medium text-ink shrink-0">{formatPrice(price * item.quantity)}</span>
                    </div>
                  )
                })}
                <div className="h-px bg-neutral-100" />
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
                    <span>Coupon{coupon ? ` · ${coupon}` : ''}</span>
                    <span>−{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="h-px bg-neutral-100" />
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-ink">Total</span>
                  <span className="text-lg font-bold text-ink">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="lg:col-span-2 order-2 lg:order-1 min-w-0">
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-neutral-200/70 p-4 sm:p-6 lg:p-7 animate-fade-up">
              <h2 className="text-base sm:text-lg font-semibold text-ink font-[var(--font-display)] mb-5 sm:mb-6 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-brand" />
                Delivery Address
              </h2>
              <AddressForm
                onSubmit={handleAddressSubmit}
                savedAddresses={savedAddresses}
                isLoading={loadingAddress}
              />
            </div>
          )}

          {step === 2 && address && (
            <div className="bg-white rounded-2xl border border-neutral-200/70 p-4 sm:p-6 lg:p-7 animate-fade-up">
              <h2 className="text-base sm:text-lg font-semibold text-ink font-[var(--font-display)] mb-5 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brand shrink-0" />
                Payment
              </h2>

              <div className="bg-neutral-50 rounded-xl p-4 mb-6 text-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400 mb-1.5">
                  Delivering to
                </p>
                <p className="text-ink">{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
                <p className="text-neutral-500">{address.city}, {address.state} – {address.pincode}</p>
                <button
                  onClick={() => setStep(1)}
                  className="text-brand text-xs font-semibold mt-2 hover:underline"
                >
                  Change address
                </button>
              </div>

              <RazorpayButton
                addressData={address}
                totalAmount={total}
                coupon={coupon ?? undefined}
                onSuccess={handlePaymentSuccess}
              />

              <p className="flex items-center justify-center gap-1.5 text-xs text-neutral-400 mt-4">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secured by Razorpay · 256-bit SSL encryption
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white rounded-2xl border border-neutral-200/70 p-6 sm:p-10 text-center animate-scale-in">
              <div className="h-20 w-20 rounded-full bg-brand-accent/15 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="h-10 w-10 text-brand-accent" />
              </div>
              <h2 className="text-2xl font-semibold text-ink font-[var(--font-display)] mb-2">
                Order Confirmed
              </h2>
              <p className="text-neutral-500 mb-2 text-sm">
                Thank you for shopping with Yuvarani Silks. A confirmation will reach you shortly.
              </p>
              {successOrderId && (
                <p className="text-sm text-neutral-600 mb-7">
                  Order ID:{' '}
                  <span className="font-mono font-semibold text-ink">#{successOrderId.slice(0, 8).toUpperCase()}</span>
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {successOrderId && (
                  <Link
                    href={`/orders/${successOrderId}`}
                    className="px-7 py-3 bg-ink text-white font-semibold rounded-full hover:bg-brand transition-colors text-sm"
                  >
                    Track Order
                  </Link>
                )}
                <Link
                  href="/products"
                  className="px-7 py-3 border border-neutral-300 text-neutral-700 font-semibold rounded-full hover:border-ink hover:text-ink transition-colors text-sm"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
