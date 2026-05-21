"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sharp_1 = __importDefault(require("sharp"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const storageService_1 = require("../services/storageService");
const geminiService_1 = require("../services/geminiService");
const router = (0, express_1.Router)();
const client = new sdk_1.default();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
router.post('/generate-content', rateLimiter_1.aiLimiter, auth_1.authenticate, auth_1.requireApprovedEmployee, async (req, res) => {
    const { productType, category, colors, sizes } = req.body;
    const msg = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
            {
                role: 'user',
                content: `You are a product copywriter for an Indian e-commerce store selling ${productType}.
Generate a product listing for:
- Category: ${category}
- Colors: ${Array.isArray(colors) ? colors.join(', ') : colors}
- Sizes: ${Array.isArray(sizes) ? sizes.join(', ') : sizes}

Respond ONLY with valid JSON, no markdown or preamble:
{"title": "max 80 chars, SEO-friendly title", "description": "2-3 sentences covering fabric, occasion, and color appeal"}`,
            },
        ],
    });
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    try {
        res.json(JSON.parse(text));
    }
    catch {
        res.status(500).json({ error: 'AI returned invalid JSON', raw: text });
    }
});
// "Nano banana" image generation — turns an uploaded product photo into a
// clean studio product image via Gemini 2.5 Flash Image.
// Accepts either a multipart `image` file or a JSON `imageUrl`.
router.post('/generate-image', rateLimiter_1.aiLimiter, auth_1.authenticate, auth_1.requireApprovedEmployee, upload.single('image'), async (req, res) => {
    let sourceBuffer;
    let mimeType;
    const imageUrls = Array.isArray(req.body.imageUrls)
        ? req.body.imageUrls.filter((url) => typeof url === 'string' && url.trim().length > 0)
        : [];
    if (!req.file && !req.body.imageUrl && imageUrls.length === 0) {
        return res.status(400).json({ error: 'Provide an image file, imageUrl, or imageUrls' });
    }
    const { productType, color, category } = req.body;
    try {
        if (imageUrls.length > 0) {
            const urls = imageUrls.slice(0, 4);
            const buffers = await Promise.all(urls.map(async (url) => {
                const resp = await fetch(url);
                if (!resp.ok)
                    throw new Error('Could not fetch the source image');
                return Buffer.from(await resp.arrayBuffer());
            }));
            const cols = urls.length > 1 ? 2 : 1;
            const rows = Math.ceil(urls.length / cols);
            const cellWidth = 600;
            const cellHeight = 800;
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
            sourceBuffer = await base.composite(composites).jpeg({ quality: 90 }).toBuffer();
            mimeType = 'image/jpeg';
        }
        else if (req.file) {
            sourceBuffer = req.file.buffer;
            mimeType = req.file.mimetype;
        }
        else {
            const resp = await fetch(req.body.imageUrl);
            if (!resp.ok)
                return res.status(400).json({ error: 'Could not fetch the source image' });
            sourceBuffer = Buffer.from(await resp.arrayBuffer());
            mimeType = resp.headers.get('content-type') || 'image/jpeg';
        }
        const generated = await (0, geminiService_1.generateProductImage)({
            imageBase64: sourceBuffer.toString('base64'),
            mimeType,
            productType,
            color,
            category,
        });
        const safeColor = (color || 'product').toString().replace(/\s+/g, '-');
        const url = await (0, storageService_1.uploadImage)(generated, `ai-${safeColor}.png`, 'product-images');
        res.json({ url });
    }
    catch (err) {
        res.status(502).json({ error: err instanceof Error ? err.message : 'Image generation failed' });
    }
});
exports.default = router;
//# sourceMappingURL=ai.js.map