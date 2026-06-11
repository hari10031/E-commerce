"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkServiceability = checkServiceability;
exports.createAdhocOrder = createAdhocOrder;
exports.assignAwb = assignAwb;
exports.generateLabel = generateLabel;
exports.generateInvoice = generateInvoice;
exports.generateManifest = generateManifest;
exports.trackByAwb = trackByAwb;
exports.cancelByAwbs = cancelByAwbs;
exports.getCourierStrategy = getCourierStrategy;
exports.selectBestCourier = selectBestCourier;
exports.getPickupLocation = getPickupLocation;
exports.getPickupPincode = getPickupPincode;
const logger_1 = require("../logger");
const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';
let tokenCache = null;
function getCredentials() {
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;
    if (!email || !password) {
        throw new Error('SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD must be set in backend/.env');
    }
    return { email, password };
}
async function login(force = false) {
    if (!force && tokenCache && Date.now() < tokenCache.expiresAt) {
        return tokenCache.token;
    }
    const { email, password } = getCredentials();
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    const data = (await res.json());
    if (!res.ok || !data.token) {
        throw new Error(data.message ?? `Shiprocket login failed (${res.status})`);
    }
    // Token valid ~10 days; refresh a day early
    tokenCache = {
        token: data.token,
        expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000,
    };
    return data.token;
}
function getRetryMax() {
    const n = Number(process.env.SHIPROCKET_RETRY_MAX);
    return Number.isFinite(n) && n >= 0 ? n : 3;
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// A status worth retrying: 429 (throttled) or any 5xx (transient upstream).
function isRetryableStatus(status) {
    return status === 429 || status >= 500;
}
async function srFetch(path, options = {}, retriedAuth = false) {
    const token = await login();
    const maxRetries = getRetryMax();
    let lastErr;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        let res;
        try {
            res = await fetch(`${BASE_URL}${path}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    ...options.headers,
                },
            });
        }
        catch (err) {
            // Network/DNS/timeout — retry with backoff, then give up.
            lastErr = err;
            logger_1.logger.warn({ path, attempt, err }, 'Shiprocket request network error, retrying');
            if (attempt < maxRetries) {
                await sleep(2 ** attempt * 500);
                continue;
            }
            throw err instanceof Error ? err : new Error('Shiprocket network error');
        }
        // Expired token — refresh once and restart the retry loop fresh.
        if (res.status === 401 && !retriedAuth) {
            tokenCache = null;
            await login(true);
            return srFetch(path, options, true);
        }
        const data = await res.json().catch(() => ({}));
        if (res.ok)
            return data;
        const msg = data.message ??
            data.error ??
            `Shiprocket API error (${res.status})`;
        if (isRetryableStatus(res.status) && attempt < maxRetries) {
            logger_1.logger.warn({ path, status: res.status, attempt }, 'Shiprocket request transient error, retrying');
            await sleep(2 ** attempt * 500);
            lastErr = new Error(msg);
            continue;
        }
        logger_1.logger.error({ path, status: res.status, data }, 'Shiprocket request failed');
        throw new Error(msg);
    }
    throw lastErr instanceof Error ? lastErr : new Error('Shiprocket request failed after retries');
}
async function checkServiceability(params) {
    const qs = new URLSearchParams({
        pickup_postcode: params.pickup_postcode,
        delivery_postcode: params.delivery_postcode,
        weight: String(params.weight),
        cod: String(params.cod ?? 0),
    });
    if (params.order_id)
        qs.set('order_id', params.order_id);
    const data = await srFetch(`/courier/serviceability/?${qs.toString()}`, { method: 'GET' });
    return data.data?.available_courier_companies ?? [];
}
async function createAdhocOrder(payload) {
    const data = await srFetch('/orders/create/adhoc', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    if (!data.order_id || !data.shipment_id) {
        throw new Error(data.message ?? 'Shiprocket did not return order_id/shipment_id');
    }
    return { order_id: data.order_id, shipment_id: data.shipment_id };
}
async function assignAwb(shipment_id, courier_id) {
    const data = await srFetch('/courier/assign/awb', {
        method: 'POST',
        body: JSON.stringify({ shipment_id, courier_id }),
    });
    const inner = data.response?.data;
    const awb_code = inner?.awb_code ?? data.awb_code;
    const courier_name = inner?.courier_name ?? data.courier_name;
    if (!awb_code) {
        logger_1.logger.error({ shipment_id, courier_id, data }, 'Shiprocket AWB assignment failed');
        const reason = inner?.awb_assign_error ?? data.message;
        throw new Error(reason ? `Shiprocket did not return AWB code: ${reason}` : 'Shiprocket did not return AWB code');
    }
    return {
        awb_code,
        courier_name: courier_name ?? 'Courier',
        courier_company_id: inner?.courier_company_id ?? courier_id,
    };
}
async function generateLabel(shipment_ids) {
    const data = await srFetch('/courier/generate/label', {
        method: 'POST',
        body: JSON.stringify({ shipment_id: shipment_ids }),
    });
    const url = data.label_url ?? data.response?.label_url;
    if (!url)
        throw new Error('Shiprocket did not return label URL');
    return url;
}
async function generateInvoice(order_ids) {
    const data = await srFetch('/orders/print/invoice', {
        method: 'POST',
        body: JSON.stringify({ ids: order_ids }),
    });
    const url = data.invoice_url ?? data.response?.invoice_url;
    if (!url)
        throw new Error('Shiprocket did not return invoice URL');
    return url;
}
async function generateManifest(shipment_ids) {
    const data = await srFetch('/manifests/generate', {
        method: 'POST',
        body: JSON.stringify({ shipment_id: shipment_ids }),
    });
    const url = data.manifest_url ?? data.response?.manifest_url;
    if (!url)
        throw new Error('Shiprocket did not return manifest URL');
    return url;
}
async function trackByAwb(awb) {
    return srFetch(`/courier/track/awb/${encodeURIComponent(awb)}`, {
        method: 'GET',
    });
}
async function cancelByAwbs(awbs) {
    await srFetch('/orders/cancel/shipment/awbs', {
        method: 'POST',
        body: JSON.stringify({ awbs }),
    });
}
function getCourierStrategy() {
    const s = (process.env.SHIPROCKET_COURIER_STRATEGY ?? 'cheapest').toLowerCase();
    if (s === 'fastest' || s === 'rating')
        return s;
    return 'cheapest';
}
// Picks the best courier from a serviceability response per the configured
// strategy. Returns null when no courier is available for the route.
function selectBestCourier(couriers, strategy = getCourierStrategy()) {
    if (couriers.length === 0)
        return null;
    const sorted = [...couriers];
    if (strategy === 'fastest') {
        sorted.sort((a, b) => {
            const da = Number(a.estimated_delivery_days) || Number.MAX_SAFE_INTEGER;
            const db = Number(b.estimated_delivery_days) || Number.MAX_SAFE_INTEGER;
            return da - db || a.rate - b.rate;
        });
    }
    else if (strategy === 'rating') {
        sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.rate - b.rate);
    }
    else {
        sorted.sort((a, b) => a.rate - b.rate);
    }
    return sorted[0];
}
function getPickupLocation() {
    return process.env.SHIPROCKET_PICKUP_LOCATION ?? 'Primary';
}
function getPickupPincode() {
    const pin = process.env.SHIPROCKET_PICKUP_PINCODE;
    if (!pin)
        throw new Error('SHIPROCKET_PICKUP_PINCODE must be set in backend/.env');
    return pin;
}
//# sourceMappingURL=shiprocketService.js.map