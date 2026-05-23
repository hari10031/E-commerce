"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRazorpayOrder = createRazorpayOrder;
exports.placeOrder = placeOrder;
exports.verifyPayment = verifyPayment;
exports.getOrders = getOrders;
exports.getOrderById = getOrderById;
exports.updateOrderStatus = updateOrderStatus;
exports.requestRefund = requestRefund;
exports.cancelOrder = cancelOrder;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const supabase_1 = require("../supabase");
const notificationService_1 = require("../services/notificationService");
const types_1 = require("../types");
const razorpay = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});
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
`;
// Builds the internal order from the user's cart + address, then creates the
// matching Razorpay order. The amount is computed server-side — never trusted
// from the client. verifyPayment later flips this order to 'confirmed'.
async function createRazorpayOrder(req, res) {
    const { address, coupon } = req.body;
    const userId = req.user.id;
    const { data: cart } = await supabase_1.supabase
        .from('cart_items')
        .select('product_id, variant_id, quantity, product:products(base_price, discount_pct, category_id, category:categories(parent_id)), variant:variants(quantity)')
        .eq('user_id', userId);
    if (!cart || cart.length === 0) {
        return res.status(400).json({ error: 'Your cart is empty' });
    }
    let subtotal = 0;
    const items = [];
    for (const c of cart) {
        const product = c.product;
        const variant = c.variant;
        if (!product || !variant) {
            return res.status(400).json({ error: 'An item in your cart is no longer available' });
        }
        if (variant.quantity < c.quantity) {
            return res.status(400).json({ error: 'Insufficient stock for an item in your cart' });
        }
        const unitPrice = Math.round(product.base_price * (1 - (product.discount_pct ?? 0) / 100));
        subtotal += unitPrice * c.quantity;
        items.push({ product_id: c.product_id, variant_id: c.variant_id, quantity: c.quantity, unit_price: unitPrice });
    }
    // Optional coupon
    let discount = 0;
    let couponCode = null;
    if (coupon) {
        const { data: cp } = await supabase_1.supabase
            .from('coupons')
            .select('code, discount_pct, max_uses, used_count, starts_at, expires_at, active, category_id, product_id')
            .eq('code', coupon)
            .maybeSingle();
        const now = new Date();
        const timeValid = cp &&
            cp.active &&
            (!cp.starts_at || new Date(cp.starts_at) <= now) &&
            (!cp.expires_at || new Date(cp.expires_at) > now) &&
            (cp.max_uses == null || cp.used_count < cp.max_uses);
        // Scope gate: a coupon limited to a category/product only applies when the
        // cart holds at least one matching item.
        let scopeMatch = true;
        if (timeValid && (cp.category_id || cp.product_id)) {
            scopeMatch = cart.some((c) => {
                if (cp.product_id && c.product_id === cp.product_id)
                    return true;
                if (cp.category_id) {
                    const p = c.product;
                    return p?.category_id === cp.category_id || p?.category?.parent_id === cp.category_id;
                }
                return false;
            });
        }
        if (timeValid && scopeMatch) {
            discount = Math.round((subtotal * cp.discount_pct) / 100);
            couponCode = cp.code;
        }
    }
    const shipping = subtotal >= 999 ? 0 : 99;
    const total = subtotal + shipping - discount;
    if (total <= 0)
        return res.status(400).json({ error: 'Invalid order total' });
    // Persist the delivery address
    let addressId = null;
    if (address?.line1) {
        const { data: addr } = await supabase_1.supabase
            .from('addresses')
            .insert({
            user_id: userId,
            line1: address.line1,
            line2: address.line2 ?? null,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            country: address.country ?? 'India',
        })
            .select('id')
            .single();
        addressId = addr?.id ?? null;
    }
    // Internal order — awaiting payment
    const { data: order, error: orderErr } = await supabase_1.supabase
        .from('orders')
        .insert({
        user_id: userId,
        address_id: addressId,
        status: 'placed',
        total_amount: total,
        discount_amount: discount,
        coupon_applied: couponCode,
    })
        .select('id')
        .single();
    if (orderErr)
        return res.status(400).json({ error: orderErr.message });
    await supabase_1.supabase.from('order_items').insert(items.map((i) => ({ order_id: order.id, ...i })));
    if (couponCode) {
        await supabase_1.supabase.rpc('increment_coupon_usage', { code: couponCode });
    }
    const rzpOrder = await razorpay.orders.create({
        amount: Math.round(total * 100),
        currency: 'INR',
        receipt: order.id,
    });
    res.json({
        razorpay_order_id: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        order_id: order.id,
    });
}
async function placeOrder(req, res) {
    const { address_id, items, coupon_code, total_amount, discount_amount = 0 } = req.body;
    if (!items?.length)
        return res.status(400).json({ error: 'Order must have at least one item' });
    // Validate stock for all items in a single query
    const variantIds = items.map((i) => i.variant_id);
    const { data: variants } = await supabase_1.supabase
        .from('variants')
        .select('id, quantity')
        .in('id', variantIds);
    for (const item of items) {
        const v = variants?.find((x) => x.id === item.variant_id);
        if (!v || v.quantity < item.quantity) {
            return res.status(400).json({ error: `Insufficient stock for variant ${item.variant_id}` });
        }
    }
    // Create order
    const { data: order, error: orderErr } = await supabase_1.supabase
        .from('orders')
        .insert({
        user_id: req.user.id,
        address_id,
        status: 'placed',
        total_amount,
        discount_amount,
        coupon_applied: coupon_code || null,
    })
        .select()
        .single();
    if (orderErr)
        return res.status(400).json({ error: orderErr.message });
    // Insert order items
    const orderItems = items.map((i) => ({
        order_id: order.id,
        product_id: i.product_id,
        variant_id: i.variant_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
    }));
    await supabase_1.supabase.from('order_items').insert(orderItems);
    // Coupon usage
    if (coupon_code) {
        await supabase_1.supabase.rpc('increment_coupon_usage', { code: coupon_code });
    }
    res.status(201).json(order);
}
async function verifyPayment(req, res) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;
    const expected = crypto_1.default
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
    if (expected !== razorpay_signature) {
        return res.status(400).json({ error: 'Payment signature mismatch' });
    }
    const { data: order, error } = await supabase_1.supabase
        .from('orders')
        .update({
        status: 'confirmed',
        razorpay_order_id,
        razorpay_payment_id,
        updated_at: new Date().toISOString(),
    })
        .eq('id', order_id)
        .eq('user_id', req.user.id)
        .select('*, order_items(id, variant_id, quantity)')
        .single();
    if (error)
        return res.status(400).json({ error: error.message });
    // Decrement stock atomically via RPC
    for (const item of order.order_items) {
        await supabase_1.supabase.rpc('decrement_variant_stock', {
            variant_id: item.variant_id,
            qty: item.quantity,
        });
    }
    // Clear customer cart after successful payment
    await supabase_1.supabase.from('cart_items').delete().eq('user_id', req.user.id);
    // Non-blocking notifications
    (0, notificationService_1.notifyAdminOrderPlaced)(order);
    res.json({ success: true, order });
}
async function getOrders(req, res) {
    const { status, userId, page = '1', limit = '20' } = req.query;
    let query = supabase_1.supabase
        .from('orders')
        .select(orderSelect, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((+page - 1) * +limit, +page * +limit - 1);
    // Customers see only their orders; staff may scope to one customer via userId.
    if (req.user.role === 'customer') {
        query = query.eq('user_id', req.user.id);
    }
    else if (userId) {
        query = query.eq('user_id', userId);
    }
    if (status)
        query = query.eq('status', status);
    const { data, error, count } = await query;
    if (error)
        return res.status(500).json({ error: error.message });
    res.json({
        data,
        count,
        total: count,
        page: +page,
        limit: +limit,
        totalPages: Math.ceil((count ?? 0) / +limit),
    });
}
async function getOrderById(req, res) {
    let query = supabase_1.supabase
        .from('orders')
        .select(orderSelect)
        .eq('id', req.params.id);
    if (req.user.role === 'customer') {
        query = query.eq('user_id', req.user.id);
    }
    const { data, error } = await query.single();
    if (error)
        return res.status(404).json({ error: 'Order not found' });
    res.json(data);
}
async function updateOrderStatus(req, res) {
    if (!['admin', 'employee'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    const { status } = req.body;
    const { id } = req.params;
    const { data: current } = await supabase_1.supabase
        .from('orders')
        .select('status, user_id, razorpay_payment_id, total_amount')
        .eq('id', id)
        .single();
    if (!current)
        return res.status(404).json({ error: 'Order not found' });
    if (!types_1.VALID_ORDER_TRANSITIONS[current.status]?.includes(status)) {
        return res.status(400).json({
            error: `Cannot transition from ${current.status} to ${status}`,
            allowed: types_1.VALID_ORDER_TRANSITIONS[current.status],
        });
    }
    // Issue the money back through Razorpay before marking the order refunded.
    if (status === 'refunded' && current.razorpay_payment_id) {
        try {
            await razorpay.payments.refund(current.razorpay_payment_id, {
                amount: Math.round(Number(current.total_amount) * 100),
            });
        }
        catch (err) {
            return res.status(502).json({
                error: err instanceof Error ? err.message : 'Razorpay refund failed',
            });
        }
    }
    const refundPatch = status === 'refunded' ? { refund_status: 'completed' } : {};
    const { data, error } = await supabase_1.supabase
        .from('orders')
        .update({ status, ...refundPatch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error)
        return res.status(400).json({ error: error.message });
    (0, notificationService_1.notifyCustomerStatusUpdate)(current.user_id, id, status);
    res.json(data);
}
// Customer asks for a refund on a paid order. Records the request; an admin
// then transitions the order to 'refunded', which issues the Razorpay refund.
async function requestRefund(req, res) {
    const reason = (req.body?.reason ?? '').toString().trim();
    if (!reason) {
        return res.status(400).json({ error: 'Please add a reason for the refund request' });
    }
    let query = supabase_1.supabase
        .from('orders')
        .select('status, refund_status, user_id')
        .eq('id', req.params.id);
    if (req.user.role === 'customer')
        query = query.eq('user_id', req.user.id);
    const { data: current } = await query.single();
    if (!current)
        return res.status(404).json({ error: 'Order not found' });
    const refundable = ['confirmed', 'processing', 'shipped', 'delivered'];
    if (!refundable.includes(current.status)) {
        return res.status(400).json({ error: `A ${current.status} order cannot be refunded` });
    }
    if (current.refund_status === 'requested' || current.refund_status === 'completed') {
        return res.status(400).json({ error: 'A refund has already been requested for this order' });
    }
    const { data, error } = await supabase_1.supabase
        .from('orders')
        .update({
        refund_status: 'requested',
        refund_reason: reason,
        updated_at: new Date().toISOString(),
    })
        .eq('id', req.params.id)
        .select(orderSelect)
        .single();
    if (error)
        return res.status(400).json({ error: error.message });
    res.json(data);
}
async function cancelOrder(req, res) {
    let query = supabase_1.supabase
        .from('orders')
        .select('status, user_id')
        .eq('id', req.params.id);
    if (req.user.role === 'customer')
        query = query.eq('user_id', req.user.id);
    const { data: current } = await query.single();
    if (!current)
        return res.status(404).json({ error: 'Order not found' });
    if (!types_1.VALID_ORDER_TRANSITIONS[current.status]?.includes('cancelled')) {
        return res.status(400).json({ error: `Cannot cancel an order with status ${current.status}` });
    }
    const { data, error } = await supabase_1.supabase
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .select()
        .single();
    if (error)
        return res.status(400).json({ error: error.message });
    (0, notificationService_1.notifyCustomerStatusUpdate)(current.user_id, req.params.id, 'cancelled');
    res.json(data);
}
//# sourceMappingURL=orderController.js.map