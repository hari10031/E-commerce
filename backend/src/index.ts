import 'dotenv/config'

import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import pinoHttp from 'pino-http'

import { logger } from './logger'
import { errorHandler, notFound } from './middleware/errorHandler'
import { apiLimiter } from './middleware/rateLimiter'

import authRoutes from './routes/auth'
import categoryRoutes from './routes/categories'
import productRoutes from './routes/products'
import variantRoutes from './routes/variants'
import cartRoutes from './routes/cart'
import wishlistRoutes from './routes/wishlist'
import orderRoutes from './routes/orders'
import addressRoutes from './routes/addresses'
import uploadRoutes from './routes/upload'
import aiRoutes from './routes/ai'
import razorpayRoutes from './routes/razorpay'
import employeeRoutes from './routes/employees'
import analyticsRoutes from './routes/analytics'
import couponRoutes from './routes/coupons'
import notificationRoutes from './routes/notifications'
import salesRoutes from './routes/sales'

const app = express()

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

app.use(compression())

app.use(pinoHttp({ logger }))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api', apiLimiter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

app.use('/api/auth', authRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/products', productRoutes)
app.use('/api/variants', variantRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/addresses', addressRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/razorpay', razorpayRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/coupons', couponRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/sales', salesRoutes)

app.use(notFound)
app.use(errorHandler)

const PORT = parseInt(process.env.PORT ?? '4000')

const server = app.listen(PORT, () => {
  logger.info(`Backend running on http://localhost:${PORT}`)
})

const shutdown = async (signal: string) => {
  logger.info({ signal }, 'Received shutdown signal')
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

export default app
