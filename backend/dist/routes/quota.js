"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const aiQuotaService_1 = require("../services/aiQuotaService");
const aiQuotaRequestService_1 = require("../services/aiQuotaRequestService");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, (0, auth_1.requireRole)('admin'), async (_req, res) => {
    try {
        const stats = await (0, aiQuotaService_1.getQuotaStats)();
        res.json(stats);
    }
    catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to load quota stats' });
    }
});
router.get('/requests', auth_1.authenticate, (0, auth_1.requireRole)('admin'), async (req, res) => {
    try {
        const requests = await (0, aiQuotaRequestService_1.listRequestsForAdmin)(req.user.id);
        res.json(requests);
    }
    catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to load requests' });
    }
});
router.post('/requests', auth_1.authenticate, (0, auth_1.requireRole)('admin'), (0, express_validator_1.body)('requestType').isIn(['extend', 'decrease']), (0, express_validator_1.body)('usageType').isIn(['image', 'content', 'both']), (0, express_validator_1.body)('requestedImageLimit').optional().isInt({ min: 0 }), (0, express_validator_1.body)('requestedContentLimit').optional().isInt({ min: 0 }), (0, express_validator_1.body)('reason').isString().trim().isLength({ min: 10 }), async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const { requestType, usageType, requestedImageLimit, requestedContentLimit, reason } = req.body;
    try {
        const request = await (0, aiQuotaRequestService_1.createRequest)(req.user.id, {
            requestType,
            usageType,
            requestedImageLimit: requestedImageLimit !== undefined ? Number(requestedImageLimit) : undefined,
            requestedContentLimit: requestedContentLimit !== undefined ? Number(requestedContentLimit) : undefined,
            reason,
        });
        res.status(201).json(request);
    }
    catch (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to create request' });
    }
});
exports.default = router;
//# sourceMappingURL=quota.js.map