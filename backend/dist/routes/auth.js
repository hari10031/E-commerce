"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const supabase_1 = require("../supabase");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
router.post('/register', rateLimiter_1.authLimiter, [
    (0, express_validator_1.body)('email').isEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 8 }),
    (0, express_validator_1.body)('name').trim().notEmpty(),
    (0, express_validator_1.body)('role').optional().isIn(['customer', 'employee']),
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const { email, password, name, phone, role = 'customer' } = req.body;
    const { data, error } = await supabase_1.supabaseAuth.auth.signUp({
        email,
        password,
        options: {
            data: {
                name,
                phone: phone ?? null,
                role,
                ...(role === 'employee' ? { employee_status: 'pending' } : {}),
            },
        },
    });
    if (error)
        return res.status(400).json({ error: error.message });
    // Sync extra fields to profiles table
    if (data.user) {
        await supabase_1.supabase.from('profiles').upsert({
            id: data.user.id,
            name,
            phone: phone ?? null,
            role,
            ...(role === 'employee' ? { employee_status: 'pending' } : {}),
        });
    }
    res.status(201).json({ user: data.user, session: data.session });
});
router.post('/login', rateLimiter_1.authLimiter, [(0, express_validator_1.body)('email').isEmail(), (0, express_validator_1.body)('password').notEmpty()], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const { email, password } = req.body;
    const { data, error } = await supabase_1.supabaseAuth.auth.signInWithPassword({ email, password });
    if (error)
        return res.status(401).json({ error: error.message });
    const { data: profile } = await supabase_1.supabase
        .from('profiles')
        .select('id, name, role, employee_status, phone')
        .eq('id', data.user.id)
        .single();
    res.json({
        token: data.session.access_token,
        user: { ...profile, email: data.user.email },
    });
});
router.post('/logout', auth_1.authenticate, async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token)
        await supabase_1.supabase.auth.admin.signOut(token);
    res.json({ success: true });
});
router.get('/me', auth_1.authenticate, async (req, res) => {
    const { data: profile } = await supabase_1.supabase
        .from('profiles')
        .select('*')
        .eq('id', req.user.id)
        .single();
    res.json(profile);
});
router.patch('/me', auth_1.authenticate, async (req, res) => {
    const { name, phone, whatsapp } = req.body;
    const updates = {};
    if (name)
        updates.name = name;
    if (phone !== undefined)
        updates.phone = phone;
    if (whatsapp !== undefined)
        updates.whatsapp = whatsapp;
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase_1.supabase
        .from('profiles')
        .update(updates)
        .eq('id', req.user.id)
        .select()
        .single();
    if (error)
        return res.status(400).json({ error: error.message });
    res.json(data);
});
router.patch('/push-token', auth_1.authenticate, async (req, res) => {
    const { fcmToken } = req.body;
    if (!fcmToken)
        return res.status(400).json({ error: 'fcmToken required' });
    await supabase_1.supabase
        .from('profiles')
        .update({ fcm_token: fcmToken, updated_at: new Date().toISOString() })
        .eq('id', req.user.id);
    res.json({ success: true });
});
exports.default = router;
//# sourceMappingURL=auth.js.map