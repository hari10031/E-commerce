type JobFn = () => Promise<void>;
declare class NotificationQueue {
    private queue;
    private running;
    enqueue(job: JobFn): void;
    private drain;
}
export declare const notificationQueue: NotificationQueue;
export {};
//# sourceMappingURL=queueService.d.ts.map