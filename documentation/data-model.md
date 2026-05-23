# Data Model

The database is **Supabase Postgres**. `backend/supabase_schema.sql` is the
single source of truth — tables, indexes, RLS, storage buckets, RPC functions,
and the seed of the three "type root" categories. There is no separate
migrations folder; the file is idempotent (`create ... if not exists`,
`alter table ... add column if not exists`).

## 1. Entity-relationship diagram

```mermaid
erDiagram
    profiles ||--o{ orders : places
    profiles ||--o{ cart_items : has
    profiles ||--o{ wishlist_items : has
    profiles ||--o{ addresses : has
    profiles ||--o{ offline_sales : "sold_by"
    profiles ||--o{ notifications : receives

    categories ||--o{ categories : "parent_id"
    categories ||--o{ products : groups
    categories ||--o{ coupons : "scopes"

    products ||--o{ product_images : has
    products ||--o{ variants : has
    products ||--o{ cart_items : in
    products ||--o{ order_items : in
    products ||--o{ offline_sales : in
    products ||--o{ coupons : "scopes"

    variants ||--o{ cart_items : selected
    variants ||--o{ order_items : selected
    variants ||--o{ offline_sales : selected

    orders ||--o{ order_items : contains
    addresses ||--o{ orders : "ships to"

    profiles {
        uuid id PK
        text name
        text phone
        user_role role
        employee_status employee_status
        text fcm_token
        text whatsapp
    }
    categories {
        uuid id PK
        text name
        text slug
        uuid parent_id FK
        text image_url
    }
    products {
        uuid id PK
        text title
        product_type type
        uuid category_id FK
        numeric base_price
        numeric discount_pct
        boolean published
    }
    variants {
        uuid id PK
        uuid product_id FK
        text color
        text size
        int quantity
        int sold_count
        text sku
    }
    product_images {
        uuid id PK
        uuid product_id FK
        text url
        text color
        boolean is_primary
        int display_order
    }
    orders {
        uuid id PK
        uuid user_id FK
        uuid address_id FK
        order_status status
        numeric total_amount
        numeric discount_amount
        text coupon_applied
        text razorpay_order_id
        text razorpay_payment_id
        text refund_status
        text refund_reason
    }
    order_items {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        uuid variant_id FK
        int quantity
        numeric unit_price
    }
    offline_sales {
        uuid id PK
        uuid variant_id FK
        uuid product_id FK
        uuid sold_by FK
        int quantity
        numeric unit_price
        text customer_name
        text customer_phone
    }
    coupons {
        uuid id PK
        text code
        numeric discount_pct
        int max_uses
        int used_count
        timestamptz starts_at
        timestamptz expires_at
        uuid category_id FK
        uuid product_id FK
        boolean active
    }
    cart_items {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
        uuid variant_id FK
        int quantity
    }
    addresses {
        uuid id PK
        uuid user_id FK
        text line1
        text line2
        text city
        text state
        text pincode
    }
```

## 2. Tables

| Table | Purpose |
|---|---|
| `profiles` | Extends `auth.users`. Holds role, employee approval status, contact + push token. |
| `categories` | Self-referential tree. Three top-level "type roots" (`saree` / `dress` / `jewellery`); real categories nest under them via `parent_id`. |
| `products` | Catalogue item. `type` = saree / dress / jewellery. `published` gates storefront visibility. |
| `variants` | A buyable unit of a product. Saree = colour only; dress = S–XXL; jewellery = gram weights. Holds `quantity` (stock) and `sold_count`. |
| `product_images` | Per-colour, per-angle images. `display_order` 0–9 = AI-generated, 10–19 = uploaded originals. |
| `cart_items` | A customer's live cart. |
| `addresses` | Saved delivery addresses. |
| `orders` | An online order. `status` follows the order state machine; refund fields track customer refund requests. |
| `order_items` | Line items of an order, with the unit price captured at purchase time. |
| `wishlist_items` | Saved products (`unique(user_id, product_id)`). |
| `coupons` | Discount codes. Optional validity window (`starts_at` / `expires_at`), usage cap (`max_uses`), and scope (`category_id` or `product_id`). |
| `offline_sales` | In-store "mark as sold" events recorded by an employee/admin, with walk-in customer details. |
| `notifications` | In-app notification feed. |

## 3. Enums

```
user_role        admin | employee | customer
employee_status  pending | approved | rejected
order_status     placed | confirmed | processing | shipped | delivered | cancelled | refunded
product_type     saree | dress | jewellery
```

## 4. RPC functions

| Function | Purpose |
|---|---|
| `decrement_variant_stock(variant_id, qty)` | Atomic stock decrement + `sold_count` bump. Prevents overselling under concurrent orders. |
| `daily_sales_last_30_days()` | Pre-aggregated revenue per day (returns `date` as `DD/MM` text + `revenue` numeric) for the analytics chart. |
| `increment_coupon_usage(code)` | Atomic `used_count` counter increment. |

## 5. `handle_new_user` trigger

```mermaid
sequenceDiagram
    participant API as backend
    participant AU as auth.users
    participant TR as handle_new_user (trigger)
    participant PR as profiles

    API->>AU: supabase.auth.admin.createUser(metadata)
    AU->>TR: AFTER INSERT
    TR->>PR: insert profile from raw_user_meta_data<br/>(name, phone, role, employee_status)
    API->>PR: upsert profile (reinforces fields)
```

A trigger on `auth.users` auto-creates the matching `profiles` row from the
user metadata. The register controller also upserts the same row, so the
profile is correct regardless of trigger timing.

## 6. Order status state machine

`VALID_ORDER_TRANSITIONS` (in `backend/src/types/index.ts`) is enforced on the
backend and mirrored in the admin UIs.

```mermaid
stateDiagram-v2
    [*] --> placed
    placed --> confirmed
    placed --> cancelled
    confirmed --> processing
    confirmed --> cancelled
    confirmed --> refunded
    processing --> shipped
    processing --> refunded
    shipped --> delivered
    shipped --> refunded
    delivered --> refunded
    cancelled --> [*]
    refunded --> [*]
```

- `placed` → set when the internal order is created (awaiting payment).
- `confirmed` → set by `verifyPayment` after a valid Razorpay signature.
- `refunded` → admin action; triggers a Razorpay refund of `total_amount`.
