"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const employeeController_1 = require("../controllers/employeeController");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, auth_1.requireRole)('admin'));
router.get('/', employeeController_1.getEmployees);
router.patch('/:id/approve', employeeController_1.approveOrRejectEmployee);
router.delete('/:id', employeeController_1.removeEmployee);
exports.default = router;
//# sourceMappingURL=employees.js.map