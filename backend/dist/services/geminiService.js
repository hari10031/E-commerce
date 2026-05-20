"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateProductImage = generateProductImage;
const genai_1 = require("@google/genai");
// "Nano banana" = Gemini 2.5 Flash Image. Override via env if the model id changes.
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
let client = null;
function getClient() {
    if (!client) {
        const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
        if (!apiKey)
            throw new Error('GOOGLE_GEMINI_API_KEY is not configured');
        client = new genai_1.GoogleGenAI({ apiKey });
    }
    return client;
}
// Turns a raw product photo into a clean studio-style e-commerce image.
// Returns the generated image as a Buffer (PNG).
async function generateProductImage(input) {
    const { imageBase64, mimeType, productType, color, category } = input;
    const descriptor = [color, category, productType].filter(Boolean).join(' ') || 'fashion product';
    const prompt = `Turn this photo into a professional e-commerce product photograph of the ${descriptor}.
Place the item on a clean seamless white studio background with soft even lighting and a subtle natural shadow.
Preserve the product's real colours, fabric texture and details exactly as in the original photo.
Centre the product, fill the frame nicely, and remove any background clutter or distractions.
Return one polished product image suitable for an Indian fashion online store.`;
    const response = await getClient().models.generateContent({
        model: IMAGE_MODEL,
        contents: [
            {
                role: 'user',
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType, data: imageBase64 } },
                ],
            },
        ],
    });
    const parts = response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
        const data = part.inlineData?.data;
        if (data)
            return Buffer.from(data, 'base64');
    }
    throw new Error('Gemini did not return an image — try a clearer source photo');
}
//# sourceMappingURL=geminiService.js.map