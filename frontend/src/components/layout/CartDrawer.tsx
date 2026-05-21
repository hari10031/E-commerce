'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import * as Dialog from '@radix-ui/react-dialog'
import { X, ShoppingCart } from 'lucide-react'
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
          <div className="flex items-center justify-between px-4 py-5 border-b border-neutral-100">
            <Dialog.Title className="flex items-center gap-2 text-base font-display font-semibold tracking-wider uppercase text-neutral-800">
              <ShoppingCart className="h-5 w-5 text-brand" />
              Cart ({items.length})
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-full p-1.5 text-neutral-400 hover:bg-brand-soft/80 hover:text-brand transition-colors">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-neutral-400">
                <ShoppingCart className="h-10 w-10 mb-3 opacity-30 text-brand" />
                <p className="text-sm font-light">Your cart is empty</p>
              </div>
            ) : (
              items.map((item) => {
                const primaryImage = item.product.images?.find((i) => i.is_primary) ?? item.product.images?.[0]
                const price = discountedPrice(item.product.base_price, item.product.discount_pct)
                return (
                  <div key={item.id} className="flex gap-3 items-start py-2">
                    <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-neutral-50 border border-brand-accent/10 shrink-0">
                      {primaryImage ? (
                        <Image
                          src={primaryImage.url}
                          alt={item.product.title}
                          fill
                          className="object-contain"
                        />
                      ) : (
                        <div className="h-full w-full bg-neutral-100" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-800 truncate font-sans">{item.product.title}</p>
                      <p className="text-[11px] text-neutral-500 mt-0.5 font-light">
                        {item.variant.color} / {item.variant.size}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs font-semibold text-brand/90 font-sans">
                          {formatPrice(price)} × {item.quantity}
                        </p>
                        <p className="text-sm font-bold text-neutral-900 font-sans">{formatPrice(price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-neutral-100 px-4 py-5 space-y-4">
              <div className="flex justify-between text-sm font-bold text-neutral-900 font-sans">
                <span>Subtotal</span>
                <span className="text-brand font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-[11px] text-neutral-400 font-light">Shipping & taxes calculated at checkout</p>
              <div className="grid gap-2">
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="block w-full text-center py-3 px-4 rounded-xl bg-neutral-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-brand transition-all duration-300"
                >
                  Go to Cart
                </Link>
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="block w-full text-center py-3 px-4 rounded-xl border border-brand-accent/50 text-brand text-xs font-semibold uppercase tracking-wider hover:bg-brand-soft hover:border-brand-accent transition-all duration-300"
                >
                  Checkout
                </Link>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
