"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkServiceabilityHandler = checkServiceabilityHandler;
exports.createShipmentHandler = createShipmentHandler;
exports.getLabelHandler = getLabelHandler;
exports.getInvoiceHandler = getInvoiceHandler;
exports.getManifestHandler = getManifestHandler;
exports.trackShipmentHandler = trackShipmentHandler;
exports.cancelShipmentHandler = cancelShipmentHandler;
exports.webhookHandler = webhookHandler;
const supabase_1 = require("../supabase");
const notificationService_1 = require("../services/notificationService");
const shiprocketService_1 = require("../services/shiprocketService");
const ORDER_SELECT = `
  *,
  user:profiles!user_id(id, name, phone),
  address:addresses(*),
  order_items(
    id, quantity, unit_price,
    product:products(id, title, type),
    variant:variants(id, color, size, sku)
  )
`;
const WEIGHT_KG = {
    saree: 0.5,
    jewellery: 0.2,
};
function defaultWeightKg(items) {
    let total = 0;
    for (const item of items) {
        const type = item.product?.type ?? 'saree';
        total += (WEIGHT_KG[type] ?? 0.5) * item.quantity;
    }
    return Math.max(0.1, Math.round(total * 100) / 100);
}
async function loadOrderForShipment(orderId, userId) {
    let query = supabase_1.supabase.from('orders').select(ORDER_SELECT).eq('id', orderId);
    if (userId)
        query = query.eq('user_id', userId);
    const { data, error } = await query.single();
    if (error || !data)
        return null;
    return data;
}
async function getCustomerEmail(userId) {
    const { data, error } = await supabase_1.supabase.auth.admin.getUserById(userId);
    if (error || !data.user?.email)
        return 'customer@nanabanana.in';
    return data.user.email;
}
function buildAdhocPayload(order, email, weight) {
    const addr = order.address;
    const user = order.user;
    const nameParts = (user?.name ?? 'Customer').trim().split(/\s+/);
    const firstName = nameParts[0] ?? 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '.';
    const items = (order.order_items ?? []);
    return {
        order_id: order.id.slice(0, 8).toUpperCase(),
        order_date: new Date(order.created_at).toISOString().slice(0, 16).replace('T', ' '),
        pickup_location: (0, shiprocketService_1.getPickupLocation)(),
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
    };
}
async function checkServiceabilityHandler(req, res) {
    const { orderId, weight: weightOverride } = req.body;
    if (!orderId)
        return res.status(400).json({ error: 'orderId is required' });
    const order = await loadOrderForShipment(orderId);
    if (!order)
        return res.status(404).json({ error: 'Order not found' });
    if (!order.address) {
        return res.status(400).json({ error: 'Order has no delivery address' });
    }
    const addr = order.address;
    const items = (order.order_items ?? []);
    const weight = weightOverride ?? defaultWeightKg(items);
    const couriers = await (0, shiprocketService_1.checkServiceability)({
        pickup_postcode: (0, shiprocketService_1.getPickupPincode)(),
        delivery_postcode: addr.pincode,
        weight,
        cod: 0,
        order_id: order.shiprocket_order_id ?? order.id.slice(0, 8),
    });
    res.json({ couriers, weight, delivery_pincode: addr.pincode });
}
async function createShipmentHandler(req, res) {
    const { orderId, courier_id, weight: weightOverride } = req.body;
    if (!orderId || courier_id == null) {
        return res.status(400).json({ error: 'orderId and courier_id are required' });
    }
    const order = await loadOrderForShipment(orderId);
    if (!order)
        return res.status(404).json({ error: 'Order not found' });
    if (order.shiprocket_awb) {
        return res.status(400).json({ error: 'Shipment already created for this order' });
    }
    if (!order.address) {
        return res.status(400).json({ error: 'Order has no delivery address' });
    }
    const allowedStatuses = ['confirmed', 'processing'];
    if (!allowedStatuses.includes(order.status)) {
        return res.status(400).json({
            error: `Cannot ship order with status "${order.status}". Order must be confirmed first.`,
        });
    }
    const items = (order.order_items ?? []);
    const weight = weightOverride ?? defaultWeightKg(items);
    const email = await getCustomerEmail(order.user_id);
    const payload = buildAdhocPayload(order, email, weight);
    const created = await (0, shiprocketService_1.createAdhocOrder)(payload);
    const awbResult = await (0, shiprocketService_1.assignAwb)(created.shipment_id, courier_id);
    const trackingUrl = `https://shiprocket.co/tracking/${awbResult.awb_code}`;
    const { data: updated, error } = await supabase_1.supabase
        .from('orders')
        .update({
        shiprocket_order_id: String(created.order_id),
        shiprocket_shipment_id: String(created.shipment_id),
        shiprocket_awb: awbResult.awb_code,
        shiprocket_courier_id: courier_id,
        shiprocket_courier_name: awbResult.courier_name,
        tracking_url: trackingUrl,
        shipment_status: 'AWB ASSIGNED',
        status: 'processing',
        updated_at: new Date().toISOString(),
    })
        .eq('id', orderId)
        .select(ORDER_SELECT)
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    (0, notificationService_1.notifyCustomerStatusUpdate)(order.user_id, orderId, 'processing');
    res.json({
        order: updated,
        awb: awbResult.awb_code,
        courier_name: awbResult.courier_name,
        tracking_url: trackingUrl,
        shiprocket_order_id: created.order_id,
        shiprocket_shipment_id: created.shipment_id,
    });
}
async function requireShipment(orderId) {
    const order = await loadOrderForShipment(orderId);
    if (!order)
        return { ok: false, error: 'Order not found', status: 404 };
    if (!order.shiprocket_shipment_id) {
        return { ok: false, error: 'No Shiprocket shipment on this order', status: 400 };
    }
    return { ok: true, order };
}
async function getLabelHandler(req, res) {
    const { orderId } = req.params;
    const loaded = await requireShipment(orderId);
    if (!loaded.ok)
        return res.status(loaded.status).json({ error: loaded.error });
    const shipmentId = Number(loaded.order.shiprocket_shipment_id);
    if (!Number.isFinite(shipmentId)) {
        return res.status(400).json({ error: 'Invalid Shiprocket shipment id' });
    }
    const labelUrl = await (0, shiprocketService_1.generateLabel)([shipmentId]);
    await supabase_1.supabase
        .from('orders')
        .update({ label_url: labelUrl, updated_at: new Date().toISOString() })
        .eq('id', orderId);
    res.json({ label_url: labelUrl });
}
async function getInvoiceHandler(req, res) {
    const { orderId } = req.params;
    const loaded = await requireShipment(orderId);
    if (!loaded.ok)
        return res.status(loaded.status).json({ error: loaded.error });
    const srOrderId = Number(loaded.order.shiprocket_order_id);
    if (!Number.isFinite(srOrderId)) {
        return res.status(400).json({ error: 'Invalid Shiprocket order id' });
    }
    const invoiceUrl = await (0, shiprocketService_1.generateInvoice)([srOrderId]);
    await supabase_1.supabase
        .from('orders')
        .update({ invoice_url: invoiceUrl, updated_at: new Date().toISOString() })
        .eq('id', orderId);
    res.json({ invoice_url: invoiceUrl });
}
async function getManifestHandler(req, res) {
    const { orderId } = req.params;
    const loaded = await requireShipment(orderId);
    if (!loaded.ok)
        return res.status(loaded.status).json({ error: loaded.error });
    const shipmentId = Number(loaded.order.shiprocket_shipment_id);
    if (!Number.isFinite(shipmentId)) {
        return res.status(400).json({ error: 'Invalid Shiprocket shipment id' });
    }
    const manifestUrl = await (0, shiprocketService_1.generateManifest)([shipmentId]);
    await supabase_1.supabase
        .from('orders')
        .update({ manifest_url: manifestUrl, updated_at: new Date().toISOString() })
        .eq('id', orderId);
    res.json({ manifest_url: manifestUrl });
}
async function trackShipmentHandler(req, res) {
    const { orderId } = req.params;
    const userId = req.user.role === 'customer' ? req.user.id : undefined;
    const order = await loadOrderForShipment(orderId, userId);
    if (!order)
        return res.status(404).json({ error: 'Order not found' });
    if (!order.shiprocket_awb) {
        return res.status(400).json({ error: 'No AWB assigned yet' });
    }
    const tracking = await (0, shiprocketService_1.trackByAwb)(order.shiprocket_awb);
    res.json({ tracking, awb: order.shiprocket_awb, tracking_url: order.tracking_url });
}
async function cancelShipmentHandler(req, res) {
    const { orderId } = req.params;
    const loaded = await requireShipment(orderId);
    if (!loaded.ok)
        return res.status(loaded.status).json({ error: loaded.error });
    if (['shipped', 'delivered'].includes(loaded.order.status)) {
        return res.status(400).json({ error: 'Cannot cancel shipment after it has been shipped' });
    }
    const awb = loaded.order.shiprocket_awb;
    if (!awb) {
        return res.status(400).json({ error: 'No AWB on this order' });
    }
    await (0, shiprocketService_1.cancelByAwbs)([awb]);
    const { data, error } = await supabase_1.supabase
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
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.json({ order: data, message: 'Shipment cancelled on Shiprocket' });
}
function mapWebhookToOrderStatus(currentStatus) {
    const s = currentStatus.toUpperCase();
    if (s.includes('DELIVERED'))
        return 'delivered';
    if (s.includes('PICKED') ||
        s.includes('TRANSIT') ||
        s.includes('OUT FOR DELIVERY') ||
        s.includes('SHIPPED')) {
        return 'shipped';
    }
    return null;
}
async function webhookHandler(req, res) {
    const token = req.headers['x-api-key'];
    const expected = process.env.SHIPROCKET_WEBHOOK_TOKEN;
    if (!expected || token !== expected) {
        return res.status(401).json({ error: 'Invalid webhook token' });
    }
    const body = req.body;
    const awb = body.awb;
    const shipmentStatus = body.current_status ?? body.shipment_status ?? '';
    if (!awb) {
        return res.status(200).json({ ok: true, skipped: 'no awb' });
    }
    const { data: order } = await supabase_1.supabase
        .from('orders')
        .select('id, user_id, status')
        .eq('shiprocket_awb', awb)
        .maybeSingle();
    if (!order) {
        return res.status(200).json({ ok: true, skipped: 'order not found' });
    }
    const patch = {
        shipment_status: shipmentStatus,
        updated_at: new Date().toISOString(),
    };
    if (body.etd) {
        patch.expected_delivery_date = body.etd.slice(0, 10);
    }
    const newStatus = mapWebhookToOrderStatus(shipmentStatus);
    if (newStatus && newStatus !== order.status) {
        patch.status = newStatus;
    }
    await supabase_1.supabase.from('orders').update(patch).eq('id', order.id);
    if (newStatus && newStatus !== order.status) {
        (0, notificationService_1.notifyCustomerStatusUpdate)(order.user_id, order.id, newStatus);
    }
    res.json({ ok: true });
}
//# sourceMappingURL=shipmentController.js.map