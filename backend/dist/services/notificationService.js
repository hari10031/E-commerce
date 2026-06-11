"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyAdminOrderPlaced = notifyAdminOrderPlaced;
exports.notifyCustomerStatusUpdate = notifyCustomerStatusUpdate;
exports.notifyEmployeeApproval = notifyEmployeeApproval;
const twilio_1 = __importDefault(require("twilio"));
const expo_server_sdk_1 = require("expo-server-sdk");
const supabase_1 = require("../supabase");
const logger_1 = require("../logger");
const queueService_1 = require("./queueService");
const twilioClient = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const expo = new expo_server_sdk_1.Expo({ useFcmV1: false });
async function sendExpoNotification(token, title, body, data) {
    if (!expo_server_sdk_1.Expo.isExpoPushToken(token))
        return;
    try {
        const [ticket] = await expo.sendPushNotificationsAsync([{ to: token, title, body, data }]);
        if ('details' in ticket)
            logger_1.logger.warn({ ticket }, 'Expo push failed');
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Expo push error');
    }
}
async function saveInAppNotification(userId, title, body) {
    await supabase_1.supabase.from('notifications').insert({ user_id: userId, title, body });
}
function notifyAdminOrderPlaced(order) {
    queueService_1.notificationQueue.enqueue(async () => {
        // WhatsApp via Twilio
        try {
            await twilioClient.messages.create({
                from: process.env.TWILIO_WHATSAPP_FROM,
                to: process.env.ADMIN_WHATSAPP_TO,
                body: `🛍️ New Order!\nID: #${order.id.slice(0, 8)}\nAmount: ₹${order.total_amount}\nItems: ${order.order_items?.length ?? 0}`,
            });
        }
        catch (err) {
            logger_1.logger.error({ err }, 'WhatsApp notification failed');
        }
        // Expo push to admin device
        const { data: admin } = await supabase_1.supabase
            .from('profiles')
            .select('fcm_token')
            .eq('role', 'admin')
            .not('fcm_token', 'is', null)
            .limit(1)
            .single();
        if (admin?.fcm_token) {
            await sendExpoNotification(admin.fcm_token, '🛍️ New Order!', `Order #${order.id.slice(0, 8)} — ₹${order.total_amount}`, { orderId: order.id, screen: 'OrderDetail' });
        }
    });
}
function notifyCustomerStatusUpdate(userId, orderId, status) {
    queueService_1.notificationQueue.enqueue(async () => {
        const title = 'Order Update';
        const body = `Your order #${orderId.slice(0, 8)} is now ${status.toUpperCase()}`;
        await saveInAppNotification(userId, title, body);
        const { data: profile } = await supabase_1.supabase
            .from('profiles')
            .select('fcm_token')
            .eq('id', userId)
            .single();
        if (profile?.fcm_token) {
            await sendExpoNotification(profile.fcm_token, title, body, { orderId, screen: 'OrderTracking' });
        }
    });
}
function notifyEmployeeApproval(userId, approved) {
    queueService_1.notificationQueue.enqueue(async () => {
        const title = approved ? '✅ Account Approved' : '❌ Account Rejected';
        const body = approved
            ? 'Your employee account has been approved. You can now log in.'
            : 'Your employee account registration was not approved.';
        await saveInAppNotification(userId, title, body);
        const { data: profile } = await supabase_1.supabase
            .from('profiles')
            .select('fcm_token')
            .eq('id', userId)
            .single();
        if (profile?.fcm_token) {
            await sendExpoNotification(profile.fcm_token, title, body);
        }
    });
}
//# sourceMappingURL=notificationService.js.map