import { Router, Response } from 'express'
import sharp from 'sharp'
import multer from 'multer'
import { authenticate, requireApprovedEmployee, AuthRequest } from '../middleware/auth'
import { aiLimiter } from '../middleware/rateLimiter'
import { uploadImage } from '../services/storageService'
import { generateProductImage, generateProductContent } from '../services/geminiService'
import { optimizeSourceImage } from '../services/imagePrep'
import { consumeQuota, refundQuota, QuotaExceededError } from '../services/aiQuotaService'
import { fetchWithTimeout } from '../lib/fetchWithTimeout'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

async function loadImageFromUrl(imageUrl: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const resp = await fetchWithTimeout(imageUrl, {}, 15_000)
  if (!resp.ok) throw new Error('Could not fetch the source image')
  const buffer = Buffer.from(await resp.arrayBuffer())
  const optimized = await optimizeSourceImage(buffer)
  return { buffer: optimized.buffer, mimeType: optimized.mimeType }
}

router.post(
  '/generate-content',
  aiLimiter,
  authenticate,
  requireApprovedEmployee,
  upload.single('image'),
  async (req: AuthRequest, res: Response) => {
    const { productType, color, category, imageUrl } = req.body
    let quotaConsumed = false

    try {
      await consumeQuota('content', req.user?.id)
      quotaConsumed = true

      let buffer: Buffer
      let mimeType: string

      if (req.file) {
        const optimized = await optimizeSourceImage(req.file.buffer)
        buffer = optimized.buffer
        mimeType = optimized.mimeType
      } else if (imageUrl) {
        const loaded = await loadImageFromUrl(imageUrl)
        buffer = loaded.buffer
        mimeType = loaded.mimeType
      } else {
        return res.status(400).json({ error: 'Provide an image file or imageUrl' })
      }

      const content = await generateProductContent({
        imageBase64: buffer.toString('base64'),
        mimeType,
        productType,
        color,
        category,
      })
      res.json(content)
    } catch (err) {
      if (quotaConsumed) await refundQuota('content').catch(() => {})
      if (err instanceof QuotaExceededError) {
        return res.status(429).json({ error: err.message })
      }
      res.status(502).json({ error: err instanceof Error ? err.message : 'Content generation failed' })
    }
  }
)

router.post(
  '/generate-image',
  aiLimiter,
  authenticate,
  requireApprovedEmployee,
  upload.single('image'),
  async (req: AuthRequest, res: Response) => {
    let sourceBuffer: Buffer
    let mimeType: string
    let quotaConsumed = false

    const imageUrls: string[] = Array.isArray(req.body.imageUrls)
      ? req.body.imageUrls.filter((url: string) => typeof url === 'string' && url.trim().length > 0)
      : []

    if (!req.file && !req.body.imageUrl && imageUrls.length === 0) {
      return res.status(400).json({ error: 'Provide an image file, imageUrl, or imageUrls' })
    }

    const { productType, color, category } = req.body
    const t0 = Date.now()
    const timing = { prepareMs: 0, geminiMs: 0, uploadMs: 0, totalMs: 0 }

    try {
      await consumeQuota('image', req.user?.id)
      quotaConsumed = true

      if (imageUrls.length > 0) {
        const prepStart = Date.now()
        const urls = imageUrls.slice(0, 7)
        const buffers = await Promise.all(
          urls.map(async (url) => {
            const loaded = await loadImageFromUrl(url)
            return loaded.buffer
          })
        )
        const cols = urls.length <= 1 ? 1 : urls.length <= 4 ? 2 : 3
        const rows = Math.ceil(urls.length / cols)
        const cellWidth = 480
        const cellHeight = 640
        const base = sharp({
          create: {
            width: cols * cellWidth,
            height: rows * cellHeight,
            channels: 3,
            background: '#ffffff',
          },
        })
        const composites = await Promise.all(
          buffers.map(async (buffer, idx) => ({
            input: await sharp(buffer)
              .resize(cellWidth, cellHeight, { fit: 'cover' })
              .jpeg({ quality: 90 })
              .toBuffer(),
            left: (idx % cols) * cellWidth,
            top: Math.floor(idx / cols) * cellHeight,
          }))
        )
        sourceBuffer = await base.composite(composites).jpeg({ quality: 85 }).toBuffer()
        mimeType = 'image/jpeg'
        timing.prepareMs = Date.now() - prepStart
      } else if (req.file) {
        const prepStart = Date.now()
        const optimized = await optimizeSourceImage(req.file.buffer)
        sourceBuffer = optimized.buffer
        mimeType = optimized.mimeType
        timing.prepareMs = Date.now() - prepStart
      } else {
        const prepStart = Date.now()
        const loaded = await loadImageFromUrl(req.body.imageUrl)
        sourceBuffer = loaded.buffer
        mimeType = loaded.mimeType
        timing.prepareMs = Date.now() - prepStart
      }

      if (imageUrls.length > 0) {
        const optStart = Date.now()
        const optimized = await optimizeSourceImage(sourceBuffer)
        sourceBuffer = optimized.buffer
        mimeType = optimized.mimeType
        timing.prepareMs += Date.now() - optStart
      }

      const geminiStart = Date.now()
      const generated = await generateProductImage({
        imageBase64: sourceBuffer.toString('base64'),
        mimeType,
        productType,
        color,
        category,
      })
      timing.geminiMs = Date.now() - geminiStart

      const uploadStart = Date.now()
      const safeColor = (color || 'product').toString().replace(/\s+/g, '-')
      const url = await uploadImage(generated, `ai-${safeColor}.png`, 'product-images')
      timing.uploadMs = Date.now() - uploadStart
      timing.totalMs = Date.now() - t0

      res.json({ url, timing, productType: productType || 'saree' })
    } catch (err) {
      if (quotaConsumed) await refundQuota('image').catch(() => {})
      if (err instanceof QuotaExceededError) {
        return res.status(429).json({ error: err.message })
      }
      res.status(502).json({ error: err instanceof Error ? err.message : 'Image generation failed' })
    }
  }
)

export default router
