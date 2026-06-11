"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizeSourceImage = optimizeSourceImage;
const sharp_1 = __importDefault(require("sharp"));
const DEFAULT_MAX_EDGE = 1024;
/** Shrinks source photos before Gemini — smaller payload, faster API round-trip. */
async function optimizeSourceImage(buffer) {
    const maxEdge = parseInt(process.env.AI_SOURCE_MAX_EDGE ?? String(DEFAULT_MAX_EDGE), 10) || DEFAULT_MAX_EDGE;
    const out = await (0, sharp_1.default)(buffer)
        .rotate()
        .resize(maxEdge, maxEdge, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();
    return { buffer: out, mimeType: 'image/jpeg' };
}
//# sourceMappingURL=imagePrep.js.map