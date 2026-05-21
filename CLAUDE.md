# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: NanaBanana — Full-Stack Indian E-Commerce Platform

Four independent apps (no monorepo). Each has its own `package.json`. npm only — no bun, no yarn.

```
s-box-c1/
├── backend/          # Express.js + TypeScript REST API        → :4000
├── frontend/         # Next.js 15 — Customer storefront        → :3000
├── adminfrontend/    # Next.js 15 — Admin web dashboard        → :3001
└── mobile/           # React Native (Expo) — Admin/Employee    → Expo Go
```

## Commands

```bash
# Backend
cd backend
npm run dev           # tsx watch (hot reload)
npm run build         # tsc → dist/
npm start             # node dist/index.js
npm run start:cluster # multi-core cluster (production)

# Customer frontend
cd frontend
npm run dev           # Next.js turbopack dev server

# Admin frontend
cd adminfrontend
npm run dev           # Next.js dev on port 3001

# Mobile
cd mobile
npx expo start        # open in Expo Go or simulator
```

No test suite is configured in any app. Type-check with `npx tsc --noEmit` in backend, frontend, or adminfrontend.

## Backend (`/backend`)

### Scalability architecture

- **Redis caching** (`ioredis`): Cache keys use `nb:<entity>:<params>`. TTLs: products=5min, product=10min, categories=30min, analytics=60s, cart=30s. Mutating a product calls `delCachePattern('nb:products:*')` to bust all list keys.
- **Rate limiting** (Redis-backed): 100 req/min general, 10 req/min auth endpoints, 20 req/min upload, 30 req/min AI.
- **Async notification queue** (`src/services/queueService.ts`): Twilio WhatsApp and Expo push are enqueued via `notificationQueue.enqueue()` — HTTP responses return before notifications fire.
- **Cluster mode** (`src/cluster.ts`): `npm run start:cluster` spawns one worker per CPU, auto-respawns on crash.
- **Graceful shutdown**: SIGTERM/SIGINT close the HTTP server, then quit Redis, with a 10s force-kill.
- **Health check**: `GET /health` — no auth, no rate limit, returns `{ status, redis, uptime }`.

### Auth and roles

- `src/supabase.ts` exports **two** clients. `supabase` is the **service-role** client — bypasses RLS, never pass it to any browser/app. `supabaseAuth` is the **anon** client — used *only* for `auth.signUp` / `auth.signInWithPassword` in `routes/auth.ts`. Critical: never call sign-in/sign-up on the `supabase` client; doing so swaps its credentials for the user session, so every later RLS-protected read returns empty.
- `authenticate` middleware (`src/middleware/auth.ts`) validates Supabase JWTs and attaches `req.user` with `{ id, email, role, employeeStatus }`.
- `requireRole(...roles)` blocks by role. `requireApprovedEmployee` passes admins and approved employees, rejects pending/rejected employees.

### Route → Controller pattern

Thin route files in `src/routes/` wire HTTP verbs to controller functions in `src/controllers/`. Business logic lives in controllers; services (`src/services/`) hold cross-cutting concerns (storage, notifications, queue).

### AI services

- `services/geminiService.ts` — `generateProductImage()` calls Google Gemini ("nano-banana", model `gemini-2.5-flash-image`, override via `GEMINI_IMAGE_MODEL`) to produce a clean product image, then uploads it to storage. Exposed at `POST /api/ai/generate-image` (multer; accepts an `image` file or an `imageUrl`).
- `POST /api/ai/generate-content` uses the Anthropic SDK for product title/description copy.

### Offline sales

`offline_sales` (table from migration `003`) records in-store "mark as sold" events. `salesController.ts` + `routes/sales.ts` (`/api/sales`, gated by `requireApprovedEmployee`) handle recording; the stock decrement reuses the `decrement_variant_stock` RPC. Analytics endpoints `/api/analytics/employee-performance`, `/sales-summary` (online vs offline), and `/category-inventory` aggregate across online orders + offline sales.

### Database

Run `supabase_schema.sql` in the Supabase SQL Editor before first start. Contains tables, all indexes, RLS, public storage buckets, and three RPC functions:
- `decrement_variant_stock(variant_id, qty)` — atomic stock decrement; prevents overselling under concurrent orders
- `daily_sales_last_30_days()` — pre-aggregated revenue data for the analytics chart
- `increment_coupon_usage(code)` — atomic coupon counter

`supabase_schema.sql` is the single source of truth — there is no separate migrations folder. It also seeds 3 top-level "type root" categories (slugs `saree`/`dress`/`jewellery`); real categories are nested under them via `parent_id`, and the apps map a product type to its root category by slug.

`product_type` enum values are `saree | dress | jewellery`. Sizes are type-driven: Saree has none (colors only), Dress is S–XXL, Jewellery is gram weights.

Copy `.env.example` → `.env`. Required vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `REDIS_URL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `ANTHROPIC_API_KEY`, `GOOGLE_GEMINI_API_KEY`.

## Customer Frontend (`/frontend`)

Next.js 15 App Router, Tailwind v4, Zustand, React Hook Form + Zod.

- **Auth split**: Supabase anon client (`src/lib/supabase.ts`) is used only for login/register. All product, cart, order, and wishlist data goes through the backend REST API via `src/lib/api.ts`.
- **State**: three Zustand stores persisted to `localStorage` — `authStore` (JWT + user), `cartStore` (cart items array), `wishlistStore` (product ID array with toggle).
- **Payments**: `RazorpayButton` lazily loads `checkout.js`, calls `POST /api/razorpay/create`, opens the Razorpay modal, then calls `POST /api/razorpay/verify` on success.
- **Prices**: always use `formatPrice()` from `src/lib/utils.ts` (en-IN, INR, no decimals).
- **Server vs client components**: pages that only fetch data are Server Components. Components needing `useAuthStore`/`useCartStore` or event handlers are Client Components (`'use client'`). The `AddToCartSection` pattern (a thin client wrapper inside a server page) is used on the product detail page.

> **Legacy note**: `src/routes/` and `src/lib/store.tsx` are leftover files from the previous Kalamandir TanStack Start app. They are not used by the Next.js runtime and can be ignored or deleted.

## Admin Frontend (`/adminfrontend`)

Next.js 15 App Router, Tailwind v4, Zustand, Recharts.

- **Auth guard**: `src/app/dashboard/layout.tsx` reads `authStore` and redirects to `/login` if no token. Admin-only pages (employees, coupons) additionally check `user.role === 'admin'`.
- **Product wizard**: `src/components/products/ProductWizard.tsx` manages 6-step state. Steps communicate via a shared `wizardData` object lifted into the wizard. Step 2 calls `POST /api/upload/image` (multipart). Step 4 calls `POST /api/ai/generate-content`. Step 6 sequentially posts product → variants (bulk) → images → optional coupon.
- **Analytics charts**: all use Recharts. `RevenueChart` (LineChart), `CategorySalesChart` (BarChart), `OrderStatusPie` (PieChart). `InventoryTable` highlights rows where `quantity < 5` in amber, `quantity === 0` in red.
- **Status transitions**: `StatusUpdateDropdown` enforces the same `VALID_ORDER_TRANSITIONS` map as the backend — it only shows valid next states in the dropdown.

## Mobile (`/mobile`)

Expo SDK 54 (React Native 0.81, React 19), NativeWind v4 (Tailwind class names in RN), Zustand + `expo-secure-store`, `@tanstack/react-query`. Source is **plain JSX** (`.jsx`, no TypeScript); entry is `index.jsx`. Run with `npm start` / `npx expo start`. Charts use `react-native-gifted-charts`.

- **Auth stored securely**: Zustand `authStore` uses `createJSONStorage(() => secureStorage)` where `secureStorage` wraps `expo-secure-store`. JWT never touches `AsyncStorage`.
- **Employee onboarding flow**: register → `/(auth)/pending` screen → polls `GET /api/auth/me` every 30 seconds until `employee_status === 'approved'`.
- **Push tokens**: `registerPushToken(token)` in `lib/notifications.jsx` runs after login. It requests permission, gets the Expo push token, and PATCHes it to `profiles.fcm_token` via `/api/auth/push-token`.
- **Role-gated tabs**: the "Employees" tab renders only when `user.role === 'admin'`. `navigation/MainTabs.jsx` has a raised center "+" FAB tab button that launches `ProductWizard`.
- **Product wizard**: same 6-step flow as the web wizard. `expo-image-picker` provides the image URI; `uploadImage()` in `lib/api.jsx` sends a `FormData` POST to `/api/upload/image`.

## Do NOT use

| Banned | Use instead |
|---|---|
| `bun` / `yarn` | `npm` |
| `pages/` router | Next.js App Router |
| `axios` | native `fetch` via each app's `lib/api.ts` |
| `Prisma` | `@supabase/supabase-js` v2 in backend only |
| `moment` | `date-fns` |
| `getServerSideProps` / `getStaticProps` | Server Components |
| `@tanstack/react-query` in web apps | Server Components (allowed in mobile) |
