import React from 'react'
import { Check, Package, Truck, Home, XCircle, RefreshCw } from 'lucide-react'
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

interface OrderTrackingProps {
  status: OrderStatus
  updatedAt?: string
}

export function OrderTracking({ status, updatedAt }: OrderTrackingProps) {
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
    <div className="relative">
      {/* Connecting line */}
      <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-200" />

      <div className="space-y-6">
        {STATUS_STEPS.map((step, idx) => {
          const isDone = idx < currentIndex
          const isActive = idx === currentIndex
          const isPending = idx > currentIndex

          return (
            <div key={step.status} className="relative flex items-center gap-4">
              {/* Circle */}
              <div
                className={cn(
                  'relative z-10 h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors',
                  isDone && 'bg-[oklch(0.60_0.22_35)] text-white',
                  isActive && 'bg-[oklch(0.60_0.22_35)] text-white ring-4 ring-orange-100',
                  isPending && 'bg-gray-100 text-gray-400'
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : step.icon}
              </div>

              {/* Label */}
              <div>
                <p
                  className={cn(
                    'text-sm font-medium',
                    isActive && 'text-[oklch(0.60_0.22_35)]',
                    isDone && 'text-gray-700',
                    isPending && 'text-gray-400'
                  )}
                >
                  {step.label}
                </p>
                {isActive && updatedAt && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {format(new Date(updatedAt), 'dd MMM yyyy, h:mm a')}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
