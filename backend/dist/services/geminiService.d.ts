interface GenerateImageInput {
    imageBase64: string;
    mimeType: string;
    productType?: string;
    color?: string;
    category?: string;
}
export declare function generateProductImage(input: GenerateImageInput): Promise<Buffer>;
export {};
//# sourceMappingURL=geminiService.d.ts.map