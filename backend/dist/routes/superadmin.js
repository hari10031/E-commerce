"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const aiQuotaService_1 = require("../services/aiQuotaService");
const aiQuotaRequestService_1 = require("../services/aiQuotaRequestService");
const adminManagementController_1 = require("../controllers/adminManagementController");
const router = (0, express_1.Router)();
router.get('/admins', auth_1.authenticate, auth_1.requireSuperAdmin, adminManagementController_1.listAdmins);
router.post('/admins', auth_1.authenticate, auth_1.requireSuperAdmin, adminManagementController_1.createAdmin);
router.get('/admins/:id', auth_1.authenticate, auth_1.requireSuperAdmin, adminManagementController_1.getAdmin);
router.patch('/admins/:id', auth_1.authenticate, auth_1.requireSuperAdmin, adminManagementController_1.updateAdmin);
router.patch('/admins/:id/password', auth_1.authenticate, auth_1.requireSuperAdmin, adminManagementController_1.resetAdminPassword);
router.patch('/admins/:id/status', auth_1.authenticate, auth_1.requireSuperAdmin, adminManagementController_1.setAdminActive);
router.delete('/admins/:id', auth_1.authenticate, auth_1.requireSuperAdmin, adminManagementController_1.deleteAdmin);
router.get('/ai-quota', auth_1.authenticate, auth_1.requireSuperAdmin, async (_req, res) => {
    try {
        const stats = await (0, aiQuotaService_1.getQuotaStats)();
        res.json(stats);
    }
    catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to load quota stats' });
    }
});
router.patch('/ai-quota', auth_1.authenticate, auth_1.requireSuperAdmin, (0, express_validator_1.body)('imageLimit').optional().isInt({ min: 0 }), (0, express_validator_1.body)('contentLimit').optional().isInt({ min: 0 }), (0, express_validator_1.body)('resetPeriod').optional().isIn(['lifetime', 'monthly']), async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const { imageLimit, contentLimit, resetPeriod } = req.body;
    if (imageLimit === undefined && contentLimit === undefined && resetPeriod === undefined) {
        return res.status(400).json({ error: 'Provide at least one field to update' });
    }
    try {
        const stats = await (0, aiQuotaService_1.updateLimits)({ imageLimit, contentLimit, resetPeriod }, req.user.id);
        res.json(stats);
    }
    catch (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update limits' });
    }
});
router.post('/ai-quota/reset-period', auth_1.authenticate, auth_1.requireSuperAdmin, async (_req, res) => {
    try {
        const stats = await (0, aiQuotaService_1.resetPeriodCounters)();
        res.json(stats);
    }
    catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to reset period' });
    }
});
router.get('/ai-quota/requests/pending-count', auth_1.authenticate, auth_1.requireSuperAdmin, async (_req, res) => {
    try {
        const count = await (0, aiQuotaRequestService_1.countPendingRequests)();
        res.json({ count });
    }
    catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to count requests' });
    }
});
router.get('/ai-quota/requests', auth_1.authenticate, auth_1.requireSuperAdmin, async (req, res) => {
    const status = req.query.status;
    const allowed = ['pending', 'approved', 'denied', 'cancelled'];
    if (status && !allowed.includes(status)) {
        return res.status(400).json({ error: 'Invalid status filter' });
    }
    try {
        const requests = await (0, aiQuotaRequestService_1.listRequestsForSuperadmin)(status);
        res.json(requests);
    }
    catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to load requests' });
    }
});
router.patch('/ai-quota/requests/:id', auth_1.authenticate, auth_1.requireSuperAdmin, (0, express_validator_1.body)('action').isIn(['approve', 'deny']), (0, express_validator_1.body)('applyLimits').optional().isBoolean(), (0, express_validator_1.body)('reviewNote').optional().isString(), async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const { action, applyLimits, reviewNote } = req.body;
    try {
        const request = await (0, aiQuotaRequestService_1.reviewRequest)(req.params.id, req.user.id, {
            action,
            applyLimits: applyLimits === true,
            reviewNote,
        });
        res.json(request);
    }
    catch (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to review request' });
    }
});
exports.default = router;
//# sourceMappingURL=superadmin.js.map