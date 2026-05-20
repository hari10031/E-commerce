"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const salesController_1 = require("../controllers/salesController");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticate, auth_1.requireApprovedEmployee, salesController_1.recordOfflineSale);
router.get('/', auth_1.authenticate, auth_1.requireApprovedEmployee, salesController_1.getOfflineSales);
exports.default = router;
//# sourceMappingURL=sales.js.map