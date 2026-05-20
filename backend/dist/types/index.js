"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_ORDER_TRANSITIONS = void 0;
exports.VALID_ORDER_TRANSITIONS = {
    placed: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
    refunded: [],
};
//# sourceMappingURL=index.js.map