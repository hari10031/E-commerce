"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const cartController_1 = require("../controllers/cartController");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', cartController_1.getCart);
router.post('/', cartController_1.addToCart);
router.patch('/:id', cartController_1.updateCartItem);
router.delete('/:id', cartController_1.removeFromCart);
router.delete('/', cartController_1.clearCart);
exports.default = router;
//# sourceMappingURL=cart.js.map