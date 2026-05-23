interface GenerateImageInput {
    imageBase64: string;
    mimeType: string;
    productType?: string;
    color?: string;
    category?: string;
}
export declare function generateProductImage(input: GenerateImageInput): Promise<Buffer>;
interface GenerateContentInput {
    imageBase64: string;
    mimeType: string;
    productType?: string;
    color?: string;
    category?: string;
}
export declare function generateProductContent(input: GenerateContentInput): Promise<{
    title: string;
    description: string;
}>;
export {};
//# sourceMappingURL=geminiService.d.ts.map