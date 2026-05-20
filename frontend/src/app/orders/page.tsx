'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, ChevronRight, Clock } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { format } from 'date-fns'
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

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'}`}
    >
      {status}
    </span>
  )
}

export default function OrdersPage() {
  const { token, user } = useAuthStore()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }
    api.get<{ data: Order[] }>('/api/orders', token)
      .then((res) => setOrders(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">My Orders</h1>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-40" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
                <div className="h-6 bg-gray-200 rounded-full w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Package className="h-20 w-20 mx-auto text-gray-200 mb-6" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">No orders yet</h1>
        <p className="text-gray-500 mb-8">Your order history will appear here</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[oklch(0.60_0.22_35)] text-white font-semibold rounded-xl hover:bg-[oklch(0.50_0.22_35)] transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        My Orders ({orders.length})
      </h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="block bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-800 font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-xs text-gray-500">
                    {format(new Date(order.created_at), 'dd MMM yyyy, h:mm a')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={order.status} />
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {order.order_items?.length ?? 0} item{(order.order_items?.length ?? 0) !== 1 ? 's' : ''}
                {order.order_items?.[0] && (
                  <span className="text-gray-400">
                    {' '}· {order.order_items[0].product?.title}
                    {(order.order_items.length ?? 0) > 1 && ` +${order.order_items.length - 1} more`}
                  </span>
                )}
              </div>
              <p className="text-base font-bold text-gray-900">{formatPrice(order.total_amount)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
