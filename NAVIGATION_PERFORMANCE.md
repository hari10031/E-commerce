# Navigation & page-transition performance

Date: 2026-05-29

## Why it felt slow

| Layer | Cause |
|-------|--------|
| **Mobile stack** | Native stack default push animation ~300–350ms before new screen visible. |
| **Mobile tabs** | All tab stacks mounted at once; every return to a tab ran **full API refetch** on focus (ignored `staleTime`). |
| **Mobile product open** | Tap → navigate → wait for `/products/:id` with full-screen spinner; no prefetch from list. |
| **Mobile splash** | Fixed **2.8s** brand splash before app usable. |
| **Customer website** | Next.js had **no `loading.tsx`** — blank main area until server fetch finished. |
| **Customer website CSS** | Page enter animations **0.5–0.6s** + grid stagger up to **400ms** after content arrived. |
| **Admin website** | Client dashboard pages fetch in `useEffect`; no instant skeleton on route change. |

Network latency to the API is unchanged; these changes cut **UI wait** and **unnecessary refetch**.

---

## What we changed

### Mobile app
- Stack: `fade` animation, **200ms** (`navigationConfig.js`).
- Tabs: `lazy: true`, `freezeOnBlur: true` — less work on inactive tabs.
- React Query: **60s** default `staleTime`, shared `queryClient`, `prefetchProduct()` on list tap.
- Focus refetch: only when data is **stale** (not every tab switch).
- Product/order detail: show cached data when available; spinner only on cold load.
- Splash: **2.8s → 1.4s**.

### Customer website (`frontend`)
- `loading.tsx` on products, product detail, cart, wishlist, orders, checkout (skeleton shows immediately).
- Entrance animations: **~55% shorter** (0.5/0.6s → 0.22/0.28s).
- Product grid stagger cap: **400ms → 120ms**.
- Navbar search uses `startTransition` + faster header transition.

### Admin website (`adminfrontend`)
- `loading.tsx` on dashboard, products, orders.
- Sidebar collapse transition **300ms → 150ms**.

---

## Estimated improvement (perceived)

| Action | Before (typical) | After (typical) | Δ |
|--------|------------------|-----------------|-----|
| Mobile stack push (e.g. product detail) | ~350ms anim + 200–800ms API | ~200ms anim + **0ms** if prefetched | **~150–800ms** |
| Mobile tab switch (fresh data) | 300–1000ms refetch every time | **0ms** if within 60s stale window | **~300–1000ms** |
| Mobile cold app open (splash) | 2800ms minimum | 1400ms | **~1.4s** |
| Website route change (products) | Blank until RSC+API (~400–1500ms) | Skeleton **&lt;50ms**, then content | **Feels ~300–500ms faster** |
| Website content “settle” animation | 500–1000ms after paint | 220–400ms | **~300–600ms** |

*Real numbers depend on device, network, and API. Measure with React DevTools Profiler or Chrome Performance if you need exact ms.*

---

## How to verify

1. **Mobile:** Tab Dashboard → Collections → Dashboard within 30s — should not flash loading spinners.
2. **Mobile:** Open product from grid — second open same product should be instant.
3. **Website:** Click Products in nav — skeleton appears immediately, then grid.
4. **Admin:** Click Orders in sidebar — skeleton before table loads.
