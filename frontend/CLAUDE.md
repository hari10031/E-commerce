# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from `frontend/` with npm:

```bash
npm run dev     # Next.js 15 dev server (turbopack, port 3000)
npm run build   # production build
npm run lint    # ESLint
```

Type-check without emitting: `npx tsc --noEmit`

## Architecture

This is the **NanaBanana customer storefront** — a Next.js 15 App Router application. All data comes from the backend REST API at `http://localhost:4000` (configured via `NEXT_PUBLIC_API_URL`).

> **Note**: `src/routes/`, `src/lib/store.tsx`, and `src/lib/mock-data.ts` are leftover files from a previous Kalamandir/TanStack Start project. They are not loaded by Next.js and can be safely ignored or deleted.

## Data fetching

`src/lib/api.ts` is the single typed fetch wrapper for all backend calls. It injects the `Authorization: Bearer <token>` header when a token is passed. Server Components call `api.get()` directly; Client Components read from Zustand stores and call `api.post()` / `api.patch()` on user actions.

`src/lib/supabase.ts` creates a browser Supabase client (anon key) used only for auth — `signInWithPassword` / `signUp`. All other data goes through the backend.

## State

Three Zustand stores in `src/store/`, all persisted to `localStorage`:

| Store | Key | Contents |
|---|---|---|
| `authStore` | `nanabanana-auth` | JWT token + user object |
| `cartStore` | `nb-cart` | Cart items array from backend |
| `wishlistStore` | `nb-wishlist` | Array of product IDs |

## Route structure

```
src/app/
├── layout.tsx                  # Navbar, Footer, Toaster, Google Fonts
├── providers.tsx               # Client-side Zustand hydration wrapper
├── page.tsx                    # Home: hero + category cards + featured products
├── (auth)/login/page.tsx
├── (auth)/register/page.tsx
├── products/page.tsx           # Listing with sidebar filters (URL searchParams)
├── products/[id]/page.tsx      # Product detail (server) + AddToCartSection (client)
├── category/[slug]/page.tsx
├── cart/page.tsx               # Client component — reads cartStore
├── wishlist/page.tsx           # Client component — reads wishlistStore
├── checkout/page.tsx           # 3-step: Address → Razorpay → Success
├── orders/page.tsx
└── orders/[id]/page.tsx
```

Pages that only fetch data are Server Components. Pages that read Zustand stores or attach event handlers are Client Components (`'use client'`). The `AddToCartSection` pattern wraps client interactivity inside a server page without making the whole page a client component.

## Payments

`src/components/checkout/RazorpayButton.tsx` dynamically loads Razorpay's `checkout.js` via Next.js `<Script strategy="lazyOnload">`. Flow: `POST /api/razorpay/create` → open modal → `POST /api/razorpay/verify` on success → clear cart.

## Design tokens

`src/app/globals.css` uses Tailwind v4 `@theme` block. Brand primary is `oklch(0.60 0.22 35)` (saffron orange). All colors must use `oklch` format. Fonts: Plus Jakarta Sans (body) and Playfair Display (headings) loaded from Google Fonts in `layout.tsx`.

All prices use `formatPrice()` from `src/lib/utils.ts` — `en-IN` locale, INR currency, no decimal places.
