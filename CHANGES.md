# E-commerce Project — Change Log

Date: 2026-05-20

Repository: [hari10031/E-commerce](https://github.com/hari10031/E-commerce)

---

## Overview

This update focuses on the **mobile app** (React Native / Expo) with role-based UX, Indian-themed UI, hierarchical collections, and a single-page add-product form. Backend and web frontends received stability fixes.

---

## Mobile App (primary changes)

See detailed report: [`mobile/CHANGES.md`](mobile/CHANGES.md)

### Highlights

1. **Role-based navigation** — Admin, Employee, and Customer (User Mode) tab layouts
2. **Dashboard** — Product-free landing with KPIs and quick actions
3. **Collections hierarchy** — Type cards → subcategories → product grid (back navigation)
4. **Add Product (+)** — Type selector modal, then single scrollable form (photos, AI, details, pricing, variants)
5. **Customers & Team** — Day-wise orders, employee performance, dispatch workflow
6. **Mock data** — 15 Indian-market products with colored placeholder cards
7. **Product detail** — Swipeable images, role-aware sell flow for staff
8. **Sign-out fix** — Server-side token invalidation via `/api/auth/logout`
9. **Indian UI** — Warm amber/rose palette, decorative dividers, themed empty states

### Key mobile files changed

| File | Change |
|------|--------|
| `mobile/src/navigation/MainTabs.jsx` | Role tabs + top-level type selector modal |
| `mobile/src/screens/products/ProductsScreen.jsx` | 3-level collections tree |
| `mobile/src/screens/products/wizard/ProductWizardScreen.jsx` | Single-page add form |
| `mobile/src/screens/products/ProductDetailScreen.jsx` | Swipeable gallery + sell flow |
| `mobile/src/components/products/TypeSelectorModal.jsx` | Sarees/Dresses/Gold picker |
| `mobile/src/constants/mockProducts.jsx` | 15 mock products |
| `mobile/src/constants/categories.jsx` | Indian category mock data |
| `mobile/src/store/authStore.jsx` | User mode toggle |
| `mobile/src/lib/api.jsx` | logout(), AI, upload helpers |

---

## Backend

| File | Change |
|------|--------|
| `backend/src/supabase.ts` | Explicit `.env` load before Supabase init (fixes race condition) |
| `backend/src/index.ts` | Clear `EADDRINUSE` error message when port 4000 is busy |

---

## Admin Frontend

| File | Change |
|------|--------|
| `adminfrontend/src/components/dashboard/CategorySalesChart.tsx` | Removed invalid SVG tick prop |
| `adminfrontend/src/components/ui/input.tsx` | Fixed empty interface lint error |

---

## Customer Frontend

| File | Change |
|------|--------|
| `frontend/tsconfig.json` | Excluded legacy TanStack Router files from build |
| `frontend/eslint.config.js` | Ignored legacy routes for lint |
| `frontend/src/components/layout/Footer.tsx` | Escaped apostrophes for ESLint |

---

## Environment

| App | File | Notes |
|-----|------|-------|
| Mobile | `mobile/.env.example` | `EXPO_PUBLIC_API_URL` template |
| Super admin | `superadmin/.env.example` | `NEXT_PUBLIC_API_URL` template |
| Backend | `backend/.env` | Not committed (gitignored) |

---

## How to run

```bash
# Backend
cd backend && npm install && npm run dev

# Admin web
cd adminfrontend && npm install && npm run dev

# Customer web
cd frontend && npm install && npm run dev

# Mobile
cd mobile && npm install && npx expo start

# Super admin console (Gemini quota — not linked from other apps)
cd superadmin && npm install && npm run dev
```

Mobile API URL: set `EXPO_PUBLIC_API_URL` in `mobile/.env` (see `.env.example`).

---

## Navigation performance (2026-05-29)

Faster page/tab transitions on mobile app, customer website, and admin website. See [`NAVIGATION_PERFORMANCE.md`](NAVIGATION_PERFORMANCE.md) for causes and estimated gains.

---

## Super Admin — Gemini AI Quota (2026-05-31)

Hidden **5th app** for platform-level Gemini usage control. Not linked from admin or mobile.

### Setup

1. Run SQL migration in Supabase: [`backend/supabase_migrations/superadmin_ai_quota.sql`](backend/supabase_migrations/superadmin_ai_quota.sql)
2. Create super admin account (credentials **only** in shell env, never in code):

```bash
cd backend
SUPERADMIN_EMAIL=sbox-platform-admin@yourdomain.com \
SUPERADMIN_PASSWORD='your-strong-password-min-16-chars' \
node scripts/create-superadmin.js
```

3. Add `http://localhost:3002` to `ALLOWED_ORIGINS` in `backend/.env`
4. Start superadmin app: `cd superadmin && npm install && npm run dev` → http://localhost:3002

### Features

- Dashboard: images/content used, remaining, limits
- Edit image and content limits + monthly vs lifetime reset
- Manual usage counter reset
- Backend enforces quota on `/api/ai/generate-image` and `/api/ai/generate-content` (429 when exhausted)
- `superadmin` role hidden from admin user/employee lists; blocked on admin + mobile login

### Key files

| Area | File |
|------|------|
| Migration | `backend/supabase_migrations/superadmin_ai_quota.sql` |
| Quota service | `backend/src/services/aiQuotaService.ts` |
| Super admin API | `backend/src/routes/superadmin.ts` |
| Create account | `backend/scripts/create-superadmin.js` |
| Console UI | `superadmin/` (port 3002) |

---

## Documentation

- [`mobile/CHANGES.md`](mobile/CHANGES.md) — Full mobile redesign report
- [`NAVIGATION_PERFORMANCE.md`](NAVIGATION_PERFORMANCE.md) — Route transition tuning
- [`PROJECT_STATUS.md`](PROJECT_STATUS.md) — Build status and feature coverage
- [`CLAUDE.md`](CLAUDE.md) — Project architecture reference
