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
    const rows = variants.map((v) => ({
        product_id: req.params.productId,
        color: v.color,
        size: v.size,
        quantity: v.quantity,
        sku: v.sku ?? `${req.params.productId.slice(0, 6)}-${v.color}-${v.size}`.toLowerCase(),
        image_url: v.image_url ?? null,
    }));
    const { data, error } = await supabase_1.supabase
        .from('variants')
        .upsert(rows, { onConflict: 'sku' })
        .select();
    if (error)
        return res.status(400).json({ error: error.message });
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