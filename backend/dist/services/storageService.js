"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = uploadImage;
exports.deleteImage = deleteImage;
const crypto_1 = require("crypto");
const sharp_1 = __importDefault(require("sharp"));
const supabase_1 = require("../supabase");
async function uploadImage(buffer, originalName, bucket) {
    const stem = originalName.replace(/\s+/g, '-').replace(/\.[^.]+$/, '') || 'image';
    const filename = `${Date.now()}-${stem}-${(0, crypto_1.randomUUID)()}.webp`;
    const pipeline = (0, sharp_1.default)(buffer);
    // Product catalog: center-crop to 3:4 portrait (Myntra-style consistency)
    const optimized = bucket === 'product-images'
        ? await pipeline
            .resize(1200, 1600, { fit: 'cover', position: 'centre' })
            .webp({ quality: 85 })
            .toBuffer()
        : await pipeline
            .resize({ width: 1200, withoutEnlargement: true })
            .webp({ quality: 85 })
            .toBuffer();
    const { error } = await supabase_1.supabase.storage
        .from(bucket)
        .upload(filename, optimized, { contentType: 'image/webp', upsert: false });
    if (error)
        throw new Error(error.message);
    const { data: { publicUrl }, } = supabase_1.supabase.storage.from(bucket).getPublicUrl(filename);
    return publicUrl;
}
async function deleteImage(bucket, filename) {
    await supabase_1.supabase.storage.from(bucket).remove([filename]);
}
//# sourceMappingURL=storageService.js.map