# Runtime Flows

Sequence diagrams for every major flow in NanaBanana.

---

## 1. Customer registration & login

Customers register and sign in on the **storefront**. Accounts are created
pre-confirmed via the admin API — no verification email, no rate-limit issues.

```mermaid
sequenceDiagram
    participant C as Customer (storefront)
    participant BE as backend
    participant ADM as supabase.auth.admin
    participant AUTH as supabaseAuth (anon)
    participant DB as profiles

    Note over C,DB: Register
    C->>BE: POST /api/auth/register {email, password, name, role: customer}
    BE->>ADM: createUser({ email_confirm: true, user_metadata })
    ADM-->>BE: user (pre-confirmed)
    BE->>AUTH: signInWithPassword(email, password)
    AUTH-->>BE: session (access + refresh token)
    BE->>DB: upsert profile
    BE-->>C: { user, session }
    C->>C: authStore.setAuth(token, refreshToken, user)

    Note over C,DB: Login
    C->>BE: POST /api/auth/login {email, password}
    BE->>AUTH: signInWithPassword
    AUTH-->>BE: session
    BE->>DB: select profile
    BE-->>C: { token, refreshToken, user }
```

The storefront blocks staff: if a logged-in user's role is not `customer`, the
login screen rejects them.

---

## 2. Employee onboarding & approval

Employees register on the **mobile** app and must be approved by an admin.

```mermaid
sequenceDiagram
    participant E as Employee (mobile)
    participant BE as backend
    participant A as Admin (mobile)

    E->>BE: POST /api/auth/register {role: employee}
    BE->>BE: admin.createUser(email_confirm: true,<br/>employee_status: pending)
    BE-->>E: account created
    E->>E: redirected to Login

    E->>BE: POST /api/auth/login
    BE-->>E: token + user (employee_status: pending)
    E->>E: blocked → "Approval pending"

    A->>BE: GET /api/employees?status=pending
    BE-->>A: pending employees
    A->>BE: PATCH /api/employees/:id/approve {action: approve}
    BE->>BE: profiles.employee_status = approved

    E->>BE: POST /api/auth/login (retry)
    BE-->>E: token + user (employee_status: approved)
    E->>E: enters EmployeeTabs
```

`requireApprovedEmployee` middleware admits admins and approved employees only.

---

## 3. Browse → Cart → Checkout → Payment

The core purchase flow. Order totals are **always computed server-side**.

```mermaid
sequenceDiagram
    participant C as Customer
    participant BE as backend
    participant DB as Supabase
    participant RZP as Razorpay

    C->>BE: GET /api/products (Server Component)
    BE-->>C: published products

    C->>BE: POST /api/cart {product_id, variant_id, qty}
    BE-->>C: { items }

    Note over C,RZP: Checkout
    C->>BE: POST /api/razorpay/create {address, coupon}
    BE->>DB: load cart_items
    BE->>BE: validate stock per item
    BE->>BE: compute subtotal, shipping, coupon discount
    BE->>DB: insert addresses, orders (status: placed), order_items
    BE->>RZP: orders.create(amount, receipt: order.id)
    RZP-->>BE: razorpay_order_id
    BE-->>C: { razorpay_order_id, amount, order_id }

    C->>RZP: open checkout.js modal → pay
    RZP-->>C: razorpay_payment_id + signature

    C->>BE: POST /api/razorpay/verify {ids, signature}
    BE->>BE: HMAC-SHA256 signature check
    BE->>DB: orders.status = confirmed
    BE->>DB: decrement_variant_stock per item (RPC)
    BE->>DB: clear cart_items
    BE->>BE: enqueue admin notification
    BE-->>C: { success, order }
```

Stock is checked at order creation **and** atomically decremented on payment
verification, so concurrent buyers cannot oversell.

---

## 4. Refund

Customer requests a refund; an admin completes it, issuing a real Razorpay
refund.

```mermaid
sequenceDiagram
    participant C as Customer (storefront)
    participant BE as backend
    participant A as Admin (mobile)
    participant RZP as Razorpay
    participant DB as orders

    C->>BE: POST /api/orders/:id/refund {reason}
    BE->>BE: order must be confirmed/processing/shipped/delivered
    BE->>DB: refund_status = requested, refund_reason
    BE-->>C: order updated — "Refund requested"

    A->>BE: GET /api/orders/:id
    BE-->>A: order (refund_status: requested) → banner shown
    A->>BE: PATCH /api/orders/:id/status {status: refunded}
    BE->>BE: VALID_ORDER_TRANSITIONS allows → refunded
    BE->>RZP: payments.refund(payment_id, amount)
    RZP-->>BE: refund ok
    BE->>DB: status = refunded, refund_status = completed
    BE-->>A: order refunded
```

If the Razorpay refund call fails, the status change is rejected (`502`) — the
order is never marked refunded without the money actually being returned.

---

## 5. Offline sale ("Mark as sold")

An employee records an in-store sale. Decrements the same stock as online
orders.

```mermaid
sequenceDiagram
    participant E as Employee (mobile)
    participant BE as backend
    participant DB as Supabase

    E->>BE: POST /api/sales {variant_id, quantity, customer_name, customer_phone}
    BE->>BE: requireApprovedEmployee
    BE->>DB: load variant + product price
    BE->>BE: check stock, compute unit_price (after discount)
    BE->>DB: insert offline_sales (sold_by = employee)
    BE->>DB: decrement_variant_stock (RPC)
    BE-->>E: sale recorded
```

`GET /api/sales` scopes results: employees see only their own sales; admins see
all (optionally filtered by `soldBy`).

---

## 6. Product creation + AI (mobile wizard)

The product wizard uploads photos, generates a clean studio image and product
copy with Gemini, then persists the product.

```mermaid
sequenceDiagram
    participant W as Wizard (mobile)
    participant BE as backend
    participant ST as Supabase Storage
    participant GEM as Gemini

    W->>BE: POST /api/upload/image (per photo)
    BE->>ST: upload → public URL
    BE-->>W: { url }

    Note over W,GEM: AI image generation
    W->>BE: POST /api/ai/generate-image {imageUrls, type, color}
    BE->>BE: composite source photos (sharp)
    BE->>GEM: generateContent (image model)
    GEM-->>BE: studio image
    BE->>ST: upload generated image
    BE-->>W: { url }

    Note over W,GEM: AI copy (auto, after image)
    W->>BE: POST /api/ai/generate-content {imageUrl, type, color}
    BE->>GEM: generateContent (vision+text model)
    GEM-->>BE: { title, description }
    BE-->>W: title + description (editable)

    Note over W,BE: Save
    W->>BE: POST /api/products
    W->>BE: PUT /api/variants/product/:id/bulk
    W->>BE: POST /api/products/:id/images (xN)
    W->>BE: POST /api/products/:id/publish (optional)
```

Both AI features use the **Gemini** API (`GOOGLE_GEMINI_API_KEY`) — image
generation and copywriting. No Anthropic key is required.

---

## 7. Coupon validation & scoping

Coupons can be global, or scoped to a category / subcategory / a single
product, with an optional validity window and usage cap.

```mermaid
sequenceDiagram
    participant C as Customer (cart)
    participant BE as backend
    participant DB as Supabase

    C->>BE: GET /api/coupons/validate/:code (+ JWT)
    BE->>DB: load coupon
    BE->>BE: check active, starts_at, expires_at, max_uses
    alt coupon scoped to category/product
        BE->>DB: load user's cart
        BE->>BE: at least one item must match the scope
    end
    alt valid + scope matches
        BE-->>C: { code, discount_pct }
        C->>C: cartStore.setCoupon(code, pct)
    else invalid
        BE-->>C: 400 { error: clear message }
    end

    Note over C,BE: at checkout
    C->>BE: POST /api/razorpay/create {coupon}
    BE->>BE: re-validate coupon + scope gate (server-trusted)
    BE->>DB: increment_coupon_usage (RPC)
```

The cart's display is optimistic; `createRazorpayOrder` re-validates the coupon
and the scope gate at payment time so the final discount is always correct.

---

## 8. Async notifications

WhatsApp and push notifications never block the HTTP response.

```mermaid
sequenceDiagram
    participant CTRL as Controller
    participant Q as notificationQueue
    participant TW as Twilio WhatsApp
    participant EXP as Expo Push

    CTRL->>Q: enqueue(notification)
    CTRL-->>CTRL: return HTTP response immediately
    Q->>TW: send WhatsApp (async)
    Q->>EXP: send push (async)
```

Triggers include: a new order placed (notify admin), and an order status
change (notify the customer).

---

## 9. Token refresh

Keeps users signed in past the ~1h access-token expiry.

```mermaid
sequenceDiagram
    participant CL as Client (api wrapper)
    participant BE as backend

    CL->>BE: GET /api/... (expired access token)
    BE-->>CL: 401
    CL->>BE: POST /api/auth/refresh {refreshToken}
    alt refresh valid
        BE-->>CL: { token, refreshToken }
        CL->>CL: authStore updated
        CL->>BE: replay original request (once)
        BE-->>CL: 200
    else refresh invalid
        BE-->>CL: 401
        CL->>CL: clearAuth → Login
    end
```

Concurrent 401s share a single in-flight refresh promise so the refresh
endpoint is called only once.
