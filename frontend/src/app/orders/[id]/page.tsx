'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { format } from 'date-fns'
import { OrderTracking } from '@/components/shop/OrderTracking'
import type { Order, OrderStatus } from '@/types'

const STATUS_COLORS: Record<OrderStatus, string> = {
  placed: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  processing: 'bg-amber-100 text-amber-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuthStore()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }
    const id = params.id as string
    api.get<Order>(`/api/orders/${id}`, token)
      .then((res) => setOrder(res))
      .catch(() => setError('Order not found'))
      .finally(() => setLoading(false))
  }, [token, params.id])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-64 bg-gray-200 rounded-xl" />
          <div className="h-48 bg-gray-200 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-6">{error || 'Order not found'}</p>
        <Link
          href="/orders"
          className="text-[oklch(0.60_0.22_35)] font-medium hover:underline"
        >
          Back to orders
        </Link>
      </div>
    )
  }

  const statusColor = STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <Link
        href="/orders"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to orders
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Placed on {format(new Date(order.created_at), 'dd MMM yyyy, h:mm a')}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${statusColor}`}>
          {order.status}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Order Items ({order.order_items?.length ?? 0})
            </h2>
            <div className="space-y-4">
              {order.order_items?.map((item) => {
                const primaryImage = item.product?.images?.find((i) => i.is_primary) ?? item.product?.images?.[0]
                return (
                  <div key={item.id} className="flex gap-4 items-start">
                    <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {primaryImage ? (
                        <Image
                          src={primaryImage.url}
                          alt={item.product.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-2xl">🌸</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.product.id}`}
                        className="text-sm font-medium text-gray-800 hover:text-[oklch(0.60_0.22_35)] line-clamp-2"
                      >
                        {item.product.title}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.variant.color} / {item.variant.size} · SKU: {item.variant.sku}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        <p className="text-sm font-bold">{formatPrice(item.unit_price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Address */}
          {order.address && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-3">Delivery Address</h2>
              <p className="text-sm text-gray-700">{order.address.line1}</p>
              {order.address.line2 && <p className="text-sm text-gray-700">{order.address.line2}</p>}
              <p className="text-sm text-gray-700">
                {order.address.city}, {order.address.state} – {order.address.pincode}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Order tracking */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Order Status</h2>
            <OrderTracking status={order.status} updatedAt={order.updated_at} />
          </div>

          {/* Price breakdown */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-3">Price Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.total_amount + order.discount_amount)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>
                    Discount
                    {order.coupon_applied && (
                      <span className="ml-1 font-mono text-xs">({order.coupon_applied})</span>
                    )}
                  </span>
                  <span>-{formatPrice(order.discount_amount)}</span>
                </div>
              )}
              <hr />
              <div className="flex justify-between font-bold text-base">
                <span>Total Paid</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
