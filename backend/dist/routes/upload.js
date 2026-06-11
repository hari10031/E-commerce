"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const storageService_1 = require("../services/storageService");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/'))
            cb(null, true);
        else
            cb(new Error('Only image files are allowed'));
    },
});
router.post('/image', rateLimiter_1.uploadLimiter, auth_1.authenticate, auth_1.requireApprovedEmployee, upload.single('file'), async (req, res) => {
    if (!req.file)
        return res.status(400).json({ error: 'No file uploaded' });
    const bucket = req.body.bucket ?? 'product-images';
    if (!['product-images', 'category-images'].includes(bucket)) {
        return res.status(400).json({ error: 'Invalid bucket' });
    }
    const url = await (0, storageService_1.uploadImage)(req.file.buffer, req.file.originalname, bucket);
    res.json({ url });
});
exports.default = router;
//# sourceMappingURL=upload.js.map