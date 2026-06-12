import type { NextFunction, Request, Response } from 'express'
import { logger } from '../logger'

const SLOW_MS = Number.parseInt(process.env.SLOW_REQUEST_MS ?? '100', 10)
const VERY_SLOW_MS = Number.parseInt(process.env.VERY_SLOW_REQUEST_MS ?? '500', 10)

export function requestTiming(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint()

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000
    const rounded = Math.round(durationMs * 10) / 10

    if (req.path === '/health') return

    const meta = {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: rounded,
    }

    if (durationMs >= VERY_SLOW_MS) {
      logger.warn(meta, 'very slow request')
    } else if (durationMs >= SLOW_MS) {
      logger.info(meta, 'slow request')
    }
  })

  next()
}
