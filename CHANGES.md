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
```

Mobile API URL: set `EXPO_PUBLIC_API_URL` in `mobile/.env` (see `.env.example`).

---

## Documentation

- [`mobile/CHANGES.md`](mobile/CHANGES.md) — Full mobile redesign report
- [`PROJECT_STATUS.md`](PROJECT_STATUS.md) — Build status and feature coverage
- [`CLAUDE.md`](CLAUDE.md) — Project architecture reference
