"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const analyticsController_1 = require("../controllers/analyticsController");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/dashboard', (0, auth_1.requireRole)('admin', 'employee'), analyticsController_1.getDashboardStats);
router.get('/sales', (0, auth_1.requireRole)('admin'), analyticsController_1.getSalesTimeline);
router.get('/inventory', (0, auth_1.requireRole)('admin', 'employee'), analyticsController_1.getInventory);
router.get('/category-sales', (0, auth_1.requireRole)('admin'), analyticsController_1.getCategorySales);
router.get('/category-inventory', (0, auth_1.requireRole)('admin', 'employee'), analyticsController_1.getCategoryInventory);
router.get('/employee-performance', (0, auth_1.requireRole)('admin'), analyticsController_1.getEmployeePerformance);
router.get('/sales-summary', (0, auth_1.requireRole)('admin'), analyticsController_1.getSalesSummary);
exports.default = router;
//# sourceMappingURL=analytics.js.map