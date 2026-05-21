import Razorpay from 'razorpay'
import crypto from 'crypto'
import { Response } from 'express'
import { supabase } from '../supabase'
import {
  notifyAdminOrderPlaced,
  notifyCustomerStatusUpdate,
} from '../services/notificationService'
import { AuthRequest } from '../middleware/auth'
import { VALID_ORDER_TRANSITIONS, OrderStatus } from '../types'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

const orderSelect = `
  *,
  user:profiles!user_id(id, name, phone),
  address:addresses(*),
  order_items(
    id, quantity, unit_price,
    product:products(id, title, type,
      images:product_images(url, is_primary)),
    variant:variants(id, color, size, sku)
  )
`

export async function createRazorpayOrder(req: AuthRequest, res: Response) {
  const { amount, receipt } = req.body
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' })

  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency: 'INR',
    receipt,
  })
  res.json(order)
}

export async function placeOrder(req: AuthRequest, res: Response) {
  const { address_id, items, coupon_code, total_amount, discount_amount = 0 } = req.body

  if (!items?.length) return res.status(400).json({ error: 'Order must have at least one item' })

  // Validate stock for all items in a single query
  const variantIds: string[] = items.map((i: { variant_id: string }) => i.variant_id)
  const { data: variants } = await supabase
    .from('variants')
    .select('id, quantity')
    .in('id', variantIds)

  for (const item of items as { variant_id: string; quantity: number }[]) {
    const v = variants?.find((x) => x.id === item.variant_id)
    if (!v || v.quantity < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for variant ${item.variant_id}` })
    }
  }

  // Create order
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      user_id: req.user!.id,
      address_id,
      status: 'placed',
      total_amount,
      discount_amount,
      coupon_applied: coupon_code || null,
    })
    .select()
    .single()

  if (orderErr) return res.status(400).json({ error: orderErr.message })

  // Insert order items
  const orderItems = (items as { product_id: string; variant_id: string; quantity: number; unit_price: number }[]).map((i) => ({
    order_id: order.id,
    product_id: i.product_id,
    variant_id: i.variant_id,
    quantity: i.quantity,
    unit_price: i.unit_price,
  }))

  await supabase.from('order_items').insert(orderItems)

  // Coupon usage
  if (coupon_code) {
    await supabase.rpc('increment_coupon_usage', { code: coupon_code })
  }

  res.status(201).json(order)
}

export async function verifyPayment(req: AuthRequest, res: Response) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  if (expected !== razorpay_signature) {
    return res.status(400).json({ error: 'Payment signature mismatch' })
  }

  const { data: order, error } = await supabase
    .from('orders')
    .update({
      status: 'confirmed',
      razorpay_order_id,
      razorpay_payment_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select('*, order_items(id, variant_id, quantity)')
    .single()

  if (error) return res.status(400).json({ error: error.message })

  // Decrement stock atomically via RPC
  for (const item of order.order_items as { variant_id: string; quantity: number }[]) {
    await supabase.rpc('decrement_variant_stock', {
      variant_id: item.variant_id,
      qty: item.quantity,
    })
  }

  // Clear customer cart after successful payment
  await supabase.from('cart_items').delete().eq('user_id', req.user!.id)
  // Non-blocking notifications
  notifyAdminOrderPlaced(order)

  res.json({ success: true, order })
}

export async function getOrders(req: AuthRequest, res: Response) {
  const { status, userId, page = '1', limit = '20' } = req.query

  let query = supabase
    .from('orders')
    .select(orderSelect, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((+page - 1) * +limit, +page * +limit - 1)

  // Customers see only their orders; staff may scope to one customer via userId.
  if (req.user!.role === 'customer') {
    query = query.eq('user_id', req.user!.id)
  } else if (userId) {
    query = query.eq('user_id', userId as string)
  }

  if (status) query = query.eq('status', status as string)

  const { data, error, count } = await query
  if (error) return res.status(500).json({ error: error.message })

  res.json({ data, count, page: +page, limit: +limit })
}

export async function getOrderById(req: AuthRequest, res: Response) {
  let query = supabase
    .from('orders')
    .select(orderSelect)
    .eq('id', req.params.id)

  if (req.user!.role === 'customer') {
    query = query.eq('user_id', req.user!.id)
  }

  const { data, error } = await query.single()
  if (error) return res.status(404).json({ error: 'Order not found' })
  res.json(data)
}

export async function updateOrderStatus(req: AuthRequest, res: Response) {
  if (!['admin', 'employee'].includes(req.user!.role)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { status } = req.body
  const { id } = req.params

  const { data: current } = await supabase
    .from('orders')
    .select('status, user_id')
    .eq('id', id)
    .single()

  if (!current) return res.status(404).json({ error: 'Order not found' })

  if (!VALID_ORDER_TRANSITIONS[current.status as OrderStatus]?.includes(status)) {
    return res.status(400).json({
      error: `Cannot transition from ${current.status} to ${status}`,
      allowed: VALID_ORDER_TRANSITIONS[current.status as OrderStatus],
    })
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })

  notifyCustomerStatusUpdate(current.user_id, id, status)

  res.json(data)
}

export async function cancelOrder(req: AuthRequest, res: Response) {
  let query = supabase
    .from('orders')
    .select('status, user_id')
    .eq('id', req.params.id)

  if (req.user!.role === 'customer') query = query.eq('user_id', req.user!.id)

  const { data: current } = await query.single()
  if (!current) return res.status(404).json({ error: 'Order not found' })

  if (!VALID_ORDER_TRANSITIONS[current.status as OrderStatus]?.includes('cancelled')) {
    return res.status(400).json({ error: `Cannot cancel an order with status ${current.status}` })
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })

  notifyCustomerStatusUpdate(current.user_id, req.params.id, 'cancelled')
  res.json(data)
}
