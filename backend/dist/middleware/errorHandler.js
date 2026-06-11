"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.notFound = notFound;
const multer_1 = __importDefault(require("multer"));
const logger_1 = require("../logger");
function errorHandler(err, req, res, _next) {
    if (err instanceof multer_1.default.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: 'File too large (max 10 MB)' });
        }
        return res.status(400).json({ error: err.message });
    }
    if (err.message === 'Only image files are allowed') {
        return res.status(415).json({ error: err.message });
    }
    logger_1.logger.error({ err, url: req.url, method: req.method }, 'Unhandled error');
    res.status(500).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
}
function notFound(req, res) {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
}
//# sourceMappingURL=errorHandler.js.map