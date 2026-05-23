"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const orderController_1 = require("../controllers/orderController");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', orderController_1.getOrders);
router.get('/:id', orderController_1.getOrderById);
router.post('/', [
    (0, express_validator_1.body)('address_id').isUUID(),
    (0, express_validator_1.body)('items').isArray({ min: 1 }),
    (0, express_validator_1.body)('total_amount').isFloat({ min: 0 }),
], async (req, res, _next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    return (0, orderController_1.placeOrder)(req, res);
});
router.patch('/:id/status', (0, auth_1.requireRole)('admin', 'employee'), orderController_1.updateOrderStatus);
router.post('/:id/cancel', orderController_1.cancelOrder);
router.post('/:id/refund', orderController_1.requestRefund);
exports.default = router;
//# sourceMappingURL=orders.js.map