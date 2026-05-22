import { Router, Request, Response } from 'express'
import sharp from 'sharp'
import multer from 'multer'
import { authenticate, requireApprovedEmployee } from '../middleware/auth'
import { aiLimiter } from '../middleware/rateLimiter'
import { uploadImage } from '../services/storageService'
import { generateProductImage, generateProductContent } from '../services/geminiService'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

// Writes a product title + description from the product photo, via Gemini.
// Accepts a multipart `image` file or a JSON `imageUrl`.
router.post(
  '/generate-content',
  aiLimiter,
  authenticate,
  requireApprovedEmployee,
  upload.single('image'),
  async (req: Request, res: Response) => {
    const { productType, color, category, imageUrl } = req.body

    try {
      let buffer: Buffer
      let mimeType: string

      if (req.file) {
        buffer = req.file.buffer
        mimeType = req.file.mimetype
      } else if (imageUrl) {
        const resp = await fetch(imageUrl)
        if (!resp.ok) return res.status(400).json({ error: 'Could not fetch the source image' })
        buffer = Buffer.from(await resp.arrayBuffer())
        mimeType = resp.headers.get('content-type') || 'image/jpeg'
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
      res.status(502).json({ error: err instanceof Error ? err.message : 'Content generation failed' })
    }
  }
)

// "Nano banana" image generation — turns an uploaded product photo into a
// clean studio product image via Gemini 2.5 Flash Image.
// Accepts either a multipart `image` file or a JSON `imageUrl`.
router.post(
  '/generate-image',
  aiLimiter,
  authenticate,
  requireApprovedEmployee,
  upload.single('image'),
  async (req: Request, res: Response) => {
    let sourceBuffer: Buffer
    let mimeType: string

    const imageUrls: string[] = Array.isArray(req.body.imageUrls)
      ? req.body.imageUrls.filter((url: string) => typeof url === 'string' && url.trim().length > 0)
      : []

    if (!req.file && !req.body.imageUrl && imageUrls.length === 0) {
      return res.status(400).json({ error: 'Provide an image file, imageUrl, or imageUrls' })
    }

    const { productType, color, category } = req.body

    try {
      if (imageUrls.length > 0) {
        const urls = imageUrls.slice(0, 4)
        const buffers = await Promise.all(
          urls.map(async (url) => {
            const resp = await fetch(url)
            if (!resp.ok) throw new Error('Could not fetch the source image')
            return Buffer.from(await resp.arrayBuffer())
          })
        )
        const cols = urls.length > 1 ? 2 : 1
        const rows = Math.ceil(urls.length / cols)
        const cellWidth = 600
        const cellHeight = 800
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
        sourceBuffer = await base.composite(composites).jpeg({ quality: 90 }).toBuffer()
        mimeType = 'image/jpeg'
      } else if (req.file) {
        sourceBuffer = req.file.buffer
        mimeType = req.file.mimetype
      } else {
        const resp = await fetch(req.body.imageUrl)
        if (!resp.ok) return res.status(400).json({ error: 'Could not fetch the source image' })
        sourceBuffer = Buffer.from(await resp.arrayBuffer())
        mimeType = resp.headers.get('content-type') || 'image/jpeg'
      }

      const generated = await generateProductImage({
        imageBase64: sourceBuffer.toString('base64'),
        mimeType,
        productType,
        color,
        category,
      })
      const safeColor = (color || 'product').toString().replace(/\s+/g, '-')
      const url = await uploadImage(generated, `ai-${safeColor}.png`, 'product-images')
      res.json({ url })
    } catch (err) {
      res.status(502).json({ error: err instanceof Error ? err.message : 'Image generation failed' })
    }
  }
)

export default router
