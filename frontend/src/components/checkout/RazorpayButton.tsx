'use client'

import React, { useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { toast } from '@/components/ui/Toaster'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils'

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpayResponse) => void
  prefill?: { name?: string; email?: string }
  theme?: { color?: string }
  modal?: { ondismiss?: () => void }
}

interface RazorpayInstance {
  open: () => void
}

interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

interface RazorpayButtonProps {
  addressData: {
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
  }
  totalAmount: number
  coupon?: string
  onSuccess: (orderId: string) => void
}

export function RazorpayButton({ addressData, totalAmount, coupon, onSuccess }: RazorpayButtonProps) {
  const { token, user } = useAuthStore()
  const { clear } = useCartStore()
  const [loading, setLoading] = React.useState(false)
  const scriptLoaded = useRef(false)

  useEffect(() => {
    if (scriptLoaded.current) return
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => { scriptLoaded.current = true }
    document.body.appendChild(script)
    return () => {
      // leave script in DOM for reuse
    }
  }, [])

  async function handlePay() {
    if (!token) {
      toast({ title: 'Please login to proceed', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      // Create Razorpay order on backend
      const orderData = await api.post<{
        razorpay_order_id: string
        amount: number
        currency: string
        order_id: string
      }>(
        '/api/razorpay/create',
        { address: addressData, coupon },
        token
      )

      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? '',
        amount: orderData.amount,
        currency: orderData.currency ?? 'INR',
        name: 'NanaBanana',
        description: 'Your saree & jewellery order',
        order_id: orderData.razorpay_order_id,
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: 'oklch(0.60 0.22 35)' },
        handler: async (response) => {
          try {
            // Verify payment on backend
            await api.post(
              '/api/razorpay/verify',
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                order_id: orderData.order_id,
              },
              token
            )
            clear()
            toast({ title: 'Payment successful!', description: 'Your order has been placed.' })
            onSuccess(orderData.order_id)
          } catch {
            toast({ title: 'Payment verification failed', description: 'Please contact support.', variant: 'destructive' })
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false)
          },
        },
      }

      if (!window.Razorpay) {
        toast({ title: 'Payment gateway not loaded', description: 'Please refresh and try again.', variant: 'destructive' })
        setLoading(false)
        return
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to initiate payment'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className={cn(
        'w-full py-4 rounded-lg text-base font-bold text-white transition-colors',
        'bg-[oklch(0.60_0.22_35)] hover:bg-[oklch(0.50_0.22_35)]',
        'disabled:opacity-60 disabled:cursor-not-allowed'
      )}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          Preparing payment...
        </span>
      ) : (
        `Pay ${formatPrice(totalAmount)}`
      )}
    </button>
  )
}
