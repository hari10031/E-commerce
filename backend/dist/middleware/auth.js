"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
exports.requireApprovedEmployee = requireApprovedEmployee;
exports.requireSuperAdmin = requireSuperAdmin;
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
    const metadataRole = typeof user.user_metadata?.role === 'string' ? user.user_metadata.role : undefined;
    let role = profile?.role ?? metadataRole ?? 'customer';
    if (metadataRole === 'superadmin') {
        role = 'superadmin';
        const name = typeof user.user_metadata?.name === 'string' && user.user_metadata.name.trim()
            ? user.user_metadata.name.trim()
            : user.email?.split('@')[0] || 'Super Admin';
        if (!profile) {
            await supabase_1.supabase.from('profiles').upsert({
                id: user.id,
                name,
                role: 'superadmin',
                employee_status: null,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });
        }
        else if (profile.role !== 'superadmin') {
            await supabase_1.supabase
                .from('profiles')
                .update({ role: 'superadmin', employee_status: null, updated_at: new Date().toISOString() })
                .eq('id', user.id);
        }
    }
    req.user = {
        id: user.id,
        email: user.email,
        role,
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
    if (req.user.role === 'superadmin')
        return res.status(403).json({ error: 'Forbidden' });
    if (req.user.role === 'admin')
        return next();
    if (req.user.role === 'employee' && req.user.employeeStatus === 'approved')
        return next();
    return res.status(403).json({ error: 'Employee account pending approval' });
}
function requireSuperAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
}
//# sourceMappingURL=auth.js.map