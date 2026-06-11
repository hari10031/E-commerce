'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  product_id: string
  variant_id: string
  quantity: number
  product: {
    id: string
    title: string
    base_price: number
    discount_pct: number
    images: { url: string; is_primary: boolean }[]
  }
  variant: {
    id: string
    color: string
    size: string
    sku: string
  }
}

interface CartState {
  items: CartItem[]
  coupon: string | null
  couponPct: number
  setItems: (items: CartItem[]) => void
  setCoupon: (code: string | null, pct: number) => void
  clear: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      coupon: null,
      couponPct: 0,
      setItems: (items) => set({ items: Array.isArray(items) ? items : [] }),
      setCoupon: (code, pct) => set({ coupon: code, couponPct: code ? pct : 0 }),
      clear: () => set({ items: [], coupon: null, couponPct: 0 }),
    }),
    {
      name: 'nb-cart',
      // Guarantee `items` is always an array, even if localStorage holds bad data.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<CartState>
        return { ...current, ...p, items: Array.isArray(p.items) ? p.items : [] }
      },
    }
  )
)
