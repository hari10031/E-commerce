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
    let session = null;
    // Create the user pre-confirmed via the admin API: no verification email is
    // sent (avoids Supabase email rate limits) and no email confirmation step
    // is needed for either role.
    const { data: created, error: createErr } = await supabase_1.supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            name,
            phone: phone ?? null,
            role,
            ...(role === 'employee' ? { employee_status: 'pending' } : {}),
        },
    });
    if (createErr)
        return res.status(400).json({ error: createErr.message });
    const user = created.user;
    // Customers can use the app right away — hand back a session so the web
    // storefront logs them in immediately after registering. Employees stay
    // blocked until an admin sets employee_status to 'approved'.
    if (role === 'customer' && user) {
        const { data: signIn } = await supabase_1.supabaseAuth.auth.signInWithPassword({ email, password });
        session = signIn.session ?? null;
    }
    // Sync extra fields to profiles table
    if (user) {
        await supabase_1.supabase.from('profiles').upsert({
            id: user.id,
            name,
            phone: phone ?? null,
            role,
            ...(role === 'employee' ? { employee_status: 'pending' } : {}),
        });
    }
    res.status(201).json({ user, session });
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
        refreshToken: data.session.refresh_token,
        user: { ...profile, email: data.user.email },
    });
});
// Exchange a refresh token for a fresh access token. Supabase access tokens
// expire after ~1h; without this the app would 401 and log the user out.
router.post('/refresh', rateLimiter_1.authLimiter, [(0, express_validator_1.body)('refreshToken').notEmpty()], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const { refreshToken } = req.body;
    const { data, error } = await supabase_1.supabaseAuth.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session) {
        return res.status(401).json({ error: error?.message ?? 'Could not refresh session' });
    }
    res.json({
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
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