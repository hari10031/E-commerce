"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const productController_1 = require("../controllers/productController");
const router = (0, express_1.Router)();
router.get('/', productController_1.getAllProducts);
router.get('/:id', productController_1.getProductById);
router.post('/', auth_1.authenticate, auth_1.requireApprovedEmployee, productController_1.createProduct);
router.patch('/:id', auth_1.authenticate, auth_1.requireApprovedEmployee, productController_1.updateProduct);
router.post('/:id/publish', auth_1.authenticate, auth_1.requireApprovedEmployee, productController_1.publishProduct);
router.post('/:id/unpublish', auth_1.authenticate, (0, auth_1.requireRole)('admin'), productController_1.unpublishProduct);
router.delete('/:id', auth_1.authenticate, (0, auth_1.requireRole)('admin'), productController_1.deleteProduct);
router.post('/:product_id/images', auth_1.authenticate, auth_1.requireApprovedEmployee, productController_1.addProductImage);
router.delete('/:product_id/images/:image_id', auth_1.authenticate, auth_1.requireApprovedEmployee, productController_1.deleteProductImage);
exports.default = router;
//# sourceMappingURL=products.js.map