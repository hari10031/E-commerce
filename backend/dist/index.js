"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const pino_http_1 = __importDefault(require("pino-http"));
const logger_1 = require("./logger");
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const auth_1 = __importDefault(require("./routes/auth"));
const categories_1 = __importDefault(require("./routes/categories"));
const products_1 = __importDefault(require("./routes/products"));
const variants_1 = __importDefault(require("./routes/variants"));
const cart_1 = __importDefault(require("./routes/cart"));
const wishlist_1 = __importDefault(require("./routes/wishlist"));
const orders_1 = __importDefault(require("./routes/orders"));
const addresses_1 = __importDefault(require("./routes/addresses"));
const upload_1 = __importDefault(require("./routes/upload"));
const ai_1 = __importDefault(require("./routes/ai"));
const razorpay_1 = __importDefault(require("./routes/razorpay"));
const employees_1 = __importDefault(require("./routes/employees"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const coupons_1 = __importDefault(require("./routes/coupons"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const sales_1 = __importDefault(require("./routes/sales"));
const users_1 = __importDefault(require("./routes/users"));
const shipments_1 = __importDefault(require("./routes/shipments"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use((0, compression_1.default)());
app.use((0, pino_http_1.default)({ logger: logger_1.logger }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api', rateLimiter_1.apiLimiter);
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});
app.use('/api/auth', auth_1.default);
app.use('/api/categories', categories_1.default);
app.use('/api/products', products_1.default);
app.use('/api/variants', variants_1.default);
app.use('/api/cart', cart_1.default);
app.use('/api/wishlist', wishlist_1.default);
app.use('/api/orders', orders_1.default);
app.use('/api/addresses', addresses_1.default);
app.use('/api/upload', upload_1.default);
app.use('/api/ai', ai_1.default);
app.use('/api/razorpay', razorpay_1.default);
app.use('/api/employees', employees_1.default);
app.use('/api/analytics', analytics_1.default);
app.use('/api/coupons', coupons_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/sales', sales_1.default);
app.use('/api/users', users_1.default);
app.use('/api/shipments', shipments_1.default);
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
const PORT = Number.parseInt(process.env.PORT ?? '4000', 10);
const server = app.listen(PORT);
server.once('listening', () => {
    logger_1.logger.info(`Backend running on http://localhost:${PORT}`);
});
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        logger_1.logger.error({ port: PORT, err }, `Port ${PORT} is already in use (another backend or app is running). Stop that process or set PORT to a free port in backend/.env, then try again. On Windows: netstat -ano | findstr :${PORT} then taskkill /PID <pid> /F`);
    }
    else {
        logger_1.logger.error({ err }, 'Server failed to start');
    }
    process.exit(1);
});
const shutdown = async (signal) => {
    logger_1.logger.info({ signal }, 'Received shutdown signal');
    server.close(() => {
        logger_1.logger.info('Server closed');
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
exports.default = app;
//# sourceMappingURL=index.js.map