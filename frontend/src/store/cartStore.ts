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
  setItems: (items: CartItem[]) => void
  clear: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      setItems: (items) => set({ items }),
      clear: () => set({ items: [] }),
    }),
    { name: 'nb-cart' }
  )
)
