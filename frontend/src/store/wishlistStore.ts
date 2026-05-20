'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistState {
  productIds: string[]
  setIds: (ids: string[]) => void
  toggle: (id: string) => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      productIds: [],
      setIds: (ids) => set({ productIds: ids }),
      toggle: (id) =>
        set((s) => ({
          productIds: s.productIds.includes(id)
            ? s.productIds.filter((x) => x !== id)
            : [...s.productIds, id],
        })),
    }),
    { name: 'nb-wishlist' }
  )
)
