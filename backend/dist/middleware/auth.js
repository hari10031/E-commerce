"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
exports.requireApprovedEmployee = requireApprovedEmployee;
const supabase_1 = require("../supabase");
async function authenticate(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token)
        return res.status(401).json({ error: 'No token provided' });
    const { data: { user }, error, } = await supabase_1.supabase.auth.getUser(token);
    if (error || !user)
        return res.status(401).json({ error: 'Invalid or expired token' });
    const { data: profile } = await supabase_1.supabase
        .from('profiles')
        .select('role, employee_status')
        .eq('id', user.id)
        .single();
    req.user = {
        id: user.id,
        email: user.email,
        role: profile?.role ?? 'customer',
        employeeStatus: profile?.employee_status,
    };
    next();
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
}
function requireApprovedEmployee(req, res, next) {
    if (!req.user)
        return res.status(401).json({ error: 'Not authenticated' });
    if (req.user.role === 'admin')
        return next();
    if (req.user.role === 'employee' && req.user.employeeStatus === 'approved')
        return next();
    return res.status(403).json({ error: 'Employee account pending approval' });
}
//# sourceMappingURL=auth.js.map