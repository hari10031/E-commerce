"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const wishlistController_1 = require("../controllers/wishlistController");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', wishlistController_1.getWishlist);
router.post('/', wishlistController_1.addToWishlist);
router.post('/toggle', wishlistController_1.toggleWishlist);
router.delete('/:productId', wishlistController_1.removeFromWishlist);
exports.default = router;
//# sourceMappingURL=wishlist.js.map