"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationQueue = void 0;
const logger_1 = require("../logger");
// Lightweight in-process async queue — prevents notification failures
// from blocking HTTP responses. Replace with BullMQ + Redis for production scale.
class NotificationQueue {
    queue = [];
    running = false;
    enqueue(job) {
        this.queue.push(job);
        if (!this.running)
            this.drain();
    }
    async drain() {
        this.running = true;
        while (this.queue.length > 0) {
            const job = this.queue.shift();
            try {
                await job();
            }
            catch (err) {
                logger_1.logger.error({ err }, 'Notification job failed');
            }
        }
        this.running = false;
    }
}
exports.notificationQueue = new NotificationQueue();
//# sourceMappingURL=queueService.js.map