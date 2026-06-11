"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkServiceabilityHandler = checkServiceabilityHandler;
exports.autoCreateShipment = autoCreateShipment;
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
const logger_1 = require("../logger");
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
        return 'customer@yuvaranisilks.in';
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
        order_id: order.id.replace(/-/g, '').slice(0, 20).toUpperCase(),
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
        // Only pass Shiprocket's own numeric order id — our internal UUID makes
        // the serviceability API return an empty courier list.
        order_id: order.shiprocket_order_id ?? undefined,
    });
    res.json({ couriers, weight, delivery_pincode: addr.pincode });
}
/**
 * Core shipment-creation routine shared by the manual admin endpoint and the
 * automatic post-payment flow. Validates the order, resolves a courier
 * (auto-selecting the best one per SHIPROCKET_COURIER_STRATEGY when `courierId`
 * is omitted), creates the Shiprocket order, assigns an AWB, and persists the
 * result. Throws on any failure — callers decide how to surface it.
 */
async function createShipmentForOrder(order, opts = {}) {
    if (!order.address) {
        throw new Error('Order has no delivery address');
    }
    if (!['confirmed', 'processing'].includes(order.status)) {
        throw new Error(`Cannot ship order with status "${order.status}". Order must be confirmed first.`);
    }
    // Atomic claim — only one worker/request can create a shipment for this order.
    const { data: claimed, error: claimErr } = await supabase_1.supabase
        .from('orders')
        .update({ shipment_status: 'CREATING', updated_at: new Date().toISOString() })
        .eq('id', order.id)
        .is('shiprocket_awb', null)
        .neq('shipment_status', 'CREATING')
        .select(ORDER_SELECT)
        .maybeSingle();
    if (claimErr)
        throw new Error(claimErr.message);
    if (!claimed) {
        if (order.shiprocket_awb)
            throw new Error('Shipment already created for this order');
        throw new Error('Shipment creation already in progress for this order');
    }
    order = claimed;
    const orderId = order.id;
    try {
        const items = (order.order_items ?? []);
        const weight = opts.weight ?? defaultWeightKg(items);
        let courierId = opts.courierId;
        if (courierId == null) {
            const addr = order.address;
            const couriers = await (0, shiprocketService_1.checkServiceability)({
                pickup_postcode: (0, shiprocketService_1.getPickupPincode)(),
                delivery_postcode: addr.pincode,
                weight,
                cod: 0,
            });
            const best = (0, shiprocketService_1.selectBestCourier)(couriers);
            if (!best) {
                throw new Error(`No courier available for pincode ${addr.pincode}`);
            }
            courierId = best.courier_company_id;
        }
        const email = await getCustomerEmail(order.user_id);
        const payload = buildAdhocPayload(order, email, weight);
        const created = await (0, shiprocketService_1.createAdhocOrder)(payload);
        const awbResult = await (0, shiprocketService_1.assignAwb)(created.shipment_id, courierId);
        const trackingUrl = `https://shiprocket.co/tracking/${awbResult.awb_code}`;
        const { data: updated, error } = await supabase_1.supabase
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
            .eq('id', orderId)
            .select(ORDER_SELECT)
            .single();
        if (error || !updated) {
            throw new Error(error?.message ?? 'Failed to persist shipment');
        }
        (0, notificationService_1.notifyCustomerStatusUpdate)(order.user_id, orderId, 'processing');
        return {
            order: updated,
            awb: awbResult.awb_code,
            courier_id: awbResult.courier_company_id ?? courierId,
            courier_name: awbResult.courier_name,
            tracking_url: trackingUrl,
            shiprocket_order_id: created.order_id,
            shiprocket_shipment_id: created.shipment_id,
        };
    }
    catch (err) {
        await supabase_1.supabase
            .from('orders')
            .update({ shipment_status: null, updated_at: new Date().toISOString() })
            .eq('id', orderId)
            .is('shiprocket_awb', null)
            .eq('shipment_status', 'CREATING');
        throw err;
    }
}
/**
 * Fire-and-forget shipment creation triggered after successful payment.
 * Gated by SHIPROCKET_AUTO_CREATE (default on). Always resolves — failures are
 * logged so an admin can still create the shipment manually from the dashboard.
 */
async function autoCreateShipment(orderId) {
    if (process.env.SHIPROCKET_AUTO_CREATE === 'false')
        return;
    try {
        const order = await loadOrderForShipment(orderId);
        if (!order) {
            logger_1.logger.warn({ orderId }, 'autoCreateShipment: order not found');
            return;
        }
        if (order.shiprocket_awb)
            return; // already shipped
        const result = await createShipmentForOrder(order);
        logger_1.logger.info({ orderId, awb: result.awb, courier: result.courier_name }, 'Shiprocket shipment auto-created');
    }
    catch (err) {
        logger_1.logger.error({ orderId, err }, 'autoCreateShipment failed — admin must create manually');
    }
}
async function createShipmentHandler(req, res) {
    const { orderId, courier_id, weight: weightOverride } = req.body;
    if (!orderId) {
        return res.status(400).json({ error: 'orderId is required' });
    }
    const order = await loadOrderForShipment(orderId);
    if (!order)
        return res.status(404).json({ error: 'Order not found' });
    try {
        const result = await createShipmentForOrder(order, {
            courierId: courier_id ?? undefined,
            weight: weightOverride,
        });
        res.json({
            order: result.order,
            awb: result.awb,
            courier_id: result.courier_id,
            courier_name: result.courier_name,
            tracking_url: result.tracking_url,
            shiprocket_order_id: result.shiprocket_order_id,
            shiprocket_shipment_id: result.shiprocket_shipment_id,
        });
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create shipment';
        // Validation-style messages → 400; upstream/persist failures → 502.
        const isValidation = msg.includes('already created') ||
            msg.includes('no delivery address') ||
            msg.includes('must be confirmed') ||
            msg.includes('No courier available');
        res.status(isValidation ? 400 : 502).json({ error: msg });
    }
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
function normalizeShipmentStatus(raw) {
    const s = raw.toUpperCase();
    if (s.includes('DELIVERED'))
        return 'DELIVERED';
    if (s.includes('OUT FOR DELIVERY'))
        return 'OUT FOR DELIVERY';
    if (s.includes('RTO') || s.includes('RETURN'))
        return 'RETURNED';
    if (s.includes('CANCEL'))
        return 'CANCELLED';
    if (s.includes('TRANSIT') || s.includes('SHIPPED'))
        return 'IN TRANSIT';
    if (s.includes('PICKED') || s.includes('PICK'))
        return 'PICKED UP';
    return null;
}
// Maps the granular shipment status onto the coarse order_status enum.
// 'RETURNED' has no enum equivalent — handled separately in the webhook.
function mapWebhookToOrderStatus(normalized) {
    switch (normalized) {
        case 'DELIVERED':
            return 'delivered';
        case 'PICKED UP':
        case 'IN TRANSIT':
        case 'OUT FOR DELIVERY':
            return 'shipped';
        case 'CANCELLED':
            return 'cancelled';
        default:
            return null;
    }
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
        .select('id, user_id, status, refund_status')
        .eq('shiprocket_awb', awb)
        .maybeSingle();
    if (!order) {
        return res.status(200).json({ ok: true, skipped: 'order not found' });
    }
    const normalized = normalizeShipmentStatus(shipmentStatus);
    const patch = {
        // Store the normalized stage when recognised, else the raw upstream label.
        shipment_status: normalized ?? shipmentStatus,
        updated_at: new Date().toISOString(),
    };
    if (body.etd) {
        patch.expected_delivery_date = body.etd.slice(0, 10);
    }
    const newStatus = mapWebhookToOrderStatus(normalized);
    if (newStatus && newStatus !== order.status) {
        patch.status = newStatus;
    }
    // A returned shipment (RTO) has no order_status equivalent. Flag it for a
    // refund so an admin can reconcile, without forcing the order off its status.
    if (normalized === 'RETURNED' && !order.refund_status) {
        patch.refund_status = 'requested';
        patch.refund_reason = 'Shipment returned to origin (RTO)';
    }
    await supabase_1.supabase.from('orders').update(patch).eq('id', order.id);
    // Notify on a coarse status change, or specifically when the parcel returns.
    if (newStatus && newStatus !== order.status) {
        (0, notificationService_1.notifyCustomerStatusUpdate)(order.user_id, order.id, newStatus);
    }
    else if (normalized === 'RETURNED') {
        (0, notificationService_1.notifyCustomerStatusUpdate)(order.user_id, order.id, 'returned');
    }
    res.json({ ok: true, shipment_status: patch.shipment_status });
}
//# sourceMappingURL=shipmentController.js.map