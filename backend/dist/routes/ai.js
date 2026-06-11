"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sharp_1 = __importDefault(require("sharp"));
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const storageService_1 = require("../services/storageService");
const geminiService_1 = require("../services/geminiService");
const imagePrep_1 = require("../services/imagePrep");
const aiQuotaService_1 = require("../services/aiQuotaService");
const fetchWithTimeout_1 = require("../lib/fetchWithTimeout");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
async function loadImageFromUrl(imageUrl) {
    const resp = await (0, fetchWithTimeout_1.fetchWithTimeout)(imageUrl, {}, 15_000);
    if (!resp.ok)
        throw new Error('Could not fetch the source image');
    const buffer = Buffer.from(await resp.arrayBuffer());
    const optimized = await (0, imagePrep_1.optimizeSourceImage)(buffer);
    return { buffer: optimized.buffer, mimeType: optimized.mimeType };
}
router.post('/generate-content', rateLimiter_1.aiLimiter, auth_1.authenticate, auth_1.requireApprovedEmployee, upload.single('image'), async (req, res) => {
    const { productType, color, category, imageUrl } = req.body;
    let quotaConsumed = false;
    try {
        await (0, aiQuotaService_1.consumeQuota)('content', req.user?.id);
        quotaConsumed = true;
        let buffer;
        let mimeType;
        if (req.file) {
            const optimized = await (0, imagePrep_1.optimizeSourceImage)(req.file.buffer);
            buffer = optimized.buffer;
            mimeType = optimized.mimeType;
        }
        else if (imageUrl) {
            const loaded = await loadImageFromUrl(imageUrl);
            buffer = loaded.buffer;
            mimeType = loaded.mimeType;
        }
        else {
            return res.status(400).json({ error: 'Provide an image file or imageUrl' });
        }
        const content = await (0, geminiService_1.generateProductContent)({
            imageBase64: buffer.toString('base64'),
            mimeType,
            productType,
            color,
            category,
        });
        res.json(content);
    }
    catch (err) {
        if (quotaConsumed)
            await (0, aiQuotaService_1.refundQuota)('content').catch(() => { });
        if (err instanceof aiQuotaService_1.QuotaExceededError) {
            return res.status(429).json({ error: err.message });
        }
        res.status(502).json({ error: err instanceof Error ? err.message : 'Content generation failed' });
    }
});
router.post('/generate-image', rateLimiter_1.aiLimiter, auth_1.authenticate, auth_1.requireApprovedEmployee, upload.single('image'), async (req, res) => {
    let sourceBuffer;
    let mimeType;
    let quotaConsumed = false;
    const imageUrls = Array.isArray(req.body.imageUrls)
        ? req.body.imageUrls.filter((url) => typeof url === 'string' && url.trim().length > 0)
        : [];
    if (!req.file && !req.body.imageUrl && imageUrls.length === 0) {
        return res.status(400).json({ error: 'Provide an image file, imageUrl, or imageUrls' });
    }
    const { productType, color, category } = req.body;
    const t0 = Date.now();
    const timing = { prepareMs: 0, geminiMs: 0, uploadMs: 0, totalMs: 0 };
    try {
        await (0, aiQuotaService_1.consumeQuota)('image', req.user?.id);
        quotaConsumed = true;
        if (imageUrls.length > 0) {
            const prepStart = Date.now();
            const urls = imageUrls.slice(0, 7);
            const buffers = await Promise.all(urls.map(async (url) => {
                const loaded = await loadImageFromUrl(url);
                return loaded.buffer;
            }));
            const cols = urls.length <= 1 ? 1 : urls.length <= 4 ? 2 : 3;
            const rows = Math.ceil(urls.length / cols);
            const cellWidth = 480;
            const cellHeight = 640;
            const base = (0, sharp_1.default)({
                create: {
                    width: cols * cellWidth,
                    height: rows * cellHeight,
                    channels: 3,
                    background: '#ffffff',
                },
            });
            const composites = await Promise.all(buffers.map(async (buffer, idx) => ({
                input: await (0, sharp_1.default)(buffer)
                    .resize(cellWidth, cellHeight, { fit: 'cover' })
                    .jpeg({ quality: 90 })
                    .toBuffer(),
                left: (idx % cols) * cellWidth,
                top: Math.floor(idx / cols) * cellHeight,
            })));
            sourceBuffer = await base.composite(composites).jpeg({ quality: 85 }).toBuffer();
            mimeType = 'image/jpeg';
            timing.prepareMs = Date.now() - prepStart;
        }
        else if (req.file) {
            const prepStart = Date.now();
            const optimized = await (0, imagePrep_1.optimizeSourceImage)(req.file.buffer);
            sourceBuffer = optimized.buffer;
            mimeType = optimized.mimeType;
            timing.prepareMs = Date.now() - prepStart;
        }
        else {
            const prepStart = Date.now();
            const loaded = await loadImageFromUrl(req.body.imageUrl);
            sourceBuffer = loaded.buffer;
            mimeType = loaded.mimeType;
            timing.prepareMs = Date.now() - prepStart;
        }
        if (imageUrls.length > 0) {
            const optStart = Date.now();
            const optimized = await (0, imagePrep_1.optimizeSourceImage)(sourceBuffer);
            sourceBuffer = optimized.buffer;
            mimeType = optimized.mimeType;
            timing.prepareMs += Date.now() - optStart;
        }
        const geminiStart = Date.now();
        const generated = await (0, geminiService_1.generateProductImage)({
            imageBase64: sourceBuffer.toString('base64'),
            mimeType,
            productType,
            color,
            category,
        });
        timing.geminiMs = Date.now() - geminiStart;
        const uploadStart = Date.now();
        const safeColor = (color || 'product').toString().replace(/\s+/g, '-');
        const url = await (0, storageService_1.uploadImage)(generated, `ai-${safeColor}.png`, 'product-images');
        timing.uploadMs = Date.now() - uploadStart;
        timing.totalMs = Date.now() - t0;
        res.json({ url, timing, productType: productType || 'saree' });
    }
    catch (err) {
        if (quotaConsumed)
            await (0, aiQuotaService_1.refundQuota)('image').catch(() => { });
        if (err instanceof aiQuotaService_1.QuotaExceededError) {
            return res.status(429).json({ error: err.message });
        }
        res.status(502).json({ error: err instanceof Error ? err.message : 'Image generation failed' });
    }
});
exports.default = router;
//# sourceMappingURL=ai.js.map