'use client'
import { create } from 'zustand'

interface WishlistState {
  productIds: string[]
  setIds: (ids: string[]) => void
  toggle: (id: string) => void
}

// Wishlist is backend-owned. This store is just an in-memory mirror,
// populated from the API on load (see StoreSync) — not persisted.
export const useWishlistStore = create<WishlistState>((set) => ({
  productIds: [],
  setIds: (ids) => set({ productIds: Array.isArray(ids) ? ids : [] }),
  toggle: (id) =>
    set((s) => ({
      productIds: (s.productIds ?? []).includes(id)
        ? (s.productIds ?? []).filter((x) => x !== id)
        : [...(s.productIds ?? []), id],
    })),
}))
