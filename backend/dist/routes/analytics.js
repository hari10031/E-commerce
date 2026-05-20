"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const analyticsController_1 = require("../controllers/analyticsController");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, auth_1.requireRole)('admin'));
router.get('/dashboard', analyticsController_1.getDashboardStats);
router.get('/sales', analyticsController_1.getSalesTimeline);
router.get('/inventory', analyticsController_1.getInventory);
router.get('/category-sales', analyticsController_1.getCategorySales);
router.get('/category-inventory', analyticsController_1.getCategoryInventory);
router.get('/employee-performance', analyticsController_1.getEmployeePerformance);
router.get('/sales-summary', analyticsController_1.getSalesSummary);
exports.default = router;
//# sourceMappingURL=analytics.js.map