'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, ChevronRight, Clock, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { format } from 'date-fns'
import type { Order, OrderStatus } from '@/types'

const STATUS_COLORS: Record<OrderStatus, string> = {
  placed: 'bg-blue-50 text-blue-700',
  confirmed: 'bg-indigo-50 text-indigo-700',
  processing: 'bg-amber-50 text-amber-700',
  shipped: 'bg-purple-50 text-purple-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
  refunded: 'bg-neutral-100 text-neutral-700',
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize tracking-wide ${STATUS_COLORS[status] ?? 'bg-neutral-100 text-neutral-700'}`}
    >
      {status}
    </span>
  )
}

export default function OrdersPage() {
  const token = useAuthStore((s) => s.token)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasHydrated) return
    if (!token) {
      router.push('/login')
      return
    }
    api.get<{ data: Order[] }>('/api/orders', token)
      .then((res) => setOrders(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token, hasHydrated, router])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-9 w-44 shimmer rounded mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-neutral-200/70 p-5">
              <div className="flex justify-between items-start">
                <div className="space-y-2.5">
                  <div className="h-4 shimmer rounded w-40" />
                  <div className="h-3 shimmer rounded w-28" />
                </div>
                <div className="h-6 shimmer rounded-full w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center animate-fade-up">
        <div className="h-20 w-20 rounded-full bg-brand-soft flex items-center justify-center mx-auto mb-6">
          <Package className="h-9 w-9 text-brand" />
        </div>
        <h1 className="text-2xl font-semibold text-ink font-[var(--font-display)] mb-2">
          No orders yet
        </h1>
        <p className="text-neutral-500 mb-8">Your order history will appear here once you place an order.</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-ink text-white font-semibold rounded-full hover:bg-brand transition-colors"
        >
          Start Shopping <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-safe">
      <div className="mb-6 sm:mb-8">
        <p className="eyebrow">Order History</p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-ink font-[var(--font-display)] mt-1.5">
          My Orders{' '}
          <span className="text-neutral-400 text-base sm:text-xl font-sans font-normal">· {orders.length}</span>
        </h1>
      </div>

      <div className="space-y-4">
        {orders.map((order, i) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="block bg-white rounded-2xl border border-neutral-200/70 p-4 sm:p-5 lift group animate-fade-up"
            style={{ animationDelay: `${Math.min(i * 60, 360)}ms` }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink font-mono">
                  #{order.id.slice(0, 8).toUpperCase()}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Clock className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                  <p className="text-xs text-neutral-500">
                    {format(new Date(order.created_at), 'dd MMM yyyy, h:mm a')}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <StatusBadge status={order.status} />
                <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-sm text-neutral-500 truncate pr-3">
                {order.order_items?.length ?? 0} item{(order.order_items?.length ?? 0) !== 1 ? 's' : ''}
                {order.order_items?.[0] && (
                  <span className="text-neutral-400">
                    {' '}· {order.order_items[0].product?.title}
                    {(order.order_items.length ?? 0) > 1 && ` +${order.order_items.length - 1} more`}
                  </span>
                )}
              </div>
              <p className="text-base font-bold text-ink shrink-0">{formatPrice(order.total_amount)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
