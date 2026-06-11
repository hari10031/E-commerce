"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const orderController_1 = require("../controllers/orderController");
const router = (0, express_1.Router)();
router.post('/create', auth_1.authenticate, orderController_1.createRazorpayOrder);
router.post('/verify', auth_1.authenticate, orderController_1.verifyPayment);
exports.default = router;
//# sourceMappingURL=razorpay.js.map