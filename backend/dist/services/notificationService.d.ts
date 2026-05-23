export declare function notifyAdminOrderPlaced(order: {
    id: string;
    total_amount: number;
    order_items?: unknown[];
}): void;
export declare function notifyCustomerStatusUpdate(userId: string, orderId: string, status: string): void;
export declare function notifyEmployeeApproval(userId: string, approved: boolean): void;
//# sourceMappingURL=notificationService.d.ts.map