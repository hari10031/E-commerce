"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../supabase");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public: validate a coupon code
router.get('/validate/:code', async (req, res) => {
    const { data, error } = await supabase_1.supabase
        .from('coupons')
        .select('code, discount_pct, expires_at, max_uses, used_count, active')
        .eq('code', req.params.code.toUpperCase())
        .single();
    if (error || !data)
        return res.status(404).json({ error: 'Invalid coupon code' });
    if (!data.active)
        return res.status(400).json({ error: 'Coupon is not active' });
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return res.status(400).json({ error: 'Coupon has expired' });
    }
    if (data.max_uses && data.used_count >= data.max_uses) {
        return res.status(400).json({ error: 'Coupon usage limit reached' });
    }
    res.json({ code: data.code, discount_pct: data.discount_pct });
});
// Admin CRUD
router.get('/', auth_1.authenticate, (0, auth_1.requireRole)('admin'), async (_req, res) => {
    const { data, error } = await supabase_1.supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
router.post('/', auth_1.authenticate, (0, auth_1.requireRole)('admin'), async (req, res) => {
    const { code, discount_pct, max_uses, expires_at } = req.body;
    const { data, error } = await supabase_1.supabase
        .from('coupons')
        .insert({
        code: code.toUpperCase(),
        discount_pct,
        max_uses: max_uses || null,
        expires_at: expires_at || null,
    })
        .select()
        .single();
    if (error)
        return res.status(400).json({ error: error.message });
    res.status(201).json(data);
});
router.patch('/:id', auth_1.authenticate, (0, auth_1.requireRole)('admin'), async (req, res) => {
    const { active, discount_pct, max_uses, expires_at } = req.body;
    const updates = {};
    if (active !== undefined)
        updates.active = active;
    if (discount_pct !== undefined)
        updates.discount_pct = discount_pct;
    if (max_uses !== undefined)
        updates.max_uses = max_uses;
    if (expires_at !== undefined)
        updates.expires_at = expires_at;
    const { data, error } = await supabase_1.supabase
        .from('coupons')
        .update(updates)
        .eq('id', req.params.id)
        .select()
        .single();
    if (error)
        return res.status(400).json({ error: error.message });
    res.json(data);
});
exports.default = router;
//# sourceMappingURL=coupons.js.map