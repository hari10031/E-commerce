"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const shipmentController_1 = require("../controllers/shipmentController");
const router = (0, express_1.Router)();
router.post('/webhook', shipmentController_1.webhookHandler);
router.post('/serviceability', auth_1.authenticate, (0, auth_1.requireRole)('admin', 'employee'), shipmentController_1.checkServiceabilityHandler);
router.post('/create', auth_1.authenticate, (0, auth_1.requireRole)('admin', 'employee'), shipmentController_1.createShipmentHandler);
router.post('/:orderId/label', auth_1.authenticate, (0, auth_1.requireRole)('admin', 'employee'), shipmentController_1.getLabelHandler);
router.post('/:orderId/invoice', auth_1.authenticate, (0, auth_1.requireRole)('admin', 'employee'), shipmentController_1.getInvoiceHandler);
router.post('/:orderId/manifest', auth_1.authenticate, (0, auth_1.requireRole)('admin', 'employee'), shipmentController_1.getManifestHandler);
router.get('/:orderId/track', auth_1.authenticate, shipmentController_1.trackShipmentHandler);
router.post('/:orderId/cancel', auth_1.authenticate, (0, auth_1.requireRole)('admin', 'employee'), shipmentController_1.cancelShipmentHandler);
exports.default = router;
//# sourceMappingURL=shipments.js.map