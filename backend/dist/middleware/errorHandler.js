"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.notFound = notFound;
const logger_1 = require("../logger");
function errorHandler(err, req, res, _next) {
    logger_1.logger.error({ err, url: req.url, method: req.method }, 'Unhandled error');
    res.status(500).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
}
function notFound(req, res) {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
}
//# sourceMappingURL=errorHandler.js.map