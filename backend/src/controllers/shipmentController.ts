import { Response } from 'express'
import { supabase } from '../supabase'
import { AuthRequest } from '../middleware/auth'
import { notifyCustomerStatusUpdate } from '../services/notificationService'
import {
  assignAwb,
  cancelByAwbs,
  checkServiceability,
  createAdhocOrder,
  generateInvoice,
  generateLabel,
  generateManifest,
  getPickupLocation,
  getPickupPincode,
  selectBestCourier,
  trackByAwb,
  type CreateAdhocOrderPayload,
} from '../services/shiprocketService'
import { logger } from '../logger'
import type { OrderStatus } from '../types'

const ORDER_SELECT = `
  *,
  user:profiles!user_id(id, name, phone),
  address:addresses(*),
  order_items(
    id, quantity, unit_price,
    product:products(id, title, type),
    variant:variants(id, color, size, sku)
  )
`

const WEIGHT_KG: Record<string, number> = {
  saree: 0.5,
  jewellery: 0.2,
}

function defaultWeightKg(
  items: Array<{ quantity: number; product?: { type?: string } | null }>
): number {
  let total = 0
  for (const item of items) {
    const type = item.product?.type ?? 'saree'
    total += (WEIGHT_KG[type] ?? 0.5) * item.quantity
  }
  return Math.max(0.1, Math.round(total * 100) / 100)
}

async function loadOrderForShipment(orderId: string, userId?: string) {
  let query = supabase.from('orders').select(ORDER_SELECT).eq('id', orderId)
  if (userId) query = query.eq('user_id', userId)
  const { data, error } = await query.single()
  if (error || !data) return null
  return data
}

async function getCustomerEmail(userId: string): Promise<string> {
  const { data, error } = await supabase.auth.admin.getUserById(userId)
  if (error || !data.user?.email) return 'customer@yuvaranisilks.in'
  return data.user.email
}

function buildAdhocPayload(
  order: Awaited<ReturnType<typeof loadOrderForShipment>> & object,
  email: string,
  weight: number
): CreateAdhocOrderPayload {
  const addr = order.address as {
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
    country?: string
  }
  const user = order.user as { name: string; phone?: string }
  const nameParts = (user?.name ?? 'Customer').trim().split(/\s+/)
  const firstName = nameParts[0] ?? 'Customer'
  const lastName = nameParts.slice(1).join(' ') || '.'

  const items = (order.order_items ?? []) as Array<{
    quantity: number
    unit_price: number
    product?: { title?: string; type?: string } | null
    variant?: { sku?: string; color?: string; size?: string } | null
  }>

  return {
    order_id: order.id.slice(0, 8).toUpperCase(),
    order_date: new Date(order.created_at).toISOString().slice(0, 16).replace('T', ' '),
    pickup_location: getPickupLocation(),
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: addr.line1,
    billing_address_2: addr.line2 ?? undefined,
    billing_city: addr.city,
    billing_pincode: addr.pincode,
    billing_state: addr.state,
    billing_country: addr.country ?? 'India',
    billing_email: email,
    billing_phone: user?.phone ?? '9999999999',
    shipping_is_billing: true,
    order_items: items.map((item, idx) => ({
      name: item.product?.title ?? `Item ${idx + 1}`,
      sku: item.variant?.sku ?? `SKU-${idx + 1}`,
      units: item.quantity,
      selling_price: Number(item.unit_price),
    })),
    payment_method: 'Prepaid',
    sub_total: Number(order.total_amount),
    length: 20,
    breadth: 15,
    height: 5,
    weight,
  }
}

export async function checkServiceabilityHandler(req: AuthRequest, res: Response) {
  const { orderId, weight: weightOverride } = req.body as {
    orderId?: string
    weight?: number
  }
  if (!orderId) return res.status(400).json({ error: 'orderId is required' })

  const order = await loadOrderForShipment(orderId)
  if (!order) return res.status(404).json({ error: 'Order not found' })
  if (!order.address) {
    return res.status(400).json({ error: 'Order has no delivery address' })
  }

  const addr = order.address as { pincode: string }
  const items = (order.order_items ?? []) as Array<{ quantity: number; product?: { type?: string } }>
  const weight = weightOverride ?? defaultWeightKg(items)

  const couriers = await checkServiceability({
    pickup_postcode: getPickupPincode(),
    delivery_postcode: addr.pincode,
    weight,
    cod: 0,
    order_id: order.shiprocket_order_id ?? order.id.slice(0, 8),
  })

  res.json({ couriers, weight, delivery_pincode: addr.pincode })
}

type CreateShipmentResult = {
  order: ShipmentOrder
  awb: string
  courier_id: number
  courier_name: string
  tracking_url: string
  shiprocket_order_id: number
  shiprocket_shipment_id: number
}

/**
 * Core shipment-creation routine shared by the manual admin endpoint and the
 * automatic post-payment flow. Validates the order, resolves a courier
 * (auto-selecting the best one per SHIPROCKET_COURIER_STRATEGY when `courierId`
 * is omitted), creates the Shiprocket order, assigns an AWB, and persists the
 * result. Throws on any failure — callers decide how to surface it.
 */
async function createShipmentForOrder(
  order: ShipmentOrder,
  opts: { courierId?: number; weight?: number } = {}
): Promise<CreateShipmentResult> {
  if (order.shiprocket_awb) {
    throw new Error('Shipment already created for this order')
  }
  if (!order.address) {
    throw new Error('Order has no delivery address')
  }
  if (!['confirmed', 'processing'].includes(order.status)) {
    throw new Error(
      `Cannot ship order with status "${order.status}". Order must be confirmed first.`
    )
  }

  const items = (order.order_items ?? []) as Array<{
    quantity: number
    product?: { type?: string }
  }>
  const weight = opts.weight ?? defaultWeightKg(items)

  // Resolve the courier: caller-supplied, else best available per strategy.
  let courierId = opts.courierId
  if (courierId == null) {
    const addr = order.address as { pincode: string }
    const couriers = await checkServiceability({
      pickup_postcode: getPickupPincode(),
      delivery_postcode: addr.pincode,
      weight,
      cod: 0,
      order_id: order.id.slice(0, 8),
    })
    const best = selectBestCourier(couriers)
    if (!best) {
      throw new Error(`No courier available for pincode ${addr.pincode}`)
    }
    courierId = best.courier_company_id
  }

  const email = await getCustomerEmail(order.user_id)
  const payload = buildAdhocPayload(order, email, weight)

  const created = await createAdhocOrder(payload)
  const awbResult = await assignAwb(created.shipment_id, courierId)

  const trackingUrl = `https://shiprocket.co/tracking/${awbResult.awb_code}`

  const { data: updated, error } = await supabase
    .from('orders')
    .update({
      shiprocket_order_id: String(created.order_id),
      shiprocket_shipment_id: String(created.shipment_id),
      shiprocket_awb: awbResult.awb_code,
      shiprocket_courier_id: awbResult.courier_company_id ?? courierId,
      shiprocket_courier_name: awbResult.courier_name,
      tracking_url: trackingUrl,
      shipment_status: 'AWB ASSIGNED',
      status: 'processing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id)
    .select(ORDER_SELECT)
    .single()

  if (error || !updated) {
    throw new Error(error?.message ?? 'Failed to persist shipment')
  }

  notifyCustomerStatusUpdate(order.user_id, order.id, 'processing')

  return {
    order: updated,
    awb: awbResult.awb_code,
    courier_id: awbResult.courier_company_id ?? courierId,
    courier_name: awbResult.courier_name,
    tracking_url: trackingUrl,
    shiprocket_order_id: created.order_id,
    shiprocket_shipment_id: created.shipment_id,
  }
}

/**
 * Fire-and-forget shipment creation triggered after successful payment.
 * Gated by SHIPROCKET_AUTO_CREATE (default on). Always resolves — failures are
 * logged so an admin can still create the shipment manually from the dashboard.
 */
export async function autoCreateShipment(orderId: string): Promise<void> {
  if (process.env.SHIPROCKET_AUTO_CREATE === 'false') return
  try {
    const order = await loadOrderForShipment(orderId)
    if (!order) {
      logger.warn({ orderId }, 'autoCreateShipment: order not found')
      return
    }
    if (order.shiprocket_awb) return // already shipped
    const result = await createShipmentForOrder(order)
    logger.info(
      { orderId, awb: result.awb, courier: result.courier_name },
      'Shiprocket shipment auto-created'
    )
  } catch (err) {
    logger.error({ orderId, err }, 'autoCreateShipment failed — admin must create manually')
  }
}

export async function createShipmentHandler(req: AuthRequest, res: Response) {
  const { orderId, courier_id, weight: weightOverride } = req.body as {
    orderId?: string
    courier_id?: number
    weight?: number
  }
  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required' })
  }

  const order = await loadOrderForShipment(orderId)
  if (!order) return res.status(404).json({ error: 'Order not found' })

  try {
    const result = await createShipmentForOrder(order, {
      courierId: courier_id ?? undefined,
      weight: weightOverride,
    })
    res.json({
      order: result.order,
      awb: result.awb,
      courier_id: result.courier_id,
      courier_name: result.courier_name,
      tracking_url: result.tracking_url,
      shiprocket_order_id: result.shiprocket_order_id,
      shiprocket_shipment_id: result.shiprocket_shipment_id,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create shipment'
    // Validation-style messages → 400; upstream/persist failures → 502.
    const isValidation =
      msg.includes('already created') ||
      msg.includes('no delivery address') ||
      msg.includes('must be confirmed') ||
      msg.includes('No courier available')
    res.status(isValidation ? 400 : 502).json({ error: msg })
  }
}

type ShipmentOrder = NonNullable<Awaited<ReturnType<typeof loadOrderForShipment>>>

async function requireShipment(
  orderId: string
): Promise<{ ok: true; order: ShipmentOrder } | { ok: false; error: string; status: number }> {
  const order = await loadOrderForShipment(orderId)
  if (!order) return { ok: false, error: 'Order not found', status: 404 }
  if (!order.shiprocket_shipment_id) {
    return { ok: false, error: 'No Shiprocket shipment on this order', status: 400 }
  }
  return { ok: true, order }
}

export async function getLabelHandler(req: AuthRequest, res: Response) {
  const { orderId } = req.params
  const loaded = await requireShipment(orderId)
  if (!loaded.ok) return res.status(loaded.status).json({ error: loaded.error })

  const shipmentId = Number(loaded.order.shiprocket_shipment_id)
  if (!Number.isFinite(shipmentId)) {
    return res.status(400).json({ error: 'Invalid Shiprocket shipment id' })
  }
  const labelUrl = await generateLabel([shipmentId])

  await supabase
    .from('orders')
    .update({ label_url: labelUrl, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  res.json({ label_url: labelUrl })
}

export async function getInvoiceHandler(req: AuthRequest, res: Response) {
  const { orderId } = req.params
  const loaded = await requireShipment(orderId)
  if (!loaded.ok) return res.status(loaded.status).json({ error: loaded.error })

  const srOrderId = Number(loaded.order.shiprocket_order_id)
  if (!Number.isFinite(srOrderId)) {
    return res.status(400).json({ error: 'Invalid Shiprocket order id' })
  }
  const invoiceUrl = await generateInvoice([srOrderId])

  await supabase
    .from('orders')
    .update({ invoice_url: invoiceUrl, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  res.json({ invoice_url: invoiceUrl })
}

export async function getManifestHandler(req: AuthRequest, res: Response) {
  const { orderId } = req.params
  const loaded = await requireShipment(orderId)
  if (!loaded.ok) return res.status(loaded.status).json({ error: loaded.error })

  const shipmentId = Number(loaded.order.shiprocket_shipment_id)
  if (!Number.isFinite(shipmentId)) {
    return res.status(400).json({ error: 'Invalid Shiprocket shipment id' })
  }
  const manifestUrl = await generateManifest([shipmentId])

  await supabase
    .from('orders')
    .update({ manifest_url: manifestUrl, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  res.json({ manifest_url: manifestUrl })
}

export async function trackShipmentHandler(req: AuthRequest, res: Response) {
  const { orderId } = req.params
  const userId = req.user!.role === 'customer' ? req.user!.id : undefined
  const order = await loadOrderForShipment(orderId, userId)
  if (!order) return res.status(404).json({ error: 'Order not found' })
  if (!order.shiprocket_awb) {
    return res.status(400).json({ error: 'No AWB assigned yet' })
  }

  const tracking = await trackByAwb(order.shiprocket_awb)
  res.json({ tracking, awb: order.shiprocket_awb, tracking_url: order.tracking_url })
}

export async function cancelShipmentHandler(req: AuthRequest, res: Response) {
  const { orderId } = req.params
  const loaded = await requireShipment(orderId)
  if (!loaded.ok) return res.status(loaded.status).json({ error: loaded.error })

  if (['shipped', 'delivered'].includes(loaded.order.status)) {
    return res.status(400).json({ error: 'Cannot cancel shipment after it has been shipped' })
  }

  const awb = loaded.order.shiprocket_awb
  if (!awb) {
    return res.status(400).json({ error: 'No AWB on this order' })
  }
  await cancelByAwbs([awb])

  const { data, error } = await supabase
    .from('orders')
    .update({
      shiprocket_order_id: null,
      shiprocket_shipment_id: null,
      shiprocket_awb: null,
      shiprocket_courier_id: null,
      shiprocket_courier_name: null,
      tracking_url: null,
      shipment_status: 'CANCELLED',
      label_url: null,
      invoice_url: null,
      manifest_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select(ORDER_SELECT)
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json({ order: data, message: 'Shipment cancelled on Shiprocket' })
}

// Granular shipment lifecycle stored in orders.shipment_status (text).
// The order_status enum is intentionally coarse, so several shipment states
// collapse onto a single order status (see mapWebhookToOrderStatus).
export type NormalizedShipmentStatus =
  | 'PICKED UP'
  | 'IN TRANSIT'
  | 'OUT FOR DELIVERY'
  | 'DELIVERED'
  | 'RETURNED'
  | 'CANCELLED'

function normalizeShipmentStatus(raw: string): NormalizedShipmentStatus | null {
  const s = raw.toUpperCase()
  if (s.includes('DELIVERED')) return 'DELIVERED'
  if (s.includes('OUT FOR DELIVERY')) return 'OUT FOR DELIVERY'
  if (s.includes('RTO') || s.includes('RETURN')) return 'RETURNED'
  if (s.includes('CANCEL')) return 'CANCELLED'
  if (s.includes('TRANSIT') || s.includes('SHIPPED')) return 'IN TRANSIT'
  if (s.includes('PICKED') || s.includes('PICK')) return 'PICKED UP'
  return null
}

// Maps the granular shipment status onto the coarse order_status enum.
// 'RETURNED' has no enum equivalent — handled separately in the webhook.
function mapWebhookToOrderStatus(normalized: NormalizedShipmentStatus | null): OrderStatus | null {
  switch (normalized) {
    case 'DELIVERED':
      return 'delivered'
    case 'PICKED UP':
    case 'IN TRANSIT':
    case 'OUT FOR DELIVERY':
      return 'shipped'
    case 'CANCELLED':
      return 'cancelled'
    default:
      return null
  }
}

export async function webhookHandler(req: AuthRequest, res: Response) {
  const token = req.headers['x-api-key'] as string | undefined
  const expected = process.env.SHIPROCKET_WEBHOOK_TOKEN
  if (!expected || token !== expected) {
    return res.status(401).json({ error: 'Invalid webhook token' })
  }

  const body = req.body as {
    awb?: string
    current_status?: string
    shipment_status?: string
    etd?: string
    scans?: unknown
  }

  const awb = body.awb
  const shipmentStatus = body.current_status ?? body.shipment_status ?? ''
  if (!awb) {
    return res.status(200).json({ ok: true, skipped: 'no awb' })
  }

  const { data: order } = await supabase
    .from('orders')
    .select('id, user_id, status, refund_status')
    .eq('shiprocket_awb', awb)
    .maybeSingle()

  if (!order) {
    return res.status(200).json({ ok: true, skipped: 'order not found' })
  }

  const normalized = normalizeShipmentStatus(shipmentStatus)

  const patch: Record<string, unknown> = {
    // Store the normalized stage when recognised, else the raw upstream label.
    shipment_status: normalized ?? shipmentStatus,
    updated_at: new Date().toISOString(),
  }

  if (body.etd) {
    patch.expected_delivery_date = body.etd.slice(0, 10)
  }

  const newStatus = mapWebhookToOrderStatus(normalized)
  if (newStatus && newStatus !== order.status) {
    patch.status = newStatus
  }

  // A returned shipment (RTO) has no order_status equivalent. Flag it for a
  // refund so an admin can reconcile, without forcing the order off its status.
  if (normalized === 'RETURNED' && !order.refund_status) {
    patch.refund_status = 'requested'
    patch.refund_reason = 'Shipment returned to origin (RTO)'
  }

  await supabase.from('orders').update(patch).eq('id', order.id)

  // Notify on a coarse status change, or specifically when the parcel returns.
  if (newStatus && newStatus !== order.status) {
    notifyCustomerStatusUpdate(order.user_id, order.id, newStatus)
  } else if (normalized === 'RETURNED') {
    notifyCustomerStatusUpdate(order.user_id, order.id, 'returned')
  }

  res.json({ ok: true, shipment_status: patch.shipment_status })
}
