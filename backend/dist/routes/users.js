"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, auth_1.requireRole)('admin'));
router.get('/', userController_1.listUsers);
router.post('/', userController_1.createUser);
router.get('/:id', userController_1.getUser);
router.patch('/:id/password', userController_1.resetUserPassword);
router.patch('/:id/status', userController_1.setUserActive);
router.delete('/:id', userController_1.deleteUser);
exports.default = router;
//# sourceMappingURL=users.js.map