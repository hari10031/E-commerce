export type AiUsageType = 'image' | 'content';
export type ResetPeriod = 'lifetime' | 'monthly';
export declare class QuotaExceededError extends Error {
    readonly usageType: AiUsageType;
    constructor(usageType: AiUsageType);
}
export interface QuotaBucket {
    used: number;
    limit: number;
    remaining: number;
}
export interface QuotaStats {
    images: QuotaBucket;
    content: QuotaBucket;
    resetPeriod: ResetPeriod;
    periodStart: string;
    updatedAt: string | null;
}
export declare function getQuotaStats(): Promise<QuotaStats>;
export declare function consumeQuota(type: AiUsageType, userId?: string): Promise<void>;
/** Refund one quota unit when generation fails after consume. */
export declare function refundQuota(type: AiUsageType): Promise<void>;
export interface UpdateLimitsInput {
    imageLimit?: number;
    contentLimit?: number;
    resetPeriod?: ResetPeriod;
}
export declare function updateLimits(input: UpdateLimitsInput, updatedBy: string): Promise<QuotaStats>;
export declare function resetPeriodCounters(): Promise<QuotaStats>;
//# sourceMappingURL=aiQuotaService.d.ts.map