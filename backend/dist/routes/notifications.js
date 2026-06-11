"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../supabase");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', async (req, res) => {
    const { data, error } = await supabase_1.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false })
        .limit(50);
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
router.post('/mark-read', async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids))
        return res.status(400).json({ error: 'ids must be an array' });
    await supabase_1.supabase
        .from('notifications')
        .update({ read: true })
        .in('id', ids)
        .eq('user_id', req.user.id);
    res.json({ success: true });
});
router.post('/mark-all-read', async (req, res) => {
    await supabase_1.supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', req.user.id)
        .eq('read', false);
    res.json({ success: true });
});
exports.default = router;
//# sourceMappingURL=notifications.js.map