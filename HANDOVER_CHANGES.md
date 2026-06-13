# Handover: Before → After Changes

Production-readiness pass completed across mobile, backend, customer frontend, and admin dashboard.

---

## Mobile (`mobile/`)

| Area | Before | After |
|------|--------|-------|
| **Saree photo picker** | Two-step flow: pick photo → Alert ("Use photo / Crop 3:4") → second `launchCameraAsync` from Alert callback → **Android crash** (`ActivityResultLauncher` unregistered) | Single picker launch with system **3:4 crop editor** (`allowsEditing: true, aspect: [3, 4]`). Photo → crop → upload. No double dialog. |
| **Category picker** | 4:3 aspect crop | 3:4 aspect (catalog consistency) |
| **Legacy wizard steps** | Unused `StepPhotos.jsx`, `Step2Images.jsx`, `StepAIGenerate.jsx` still in repo | Deleted |
| **Image rendering** | React Native `Image` (no disk cache) | `expo-image` with `cachePolicy="memory-disk"` on ProductCard, ProductDetail gallery, Dashboard modal, ProductWizard grids |
| **Web hero crop** | Unchanged | Canvas crop modal still used on web for hero slot |

**APK:** Rebuild with `eas build --profile production --platform android`. Prior "APK not working" symptom was the picker crash — fixed above.

---

## Backend (`backend/`)

| Area | Before | After |
|------|--------|-------|
| **Razorpay create** | `razorpay_order_id` not stored on internal order; coupon burned at create | `razorpay_order_id` saved at create; coupon usage moved to **verify** only |
| **Razorpay verify** | No idempotency; no amount check; stock could decrement twice | Idempotent (`status='placed'` guard); amount cross-check vs Razorpay order; returns `alreadyVerified` on replay |
| **Stock RPC** | `decrement_variant_stock` floored at 0 → silent oversell | Raises `Insufficient stock` when `quantity < qty` — **run updated function in Supabase SQL Editor** from `backend/supabase_migrations/supabase_schema.sql` |
| **Gemini image** | Quota consumed before generation; no timeout; text refusals hidden | Quota refunded on failure; 60s timeout; Gemini refusal text surfaced |
| **Gemini content** | Raw multipart uploads; quota before success | `optimizeSourceImage` on uploads; quota refunded on failure; 15s fetch timeout on URLs |
| **Multer errors** | Oversize/MIME → generic 500 | 413 / 415 via global error handler |
| **Shiprocket** | `order.id.slice(0,8)` collisions; duplicate auto+manual shipment race | Full UUID-based ref (20 chars); atomic `shipment_status='CREATING'` claim before API call; reset on failure |
| **Docs / .env** | Redis + Anthropic documented but unused | Removed stale vars; Gemini text model documented |
| **Smoke check** | None | `npm run check:integrations` — Supabase, Razorpay, Shiprocket, Gemini, Twilio env |

---

## Customer Frontend (`frontend/`)

| Area | Before | After |
|------|--------|-------|
| **API caching** | All requests `revalidate: 0` | Public GETs: products 60s, categories 300s; authed/private paths `no-store` |
| **Home page** | Fetched 100 products; no loading skeleton | Limit 48; `app/loading.tsx` skeleton |
| **Categories fetch** | Navbar + CategoryFilter each hit `/api/categories` every navigation | Shared `fetchCategoriesClient()` — one in-flight request |
| **Category page** | Sequential category → products | Uses cached `getCategories()` when slug in list |
| **Hero slider** | All 4 slides mounted (4 large images) | Only active + next slide in DOM; `sizes="100vw"`; quality 80 |
| **Product images** | Quality 90–95 | Quality 80 (grid/gallery); lightbox 85 |
| **Cart drawer** | Missing `sizes` on thumbnails | `sizes="80px"` |

---

## Admin Dashboard (`adminfrontend/`)

| Area | Before | After |
|------|--------|-------|
| **Charts** | Recharts statically imported on dashboard + analytics | `next/dynamic` with loading skeletons |
| **Product wizard** | Eager import on new/edit pages | Dynamic import — smaller initial bundle |
| **Category images** | `unoptimized` flag bypassing Next optimizer | Removed — AVIF/WebP via `next.config.ts` |
| **Product search** | Refetch on every keystroke | 300ms debounce |
| **Auth hydration** | Blank flash / false redirect before Zustand rehydrate | `hasHydrated` guard + spinner in dashboard layout |

---

## Client action required

1. **Supabase:** Run the updated `decrement_variant_stock` function from `backend/supabase_migrations/supabase_schema.sql` in the SQL Editor.
2. **Rebuild mobile APK:** `cd mobile && eas build --profile production --platform android`
3. **Verify integrations:** `cd backend && npm run check:integrations`
4. **Type-check:** `npx tsc --noEmit` in `backend`, `frontend`, `adminfrontend`

---

## Not changed (documented only)

- Full Redis caching layer (was documented but never implemented — docs corrected).
- Admin SPA → Server Components rewrite (deferred; dynamic imports capture most perf win).
