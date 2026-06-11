import React from 'react'
import { Check, Package, Truck, Home, XCircle, RefreshCw, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/types'
import { format } from 'date-fns'

const STATUS_STEPS: { status: OrderStatus; label: string; icon: React.ReactNode }[] = [
  { status: 'placed', label: 'Order Placed', icon: <Package className="h-4 w-4" /> },
  { status: 'confirmed', label: 'Confirmed', icon: <Check className="h-4 w-4" /> },
  { status: 'processing', label: 'Processing', icon: <RefreshCw className="h-4 w-4" /> },
  { status: 'shipped', label: 'Shipped', icon: <Truck className="h-4 w-4" /> },
  { status: 'delivered', label: 'Delivered', icon: <Home className="h-4 w-4" /> },
]

const NEGATIVE_STATUSES: OrderStatus[] = ['cancelled', 'refunded']

export interface ShipmentInfo {
  shiprocket_awb?: string
  shiprocket_courier_name?: string
  tracking_url?: string
  shipment_status?: string
  expected_delivery_date?: string
}

interface OrderTrackingProps {
  status: OrderStatus
  updatedAt?: string
  shipment?: ShipmentInfo
}

export function OrderTracking({ status, updatedAt, shipment }: OrderTrackingProps) {
  if (NEGATIVE_STATUSES.includes(status)) {
    return (
      <div className="flex items-center gap-3 py-4 text-red-600">
        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
          <XCircle className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold capitalize">{status}</p>
          {updatedAt && (
            <p className="text-xs text-gray-500 mt-0.5">
              {format(new Date(updatedAt), 'dd MMM yyyy, h:mm a')}
            </p>
          )}
        </div>
      </div>
    )
  }

  const currentIndex = STATUS_STEPS.findIndex((s) => s.status === status)

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-neutral-200" />

        <div className="space-y-6">
          {STATUS_STEPS.map((step, idx) => {
            const isDone = idx < currentIndex
            const isActive = idx === currentIndex
            const isPending = idx > currentIndex

            return (
              <div key={step.status} className="relative flex items-center gap-4">
                <div
                  className={cn(
                    'relative z-10 h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors',
                    isDone && 'bg-brand text-white',
                    isActive && 'bg-brand text-white ring-4 ring-brand-soft',
                    isPending && 'bg-neutral-100 text-neutral-400'
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : step.icon}
                </div>

                <div>
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isActive && 'text-brand',
                      isDone && 'text-neutral-700',
                      isPending && 'text-neutral-400'
                    )}
                  >
                    {step.label}
                  </p>
                  {isActive && updatedAt && (
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {format(new Date(updatedAt), 'dd MMM yyyy, h:mm a')}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {shipment?.shiprocket_awb && (
        <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/80 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink">
            Shipment tracking
          </p>
          {shipment.shiprocket_courier_name && (
            <div>
              <p className="text-xs text-neutral-500">Courier</p>
              <p className="text-sm font-medium text-ink">{shipment.shiprocket_courier_name}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-neutral-500">AWB / tracking number</p>
            <p className="text-sm font-mono font-semibold text-ink">{shipment.shiprocket_awb}</p>
          </div>
          {shipment.expected_delivery_date && (
            <div>
              <p className="text-xs text-neutral-500">Expected delivery</p>
              <p className="text-sm font-medium text-ink">
                {format(new Date(shipment.expected_delivery_date), 'dd MMM yyyy')}
              </p>
            </div>
          )}
          {shipment.shipment_status && (
            <p className="text-xs text-neutral-500">
              Status: <span className="font-medium text-neutral-700">{shipment.shipment_status}</span>
            </p>
          )}
          {shipment.tracking_url && (
            <a
              href={shipment.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
            >
              Track on courier site
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}
    </div>
  )
}
