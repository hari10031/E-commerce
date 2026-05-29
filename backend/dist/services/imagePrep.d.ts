/** Shrinks source photos before Gemini — smaller payload, faster API round-trip. */
export declare function optimizeSourceImage(buffer: Buffer): Promise<{
    buffer: Buffer;
    mimeType: string;
}>;
//# sourceMappingURL=imagePrep.d.ts.map