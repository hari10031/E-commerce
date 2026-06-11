"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const supabase_1 = require("../supabase");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/product/:productId', async (req, res) => {
    const { data, error } = await supabase_1.supabase
        .from('variants')
        .select('*')
        .eq('product_id', req.params.productId)
        .order('created_at');
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
router.post('/', auth_1.authenticate, auth_1.requireApprovedEmployee, [
    (0, express_validator_1.body)('product_id').isUUID(),
    (0, express_validator_1.body)('quantity').isInt({ min: 0 }),
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const { product_id, color, size, quantity, sku, image_url } = req.body;
    const { data, error } = await supabase_1.supabase
        .from('variants')
        .insert({ product_id, color, size, quantity, sku, image_url })
        .select()
        .single();
    if (error)
        return res.status(400).json({ error: error.message });
    res.status(201).json(data);
});
router.put('/product/:productId/bulk', auth_1.authenticate, auth_1.requireApprovedEmployee, async (req, res) => {
    const { variants } = req.body;
    if (!Array.isArray(variants))
        return res.status(400).json({ error: 'variants must be an array' });
    const productId = req.params.productId;
    // Empty string is not nullish — `??` would let `sku: ''` through, so every
    // row would share the same conflict key. Treat blank as "generate one".
    const skuFor = (v) => {
        const provided = (v.sku ?? '').trim();
        if (provided)
            return provided;
        return `${productId.slice(0, 6)}-${v.color}-${v.size || 'na'}`
            .toLowerCase()
            .replace(/\s+/g, '-');
    };
    // Dedupe by sku — a single ON CONFLICT upsert cannot affect a row twice.
    const bySku = new Map();
    for (const v of variants) {
        const sku = skuFor(v);
        bySku.set(sku, {
            product_id: productId,
            color: v.color,
            size: v.size,
            quantity: v.quantity,
            sku,
            image_url: v.image_url ?? null,
        });
    }
    const rows = [...bySku.values()];
    const { data, error } = await supabase_1.supabase
        .from('variants')
        .upsert(rows, { onConflict: 'sku' })
        .select();
    if (error)
        return res.status(400).json({ error: error.message });
    // Replace the variant set: drop rows no longer present so an edited product
    // does not keep stale variants. Stale stock would otherwise be re-summed on
    // the next edit and inflate the quantity each time.
    const keepSkus = new Set(rows.map((r) => r.sku));
    const { data: existing } = await supabase_1.supabase
        .from('variants')
        .select('id, sku')
        .eq('product_id', productId);
    const staleIds = (existing ?? [])
        .filter((v) => !keepSkus.has(v.sku))
        .map((v) => v.id);
    if (staleIds.length > 0) {
        await supabase_1.supabase.from('variants').delete().in('id', staleIds);
    }
    res.json(data);
});
router.patch('/:id', auth_1.authenticate, auth_1.requireApprovedEmployee, async (req, res) => {
    const { quantity, color, size, image_url } = req.body;
    const updates = {};
    if (quantity !== undefined)
        updates.quantity = quantity;
    if (color)
        updates.color = color;
    if (size)
        updates.size = size;
    if (image_url !== undefined)
        updates.image_url = image_url;
    const { data, error } = await supabase_1.supabase
        .from('variants')
        .update(updates)
        .eq('id', req.params.id)
        .select()
        .single();
    if (error)
        return res.status(400).json({ error: error.message });
    res.json(data);
});
router.delete('/:id', auth_1.authenticate, (0, auth_1.requireRole)('admin'), async (req, res) => {
    const { error } = await supabase_1.supabase.from('variants').delete().eq('id', req.params.id);
    if (error)
        return res.status(400).json({ error: error.message });
    res.json({ success: true });
});
exports.default = router;
//# sourceMappingURL=variants.js.map