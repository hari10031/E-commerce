"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.getUser = getUser;
exports.createUser = createUser;
exports.deleteUser = deleteUser;
exports.resetUserPassword = resetUserPassword;
exports.setUserActive = setUserActive;
const supabase_1 = require("../supabase");
const VALID_ROLES = ['customer', 'employee', 'admin'];
// A user is deactivated when Supabase has them banned into the future.
const isBanned = (u) => !!u?.banned_until && new Date(u.banned_until).getTime() > Date.now();
// List users by role (admin only). Merges auth emails and, for customers,
// per-user order stats so the Customers screen can show spend at a glance.
async function listUsers(req, res) {
    const { role = 'customer', search, page = '1', limit = '20' } = req.query;
    const from = (+page - 1) * +limit;
    const to = +page * +limit - 1;
    let query = supabase_1.supabase
        .from('profiles')
        .select('id, name, phone, role, employee_status, created_at', { count: 'exact' })
        .eq('role', role)
        .order('created_at', { ascending: false });
    if (search)
        query = query.ilike('name', `%${search}%`);
    const { data: profiles, error, count } = await query.range(from, to);
    if (error)
        return res.status(500).json({ error: error.message });
    const { data: authList } = await supabase_1.supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const authMap = new Map((authList?.users ?? []).map((u) => [u.id, u]));
    const ids = (profiles ?? []).map((p) => p.id);
    const statsMap = {};
    if (ids.length) {
        const { data: orders } = await supabase_1.supabase
            .from('orders')
            .select('user_id, total_amount, status')
            .in('user_id', ids)
            .not('status', 'eq', 'cancelled');
        for (const o of orders ?? []) {
            const k = o.user_id;
            if (!statsMap[k])
                statsMap[k] = { orderCount: 0, totalSpent: 0 };
            statsMap[k].orderCount += 1;
            statsMap[k].totalSpent += Number(o.total_amount);
        }
    }
    const data = (profiles ?? []).map((p) => {
        const au = authMap.get(p.id);
        return {
            ...p,
            email: au?.email ?? null,
            active: !isBanned(au),
            orderCount: statsMap[p.id]?.orderCount ?? 0,
            totalSpent: statsMap[p.id]?.totalSpent ?? 0,
        };
    });
    res.json({ data, count, page: +page, limit: +limit });
}
async function getUser(req, res) {
    const { data: profile, error } = await supabase_1.supabase
        .from('profiles')
        .select('*')
        .eq('id', req.params.id)
        .single();
    if (error)
        return res.status(404).json({ error: 'User not found' });
    const { data: authUser } = await supabase_1.supabase.auth.admin.getUserById(req.params.id);
    res.json({
        ...profile,
        email: authUser?.user?.email ?? null,
        active: !isBanned(authUser?.user),
    });
}
// Create a user with any role (admin only). Admin-created employees are
// auto-approved — they skip the pending/approval flow self-registration uses.
async function createUser(req, res) {
    const { name, email, password, phone, role = 'customer' } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'name, email and password are required' });
    }
    if (String(password).length < 6) {
        return res.status(400).json({ error: 'password must be at least 6 characters' });
    }
    if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ error: 'role must be customer, employee or admin' });
    }
    const { data, error } = await supabase_1.supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, phone: phone ?? null, role },
    });
    if (error)
        return res.status(400).json({ error: error.message });
    const employee_status = role === 'employee' ? 'approved' : null;
    const { data: profile, error: profileErr } = await supabase_1.supabase
        .from('profiles')
        .upsert({ id: data.user.id, name, phone: phone ?? null, role, employee_status })
        .select()
        .single();
    if (profileErr)
        return res.status(400).json({ error: profileErr.message });
    res.status(201).json({ ...profile, email: data.user.email });
}
// Permanently delete a user account (admin only). Fails gracefully if the user
// still has linked records (e.g. a customer with orders) — the FK blocks it.
async function deleteUser(req, res) {
    const { id } = req.params;
    if (id === req.user.id) {
        return res.status(400).json({ error: 'You cannot delete your own account' });
    }
    const { error } = await supabase_1.supabase.auth.admin.deleteUser(id);
    if (error) {
        return res.status(400).json({
            error: /foreign key|violates/i.test(error.message)
                ? 'This account has orders or sales linked to it and cannot be deleted.'
                : error.message,
        });
    }
    res.json({ success: true });
}
// Admin sets a new password for a user.
async function resetUserPassword(req, res) {
    const { id } = req.params;
    const { password } = req.body;
    if (!password || String(password).length < 6) {
        return res.status(400).json({ error: 'password must be at least 6 characters' });
    }
    const { error } = await supabase_1.supabase.auth.admin.updateUserById(id, { password });
    if (error)
        return res.status(400).json({ error: error.message });
    res.json({ success: true });
}
// Activate / deactivate a user. Deactivating bans them in Supabase, which
// blocks login while keeping all their records intact (reversible).
async function setUserActive(req, res) {
    const { id } = req.params;
    const { active } = req.body;
    if (typeof active !== 'boolean') {
        return res.status(400).json({ error: 'active must be a boolean' });
    }
    if (id === req.user.id && !active) {
        return res.status(400).json({ error: 'You cannot deactivate your own account' });
    }
    const { error } = await supabase_1.supabase.auth.admin.updateUserById(id, {
        ban_duration: active ? 'none' : '876000h',
    });
    if (error)
        return res.status(400).json({ error: error.message });
    res.json({ success: true, active });
}
//# sourceMappingURL=userController.js.map