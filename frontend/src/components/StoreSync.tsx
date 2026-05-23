'use client'

import { useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useCartStore, type CartItem } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import type { Product } from '@/types'

// Keeps cart + wishlist in sync with the backend (the source of truth)
// whenever auth state changes. Renders nothing.
export function StoreSync() {
  const token = useAuthStore((s) => s.token)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const setCartItems = useCartStore((s) => s.setItems)
  const setWishlistIds = useWishlistStore((s) => s.setIds)

  useEffect(() => {
    if (!hasHydrated) return
    if (!token) {
      setCartItems([])
      setWishlistIds([])
      return
    }
    api.get<{ items: CartItem[] }>('/api/cart', token)
      .then((r) => setCartItems(r.items ?? []))
      .catch(() => {})
    api.get<{ data: Product[] }>('/api/wishlist', token)
      .then((r) => setWishlistIds((r.data ?? []).map((p) => p.id)))
      .catch(() => {})
  }, [token, hasHydrated, setCartItems, setWishlistIds])

  return null
}
