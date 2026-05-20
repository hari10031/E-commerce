"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = uploadImage;
exports.deleteImage = deleteImage;
const sharp_1 = __importDefault(require("sharp"));
const supabase_1 = require("../supabase");
async function uploadImage(buffer, originalName, bucket) {
    const filename = `${Date.now()}-${originalName.replace(/\s+/g, '-').replace(/\.[^.]+$/, '')}.webp`;
    const optimized = await (0, sharp_1.default)(buffer)
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