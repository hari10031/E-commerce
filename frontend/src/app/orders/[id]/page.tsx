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
import { toast } from '@/components/ui/Toaster'
import type { Order, OrderStatus } from '@/types'

const REFUNDABLE_STATUSES: OrderStatus[] = ['confirmed', 'processing', 'shipped', 'delivered']

const STATUS_COLORS: Record<OrderStatus, string> = {
  placed: 'bg-blue-50 text-blue-700',
  confirmed: 'bg-indigo-50 text-indigo-700',
  processing: 'bg-amber-50 text-amber-700',
  shipped: 'bg-purple-50 text-purple-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
  refunded: 'bg-neutral-100 text-neutral-700',
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const token = useAuthStore((s) => s.token)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refundOpen, setRefundOpen] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [refundSubmitting, setRefundSubmitting] = useState(false)

  async function handleRequestRefund() {
    if (!token || !order) return
    if (!refundReason.trim()) {
      toast({ title: 'Please add a reason', variant: 'destructive' })
      return
    }
    setRefundSubmitting(true)
    try {
      const updated = await api.post<Order>(
        `/api/orders/${order.id}/refund`,
        { reason: refundReason.trim() },
        token
      )
      setOrder(updated)
      setRefundOpen(false)
      setRefundReason('')
      toast({ title: 'Refund requested', description: 'Our team will review it shortly.' })
    } catch (e) {
      toast({
        title: 'Could not request refund',
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setRefundSubmitting(false)
    }
  }

  useEffect(() => {
    if (!hasHydrated) return
    if (!token) {
      router.push('/login')
      return
    }
    const id = params.id as string
    api.get<Order>(`/api/orders/${id}`, token)
      .then((res) => setOrder(res))
      .catch(() => setError('Order not found'))
      .finally(() => setLoading(false))
  }, [token, hasHydrated, params.id, router])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="space-y-6">
          <div className="h-8 shimmer rounded w-48" />
          <div className="h-64 shimmer rounded-2xl" />
          <div className="h-48 shimmer rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-neutral-500 mb-6">{error || 'Order not found'}</p>
        <Link href="/orders" className="text-brand font-medium hover:underline">
          Back to orders
        </Link>
      </div>
    )
  }

  const statusColor = STATUS_COLORS[order.status] ?? 'bg-neutral-100 text-neutral-700'

  return (
    <div className="page-container max-w-4xl py-6 sm:py-10 pb-safe min-w-0">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-brand mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to orders
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <div>
          <p className="eyebrow">Order Detail</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-ink font-[var(--font-display)] mt-1.5 font-mono">
            #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-sm text-neutral-500 mt-1.5">
            Placed on {format(new Date(order.created_at), 'dd MMM yyyy, h:mm a')}
          </p>
        </div>
        <span className={`px-3.5 py-1.5 rounded-full text-sm font-semibold capitalize ${statusColor}`}>
          {order.status}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-200/70 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink mb-5">
              Items ({order.order_items?.length ?? 0})
            </h2>
            <div className="space-y-5">
              {order.order_items?.map((item) => {
                const primaryImage = item.product?.images?.find((i) => i.is_primary) ?? item.product?.images?.[0]
                return (
                  <div key={item.id} className="flex gap-4 items-start">
                    <Link
                      href={`/products/${item.product.id}`}
                      className="relative w-[4.5rem] aspect-[3/4] rounded-xl overflow-hidden bg-neutral-50 shrink-0"
                    >
                      {primaryImage ? (
                        <Image src={primaryImage.url} alt={item.product.title} fill className="object-cover object-center" sizes="80px" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-2xl opacity-40">🌸</div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.product.id}`}
                        className="text-sm font-semibold text-ink hover:text-brand transition-colors line-clamp-2"
                      >
                        {item.product.title}
                      </Link>
                      <p className="text-xs text-neutral-500 mt-1 capitalize">
                        {item.variant.color} · {item.variant.size}
                      </p>
                      <div className="flex items-center justify-between mt-2.5">
                        <p className="text-xs text-neutral-400">Qty {item.quantity}</p>
                        <p className="text-sm font-bold text-ink">{formatPrice(item.unit_price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Address */}
          {order.address && (
            <div className="bg-white rounded-2xl border border-neutral-200/70 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink mb-3">
                Delivery Address
              </h2>
              <p className="text-sm text-neutral-700">{order.address.line1}</p>
              {order.address.line2 && <p className="text-sm text-neutral-700">{order.address.line2}</p>}
              <p className="text-sm text-neutral-700">
                {order.address.city}, {order.address.state} – {order.address.pincode}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-200/70 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink mb-5">
              Order Status
            </h2>
            <OrderTracking
              status={order.status}
              updatedAt={order.updated_at}
              shipment={{
                shiprocket_awb: order.shiprocket_awb,
                shiprocket_courier_name: order.shiprocket_courier_name,
                tracking_url: order.tracking_url,
                shipment_status: order.shipment_status,
                expected_delivery_date: order.expected_delivery_date,
              }}
            />
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200/70 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink mb-4">
              Price Details
            </h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal</span>
                <span className="text-ink font-medium">
                  {formatPrice(order.total_amount + order.discount_amount)}
                </span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-brand-accent">
                  <span>
                    Discount
                    {order.coupon_applied && (
                      <span className="ml-1 font-mono text-xs">({order.coupon_applied})</span>
                    )}
                  </span>
                  <span>−{formatPrice(order.discount_amount)}</span>
                </div>
              )}
              <div className="h-px bg-neutral-100" />
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-ink">Total Paid</span>
                <span className="text-lg font-bold text-ink">{formatPrice(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Refund */}
          {order.status === 'refunded' ? (
            <div className="bg-white rounded-2xl border border-neutral-200/70 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink mb-2">Refund</h2>
              <p className="text-sm text-emerald-600 font-medium">
                Refund completed — the amount has been returned to your payment method.
              </p>
            </div>
          ) : order.refund_status === 'requested' ? (
            <div className="bg-white rounded-2xl border border-neutral-200/70 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink mb-2">Refund</h2>
              <p className="text-sm text-amber-600 font-medium">Refund requested — under review.</p>
              {order.refund_reason && (
                <p className="text-xs text-neutral-500 mt-2">Reason: {order.refund_reason}</p>
              )}
            </div>
          ) : REFUNDABLE_STATUSES.includes(order.status) ? (
            <div className="bg-white rounded-2xl border border-neutral-200/70 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink mb-3">
                Need a refund?
              </h2>
              {refundOpen ? (
                <div className="space-y-3">
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Tell us why you'd like a refund"
                    rows={3}
                    className="w-full text-sm rounded-xl border border-neutral-200 p-3 focus:outline-none focus:border-brand resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleRequestRefund}
                      disabled={refundSubmitting}
                      className="flex-1 py-2.5 rounded-full bg-ink text-white text-xs font-bold hover:bg-brand transition-colors disabled:opacity-50"
                    >
                      {refundSubmitting ? 'Submitting…' : 'Submit Request'}
                    </button>
                    <button
                      onClick={() => { setRefundOpen(false); setRefundReason('') }}
                      className="px-4 py-2.5 rounded-full border border-neutral-200 text-xs font-semibold text-neutral-500 hover:border-neutral-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setRefundOpen(true)}
                  className="w-full py-2.5 rounded-full border border-neutral-300 text-xs font-bold uppercase tracking-wider text-ink hover:border-brand hover:text-brand transition-colors"
                >
                  Request Refund
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
