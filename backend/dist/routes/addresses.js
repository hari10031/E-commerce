"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const supabase_1 = require("../supabase");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', async (req, res) => {
    const { data, error } = await supabase_1.supabase
        .from('addresses')
        .select('*')
        .eq('user_id', req.user.id)
        .order('is_default', { ascending: false });
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
router.post('/', [
    (0, express_validator_1.body)('line1').trim().notEmpty(),
    (0, express_validator_1.body)('city').trim().notEmpty(),
    (0, express_validator_1.body)('state').trim().notEmpty(),
    (0, express_validator_1.body)('pincode').trim().notEmpty(),
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const { line1, line2, city, state, pincode, country = 'India', is_default = false } = req.body;
    if (is_default) {
        await supabase_1.supabase.from('addresses').update({ is_default: false }).eq('user_id', req.user.id);
    }
    const { data, error } = await supabase_1.supabase
        .from('addresses')
        .insert({ user_id: req.user.id, line1, line2, city, state, pincode, country, is_default })
        .select()
        .single();
    if (error)
        return res.status(400).json({ error: error.message });
    res.status(201).json(data);
});
router.patch('/:id', async (req, res) => {
    const { line1, line2, city, state, pincode, country, is_default } = req.body;
    const updates = {};
    if (line1)
        updates.line1 = line1;
    if (line2 !== undefined)
        updates.line2 = line2;
    if (city)
        updates.city = city;
    if (state)
        updates.state = state;
    if (pincode)
        updates.pincode = pincode;
    if (country)
        updates.country = country;
    if (is_default) {
        await supabase_1.supabase.from('addresses').update({ is_default: false }).eq('user_id', req.user.id);
        updates.is_default = true;
    }
    const { data, error } = await supabase_1.supabase
        .from('addresses')
        .update(updates)
        .eq('id', req.params.id)
        .eq('user_id', req.user.id)
        .select()
        .single();
    if (error)
        return res.status(400).json({ error: error.message });
    res.json(data);
});
router.delete('/:id', async (req, res) => {
    const { error } = await supabase_1.supabase
        .from('addresses')
        .delete()
        .eq('id', req.params.id)
        .eq('user_id', req.user.id);
    if (error)
        return res.status(400).json({ error: error.message });
    res.json({ success: true });
});
exports.default = router;
//# sourceMappingURL=addresses.js.map