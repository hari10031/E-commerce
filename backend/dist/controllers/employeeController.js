"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmployees = getEmployees;
exports.approveOrRejectEmployee = approveOrRejectEmployee;
exports.removeEmployee = removeEmployee;
const supabase_1 = require("../supabase");
const notificationService_1 = require("../services/notificationService");
async function getEmployees(req, res) {
    const { status, page = '1', limit = '20' } = req.query;
    let query = supabase_1.supabase
        .from('profiles')
        .select('id, name, phone, employee_status, created_at, updated_at', { count: 'exact' })
        .eq('role', 'employee')
        .order('created_at', { ascending: false })
        .range((+page - 1) * +limit, +page * +limit - 1);
    if (status)
        query = query.eq('employee_status', status);
    const { data, error, count } = await query;
    if (error)
        return res.status(500).json({ error: error.message });
    // Email + ban status live in auth.users, not profiles — merge them in.
    const isBanned = (u) => !!u?.banned_until && new Date(u.banned_until).getTime() > Date.now();
    const { data: authList } = await supabase_1.supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const authMap = new Map((authList?.users ?? []).map((u) => [u.id, u]));
    const withEmail = (data ?? []).map((e) => {
        const au = authMap.get(e.id);
        return { ...e, email: au?.email ?? null, active: !isBanned(au) };
    });
    res.json({ data: withEmail, count, page: +page, limit: +limit });
}
async function approveOrRejectEmployee(req, res) {
    const { action } = req.body;
    if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'action must be "approve" or "reject"' });
    }
    const status = action === 'approve' ? 'approved' : 'rejected';
    const { data, error } = await supabase_1.supabase
        .from('profiles')
        .update({ employee_status: status, updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .eq('role', 'employee')
        .select()
        .single();
    if (error)
        return res.status(400).json({ error: error.message });
    (0, notificationService_1.notifyEmployeeApproval)(req.params.id, action === 'approve');
    res.json(data);
}
async function removeEmployee(req, res) {
    const { error } = await supabase_1.supabase
        .from('profiles')
        .update({ role: 'customer', employee_status: null, updated_at: new Date().toISOString() })
        .eq('id', req.params.id);
    if (error)
        return res.status(400).json({ error: error.message });
    res.json({ success: true });
}
//# sourceMappingURL=employeeController.js.map