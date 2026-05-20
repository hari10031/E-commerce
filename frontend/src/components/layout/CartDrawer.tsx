'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import * as Dialog from '@radix-ui/react-dialog'
import { X, ShoppingCart, Trash2 } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { formatPrice, discountedPrice } from '@/lib/utils'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items } = useCartStore()

  const subtotal = items.reduce((sum, item) => {
    const price = discountedPrice(item.product.base_price, item.product.discount_pct)
    return sum + price * item.quantity
  }, 0)

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b">
            <Dialog.Title className="flex items-center gap-2 text-lg font-semibold">
              <ShoppingCart className="h-5 w-5 text-[oklch(0.60_0.22_35)]" />
              Cart ({items.length})
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-md p-1 hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <ShoppingCart className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">Your cart is empty</p>
              </div>
            ) : (
              items.map((item) => {
                const primaryImage = item.product.images?.find((i) => i.is_primary) ?? item.product.images?.[0]
                const price = discountedPrice(item.product.base_price, item.product.discount_pct)
                return (
                  <div key={item.id} className="flex gap-3 items-start">
                    <div className="relative h-16 w-16 rounded-md overflow-hidden bg-gray-100 shrink-0">
                      {primaryImage ? (
                        <Image
                          src={primaryImage.url}
                          alt={item.product.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.product.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.variant.color} / {item.variant.size}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm font-semibold text-[oklch(0.60_0.22_35)]">
                          {formatPrice(price)} × {item.quantity}
                        </p>
                        <p className="text-sm font-bold">{formatPrice(price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t px-4 py-4 space-y-3">
              <div className="flex justify-between text-sm font-semibold">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-gray-500">Shipping & taxes calculated at checkout</p>
              <Link
                href="/cart"
                onClick={onClose}
                className="block w-full text-center py-3 px-4 rounded-md bg-[oklch(0.60_0.22_35)] text-white text-sm font-semibold hover:bg-[oklch(0.50_0.22_35)] transition-colors"
              >
                Go to Cart
              </Link>
              <Link
                href="/checkout"
                onClick={onClose}
                className="block w-full text-center py-3 px-4 rounded-md border border-[oklch(0.60_0.22_35)] text-[oklch(0.60_0.22_35)] text-sm font-semibold hover:bg-orange-50 transition-colors"
              >
                Checkout
              </Link>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
