"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiLimiter = exports.uploadLimiter = exports.authLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000');
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs,
    max: parseInt(process.env.RATE_LIMIT_MAX ?? '100'),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs,
    max: parseInt(process.env.RATE_LIMIT_AUTH_MAX ?? '10'),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many auth requests, please slow down.' },
});
exports.uploadLimiter = (0, express_rate_limit_1.default)({
    windowMs,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Upload limit reached, please wait.' },
});
exports.aiLimiter = (0, express_rate_limit_1.default)({
    windowMs,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'AI request limit reached.' },
});
//# sourceMappingURL=rateLimiter.js.map