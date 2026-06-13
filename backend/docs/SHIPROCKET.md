# Shiprocket Integration

End-to-end shipping & fulfillment via [Shiprocket](https://www.shiprocket.in/). Covers
courier serviceability, automatic shipment creation after payment, AWB assignment,
label/invoice/manifest generation, tracking, and real-time webhook status updates.

## Architecture

| Layer | File |
|---|---|
| API client (auth, retries, courier selection) | `src/services/shiprocketService.ts` |
| Controllers (handlers + auto-create + webhook) | `src/controllers/shipmentController.ts` |
| Routes | `src/routes/shipments.ts` (mounted at `/api/shipments`) |
| Auto-create trigger | `src/controllers/orderController.ts` → `verifyPayment` |
| Persistence | `orders` table columns (see schema below) |

The Shiprocket auth token is cached in-process (~9 days) and auto-refreshed on a 401.
All requests go through `srFetch`, which retries transient failures (429 / 5xx / network)
with exponential backoff (`SHIPROCKET_RETRY_MAX`, default 3).

## Environment variables

```bash
SHIPROCKET_EMAIL=your_api_user@example.com      # Settings > API > Create an API user
SHIPROCKET_PASSWORD=your_api_user_password
SHIPROCKET_PICKUP_LOCATION=Primary              # nickname from Settings > Pickup Addresses
SHIPROCKET_PICKUP_PINCODE=560001                # pickup pincode, used for serviceability
SHIPROCKET_WEBHOOK_TOKEN=random_secret_string   # shared secret for the webhook x-api-key
SHIPROCKET_AUTO_CREATE=true                      # auto-create shipment after payment (false = manual only)
SHIPROCKET_COURIER_STRATEGY=cheapest             # cheapest | fastest | rating
SHIPROCKET_RETRY_MAX=3                            # retries for transient API errors
```

> Use a dedicated **API user** (Settings > API), not your main login. Keep all credentials
> server-side only — they are never exposed to the storefront, admin app, or mobile app.

## Database

Added to the `orders` table (see `backend/supabase_migrations/supabase_schema.sql`):

| Column | Type | Purpose |
|---|---|---|
| `shiprocket_order_id` | text | Shiprocket order id |
| `shiprocket_shipment_id` | text | Shiprocket shipment id |
| `shiprocket_awb` | text | AWB / tracking number (indexed) |
| `shiprocket_courier_id` | int | assigned courier company id |
| `shiprocket_courier_name` | text | assigned courier name |
| `tracking_url` | text | public tracking link |
| `shipment_status` | text | normalized stage (see below) |
| `expected_delivery_date` | date | ETD from tracking/webhook |
| `label_url` / `invoice_url` / `manifest_url` | text | generated document URLs |

`create index idx_orders_awb on orders(shiprocket_awb)` — fast webhook lookups.

Run `backend/supabase_migrations/supabase_schema.sql` in the Supabase SQL Editor; the `alter table ... add column if not
exists` statements are idempotent.

## Order flow

1. Customer pays → `POST /api/razorpay/verify` confirms the order (`status = confirmed`),
   decrements stock, clears cart.
2. If `SHIPROCKET_AUTO_CREATE !== false`, `autoCreateShipment(orderId)` is enqueued on the
   notification queue (off the request path):
   - checks courier serviceability for the delivery pincode,
   - picks the best courier per `SHIPROCKET_COURIER_STRATEGY`,
   - creates the Shiprocket ad-hoc order, assigns an AWB,
   - saves ids/AWB/tracking URL and moves the order to `processing`.
   - **Failures are logged, not thrown** — an admin can still create the shipment manually.
3. Shiprocket pushes status updates to the webhook → order `shipment_status` and coarse
   `status` are updated, customer is notified.

Admins can also drive everything manually from the dashboard (`ShipmentPanel.tsx`).

## Status mapping

`order_status` enum is intentionally coarse. The granular shipment stage lives in
`orders.shipment_status`:

| Shiprocket signal | `shipment_status` | `order_status` |
|---|---|---|
| Picked Up | `PICKED UP` | `shipped` |
| In Transit / Shipped | `IN TRANSIT` | `shipped` |
| Out for Delivery | `OUT FOR DELIVERY` | `shipped` |
| Delivered | `DELIVERED` | `delivered` |
| RTO / Returned | `RETURNED` | *(unchanged)* + `refund_status = requested` |
| Cancelled | `CANCELLED` | `cancelled` |

A returned (RTO) shipment has no order-status equivalent, so it is flagged for refund
reconciliation instead of forcing an invalid transition.

## API endpoints

All under `/api/shipments`. Staff endpoints require `admin` or `employee` roles.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/serviceability` | staff | List couriers + rates for an order (`{ orderId, weight? }`) |
| `POST` | `/create` | staff | Create shipment. `courier_id` optional → auto-selects best (`{ orderId, courier_id?, weight? }`) |
| `POST` | `/:orderId/label` | staff | Generate & store shipping label, returns `{ label_url }` |
| `POST` | `/:orderId/invoice` | staff | Generate & store invoice, returns `{ invoice_url }` |
| `POST` | `/:orderId/manifest` | staff | Generate & store manifest, returns `{ manifest_url }` |
| `GET` | `/:orderId/track` | owner or staff | Live tracking by AWB |
| `POST` | `/:orderId/cancel` | staff | Cancel shipment on Shiprocket, clears shipment fields |
| `POST` | `/webhook` | `x-api-key` token | Real-time status updates from Shiprocket |

`POST /create` returns `400` for validation errors (already shipped, no address, not
confirmed, no courier available) and `502` for upstream/persistence failures.

## Webhook setup

1. Generate a strong random secret and set `SHIPROCKET_WEBHOOK_TOKEN` in the backend env.
2. In Shiprocket: **Settings > API > Configure Webhooks**.
3. Webhook URL: `https://<your-backend-domain>/api/shipments/webhook`
4. Set the custom header **`x-api-key`** to the same secret value.
5. Save. Shiprocket posts `{ awb, current_status, etd, ... }` on each tracking change.

Requests without a matching `x-api-key` get `401`. Unknown AWBs / missing AWB return
`200` with `skipped` so Shiprocket does not retry indefinitely.

## Testing steps

1. Set all `SHIPROCKET_*` env vars (use a Shiprocket test/sandbox API user).
2. `npm run dev` in `backend`.
3. Place + pay for an order through the storefront (or `POST /api/razorpay/verify`).
4. Confirm the order moved to `processing` and `shiprocket_awb` is populated:
   ```sql
   select id, status, shipment_status, shiprocket_awb, shiprocket_courier_name
   from orders order by created_at desc limit 1;
   ```
5. Serviceability: `POST /api/shipments/serviceability { "orderId": "<id>" }`.
6. Manual create (auto-create disabled): `POST /api/shipments/create { "orderId": "<id>" }`
   (omit `courier_id` to auto-select).
7. Label / invoice: `POST /api/shipments/<id>/label`, `.../invoice`.
8. Tracking: `GET /api/shipments/<id>/track`.
9. Webhook: `curl -X POST .../api/shipments/webhook -H "x-api-key: <token>" \
   -H "Content-Type: application/json" \
   -d '{"awb":"<awb>","current_status":"Out For Delivery"}'`
   then re-check `shipment_status` / `status`.

## Deployment considerations

- **Secrets**: store `SHIPROCKET_*` in your platform secret manager; never commit `.env`.
- **Webhook over HTTPS** only; rotate `SHIPROCKET_WEBHOOK_TOKEN` periodically.
- **Token cache** is per-process. Under `start:cluster` each worker logs in independently —
  fine, but expect N logins after a deploy.
- **Auto-create resilience**: it runs on the in-process notification queue. For higher
  guarantees replace `queueService` with BullMQ + Redis so jobs survive restarts and retry.
- **Pickup address** nickname (`SHIPROCKET_PICKUP_LOCATION`) must exactly match a verified
  pickup address in the Shiprocket dashboard, or order creation fails.
- **Rate limits**: Shiprocket throttles; `srFetch` backs off on 429 automatically.
