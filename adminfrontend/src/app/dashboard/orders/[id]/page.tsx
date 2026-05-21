'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatPrice, formatDateTime } from '@/lib/utils';
import { StatusUpdateDropdown } from '@/components/orders/StatusUpdateDropdown';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, MapPin, Phone, Mail, Package } from 'lucide-react';
import type { Order, OrderStatus } from '@/types';

const STATUS_TIMELINE: OrderStatus[] = ['placed', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const token = useAuthStore((s) => s.token);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !id) return;
    api.get<Order>(`/api/orders/${id}`, token)
      .then(setOrder)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, id]);

  const handleStatusUpdate = (newStatus: OrderStatus) => {
    setOrder((prev) => prev ? { ...prev, status: newStatus } : prev);
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return <div className="text-center py-20 text-gray-400">Order not found</div>;
  }

  const timelineIndex = STATUS_TIMELINE.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="space-y-5 max-w-4xl animate-fade-in">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/orders" className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Order #{order.id.slice(0, 8)}</h2>
          <p className="text-sm text-gray-400">{formatDateTime(order.created_at)}</p>
        </div>
        <div className="ml-auto">
          <StatusUpdateDropdown
            orderId={order.id}
            currentStatus={order.status}
            onUpdated={handleStatusUpdate}
          />
        </div>
      </div>

      {/* Status Timeline */}
      {!isCancelled && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Order Timeline</h3>
          <div className="flex items-center">
            {STATUS_TIMELINE.map((status, i) => (
              <div key={status} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i <= timelineIndex ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {i < timelineIndex ? '✓' : i + 1}
                  </div>
                  <span className="text-xs text-gray-500 mt-1 capitalize whitespace-nowrap">{status}</span>
                </div>
                {i < STATUS_TIMELINE.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${i < timelineIndex ? 'bg-amber-400' : 'bg-gray-100'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Customer Info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Customer</h3>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-700 text-xs font-bold">
                  {(order.customer_name ?? 'U')[0].toUpperCase()}
                </span>
              </div>
              <span className="font-medium text-gray-900">{order.customer_name ?? '—'}</span>
            </div>
            {order.customer_email && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mail className="w-4 h-4" />
                {order.customer_email}
              </div>
            )}
            {order.customer_phone && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone className="w-4 h-4" />
                {order.customer_phone}
              </div>
            )}
          </div>
        </div>

        {/* Delivery Address */}
        {order.address && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" />
              Delivery Address
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{order.address.street}</p>
              <p>{order.address.city}, {order.address.state}</p>
              <p>{order.address.pincode}</p>
              <p>{order.address.country}</p>
            </div>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 p-5 border-b border-gray-50">
          <Package className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-gray-900">Order Items ({(order.items ?? []).length})</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {(order.items ?? []).map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4">
              {item.product?.images?.[0] ? (
                <Image
                  src={item.product.images[0].image_url}
                  alt={item.product.title ?? ''}
                  width={56}
                  height={56}
                  className="rounded-lg object-contain flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{item.product?.title ?? '—'}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Color: {item.variant?.color} | Size: {item.variant?.size}
                </p>
                <p className="text-xs text-gray-400">SKU: {item.variant?.sku}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-semibold text-gray-900">{formatPrice(item.price)}</p>
                <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
              </div>
            </div>
          ))}
          {(!order.items || order.items.length === 0) && (
            <div className="py-8 text-center text-gray-400 text-sm">No items</div>
          )}
        </div>
        {/* Total */}
        <div className="flex justify-end p-5 border-t border-gray-50">
          <div className="text-right">
            <p className="text-sm text-gray-500">Order Total</p>
            <p className="text-xl font-bold text-gray-900">{formatPrice(order.total)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
