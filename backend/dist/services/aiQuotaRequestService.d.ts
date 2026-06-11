export type RequestType = 'extend' | 'decrease';
export type RequestUsageType = 'image' | 'content' | 'both';
export type RequestStatus = 'pending' | 'approved' | 'denied' | 'cancelled';
export interface CreateQuotaRequestInput {
    requestType: RequestType;
    usageType: RequestUsageType;
    requestedImageLimit?: number;
    requestedContentLimit?: number;
    reason: string;
}
export interface ReviewQuotaRequestInput {
    action: 'approve' | 'deny';
    applyLimits?: boolean;
    reviewNote?: string;
}
export interface QuotaRequest {
    id: string;
    requestedBy: string;
    requestType: RequestType;
    usageType: RequestUsageType;
    requestedImageLimit: number | null;
    requestedContentLimit: number | null;
    reason: string;
    status: RequestStatus;
    applyOnApprove: boolean | null;
    reviewNote: string | null;
    reviewedBy: string | null;
    reviewedAt: string | null;
    createdAt: string;
    requester?: {
        id: string;
        name: string;
        email: string;
    };
}
export declare function createRequest(adminId: string, input: CreateQuotaRequestInput): Promise<QuotaRequest>;
export declare function listRequestsForAdmin(adminId: string): Promise<QuotaRequest[]>;
export declare function listRequestsForSuperadmin(status?: RequestStatus): Promise<QuotaRequest[]>;
export declare function countPendingRequests(): Promise<number>;
export declare function reviewRequest(requestId: string, superadminId: string, input: ReviewQuotaRequestInput): Promise<QuotaRequest>;
//# sourceMappingURL=aiQuotaRequestService.d.ts.map