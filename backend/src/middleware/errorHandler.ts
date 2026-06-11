import { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { logger } from '../logger'

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large (max 10 MB)' })
    }
    return res.status(400).json({ error: err.message })
  }
  if (err.message === 'Only image files are allowed') {
    return res.status(415).json({ error: err.message })
  }

  logger.error({ err, url: req.url, method: req.method }, 'Unhandled error')
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  })
}

export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
}
