import twilio from 'twilio'
import { Expo } from 'expo-server-sdk'
import { supabase } from '../supabase'
import { logger } from '../logger'
import { notificationQueue } from './queueService'

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
const expo = new Expo({ useFcmV1: false })

async function sendExpoNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  if (!Expo.isExpoPushToken(token)) return
  try {
    const [ticket] = await expo.sendPushNotificationsAsync([{ to: token, title, body, data }])
    if ('details' in ticket) logger.warn({ ticket }, 'Expo push failed')
  } catch (err) {
    logger.error({ err }, 'Expo push error')
  }
}

async function saveInAppNotification(userId: string, title: string, body: string): Promise<void> {
  await supabase.from('notifications').insert({ user_id: userId, title, body })
}

export function notifyAdminOrderPlaced(order: {
  id: string
  total_amount: number
  order_items?: unknown[]
}): void {
  notificationQueue.enqueue(async () => {
    // WhatsApp via Twilio
    try {
      await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM!,
        to: process.env.ADMIN_WHATSAPP_TO!,
        body: `🛍️ New Order!\nID: #${order.id.slice(0, 8)}\nAmount: ₹${order.total_amount}\nItems: ${order.order_items?.length ?? 0}`,
      })
    } catch (err) {
      logger.error({ err }, 'WhatsApp notification failed')
    }

    const title = '🛍️ New Order!'
    const body = `Order #${order.id.slice(0, 8)} — ₹${order.total_amount}`

    // All admins + approved employees
    const { data: staff, error } = await supabase
      .from('profiles')
      .select('id, role, employee_status, fcm_token')
      .in('role', ['admin', 'employee'])

    if (error || !staff?.length) {
      if (error) logger.error({ error }, 'Failed to load staff for order notification')
      return
    }

    const recipients = staff.filter(
      (p) => p.role === 'admin' || p.employee_status === 'approved'
    )
    if (!recipients.length) return

    // In-app inbox row per staff member
    const { error: insertErr } = await supabase.from('notifications').insert(
      recipients.map((p) => ({ user_id: p.id, title, body }))
    )
    if (insertErr) logger.error({ error: insertErr }, 'Failed to insert order notifications')

    // Batched Expo push to every staff device
    const messages = recipients
      .filter((p) => p.fcm_token && Expo.isExpoPushToken(p.fcm_token))
      .map((p) => ({
        to: p.fcm_token as string,
        title,
        body,
        sound: 'default' as const,
        data: { type: 'order', orderId: order.id, screen: 'OrderDetail' },
      }))

    if (messages.length) {
      try {
        for (const chunk of expo.chunkPushNotifications(messages)) {
          const tickets = await expo.sendPushNotificationsAsync(chunk)
          for (const ticket of tickets) {
            if (ticket.status === 'error') logger.warn({ ticket }, 'Expo push failed')
          }
        }
      } catch (err) {
        logger.error({ err }, 'Expo push error')
      }
    }
  })
}

export function notifyCustomerStatusUpdate(userId: string, orderId: string, status: string): void {
  notificationQueue.enqueue(async () => {
    const title = 'Order Update'
    const body = `Your order #${orderId.slice(0, 8)} is now ${status.toUpperCase()}`

    await saveInAppNotification(userId, title, body)

    const { data: profile } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', userId)
      .single()

    if (profile?.fcm_token) {
      await sendExpoNotification(profile.fcm_token, title, body, { orderId, screen: 'OrderTracking' })
    }
  })
}

export function notifyEmployeeApproval(userId: string, approved: boolean): void {
  notificationQueue.enqueue(async () => {
    const title = approved ? '✅ Account Approved' : '❌ Account Rejected'
    const body = approved
      ? 'Your employee account has been approved. You can now log in.'
      : 'Your employee account registration was not approved.'

    await saveInAppNotification(userId, title, body)

    const { data: profile } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', userId)
      .single()

    if (profile?.fcm_token) {
      await sendExpoNotification(profile.fcm_token, title, body)
    }
  })
}
