"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// cluster.ts — Multi-core support for production (run with: node dist/cluster.js)
// Spawns one worker per CPU core. PM2 can manage this automatically via ecosystem.config.js
const cluster_1 = __importDefault(require("cluster"));
const os_1 = __importDefault(require("os"));
const logger_1 = require("./logger");
const WORKERS = parseInt(process.env.WEB_CONCURRENCY ?? '') || os_1.default.cpus().length;
if (cluster_1.default.isPrimary) {
    logger_1.logger.info(`Primary ${process.pid} is running — spawning ${WORKERS} workers`);
    for (let i = 0; i < WORKERS; i++)
        cluster_1.default.fork();
    cluster_1.default.on('exit', (worker, code, signal) => {
        logger_1.logger.warn({ pid: worker.process.pid, code, signal }, 'Worker died — respawning');
        cluster_1.default.fork();
    });
}
else {
    // Each worker imports and runs the main app
    require('./index');
    logger_1.logger.info(`Worker ${process.pid} started`);
}
//# sourceMappingURL=cluster.js.map