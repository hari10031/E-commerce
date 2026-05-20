'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, MapPin, CreditCard, Package } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { AddressForm, type AddressFormData } from '@/components/checkout/AddressForm'
import { RazorpayButton } from '@/components/checkout/RazorpayButton'
import { api } from '@/lib/api'
import { formatPrice, discountedPrice } from '@/lib/utils'
import { toast } from '@/components/ui/Toaster'

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
  const { token, user } = useAuthStore()
  const { items, clear } = useCartStore()
  const [step, setStep] = useState<Step>(1)
  const [address, setAddress] = useState<AddressFormData | null>(null)
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null)
  const [loadingAddress, setLoadingAddress] = useState(false)

  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }
    if (items.length === 0 && step === 1) {
      router.push('/cart')
    }
    // Fetch saved addresses
    api.get<{ data: SavedAddress[] }>('/api/addresses', token)
      .then((res) => setSavedAddresses(res.data ?? []))
      .catch(() => {})
  }, [token, items.length])

  const subtotal = items.reduce((sum, item) => {
    const price = discountedPrice(item.product.base_price, item.product.discount_pct)
    return sum + price * item.quantity
  }, 0)
  const shipping = subtotal >= 999 ? 0 : 99
  const total = subtotal + shipping

  async function handleAddressSubmit(data: AddressFormData) {
    setLoadingAddress(true)
    try {
      // Save address to backend
      await api.post('/api/addresses', data, token!)
      setAddress(data)
      setStep(2)
    } catch {
      // Continue anyway even if save fails
      setAddress(data)
      setStep(2)
    } finally {
      setLoadingAddress(false)
    }
  }

  function handlePaymentSuccess(orderId: string) {
    setSuccessOrderId(orderId)
    setStep(3)
    clear()
  }

  const STEPS = [
    { n: 1, label: 'Address', icon: <MapPin className="h-4 w-4" /> },
    { n: 2, label: 'Payment', icon: <CreditCard className="h-4 w-4" /> },
    { n: 3, label: 'Success', icon: <CheckCircle className="h-4 w-4" /> },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

      {/* Step indicator */}
      <div className="flex items-center mb-10">
        {STEPS.map((s, idx) => (
          <React.Fragment key={s.n}>
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                step === s.n
                  ? 'bg-[oklch(0.60_0.22_35)] text-white'
                  : step > s.n
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {step > s.n ? <CheckCircle className="h-4 w-4" /> : s.icon}
              <span className="hidden sm:block">{s.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${step > s.n ? 'bg-green-400' : 'bg-gray-200'}`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Step 1: Address */}
          {step === 1 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[oklch(0.60_0.22_35)]" />
                Delivery Address
              </h2>
              <AddressForm
                onSubmit={handleAddressSubmit}
                savedAddresses={savedAddresses}
                isLoading={loadingAddress}
              />
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && address && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[oklch(0.60_0.22_35)]" />
                Payment
              </h2>

              {/* Delivery to */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm text-gray-700">
                <p className="font-medium mb-1">Delivering to:</p>
                <p>{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
                <p>{address.city}, {address.state} – {address.pincode}</p>
                <button
                  onClick={() => setStep(1)}
                  className="text-[oklch(0.60_0.22_35)] text-xs font-medium mt-1 hover:underline"
                >
                  Change address
                </button>
              </div>

              <RazorpayButton
                addressData={address}
                totalAmount={total}
                onSuccess={handlePaymentSuccess}
              />

              <p className="text-xs text-gray-400 text-center mt-3">
                Secured by Razorpay — 256-bit SSL encryption
              </p>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed!</h2>
              <p className="text-gray-500 mb-2">
                Thank you for your order. We&apos;ll send a confirmation email shortly.
              </p>
              {successOrderId && (
                <p className="text-sm text-gray-600 mb-6">
                  Order ID:{' '}
                  <span className="font-mono font-semibold text-gray-800">{successOrderId}</span>
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {successOrderId && (
                  <Link
                    href={`/orders/${successOrderId}`}
                    className="px-6 py-3 bg-[oklch(0.60_0.22_35)] text-white font-semibold rounded-xl hover:bg-[oklch(0.50_0.22_35)] transition-colors text-sm"
                  >
                    Track Order
                  </Link>
                )}
                <Link
                  href="/products"
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        {step !== 3 && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-24">
              <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Package className="h-4 w-4 text-[oklch(0.60_0.22_35)]" />
                Order Summary ({items.length} items)
              </h2>
              <div className="space-y-3 text-sm">
                {items.map((item) => {
                  const price = discountedPrice(item.product.base_price, item.product.discount_pct)
                  return (
                    <div key={item.id} className="flex justify-between gap-2">
                      <span className="text-gray-600 truncate flex-1">
                        {item.product.title}{' '}
                        <span className="text-gray-400">×{item.quantity}</span>
                      </span>
                      <span className="font-medium shrink-0">{formatPrice(price * item.quantity)}</span>
                    </div>
                  )
                })}
                <hr />
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? <span className="text-green-600">Free</span> : formatPrice(shipping)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
