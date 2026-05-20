import { Router, Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import multer from 'multer'
import { authenticate, requireApprovedEmployee } from '../middleware/auth'
import { aiLimiter } from '../middleware/rateLimiter'
import { uploadImage } from '../services/storageService'
import { generateProductImage } from '../services/geminiService'

const router = Router()
const client = new Anthropic()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

router.post(
  '/generate-content',
  aiLimiter,
  authenticate,
  requireApprovedEmployee,
  async (req: Request, res: Response) => {
    const { productType, category, colors, sizes } = req.body

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a product copywriter for an Indian e-commerce store selling ${productType}.
Generate a product listing for:
- Category: ${category}
- Colors: ${Array.isArray(colors) ? colors.join(', ') : colors}
- Sizes: ${Array.isArray(sizes) ? sizes.join(', ') : sizes}

Respond ONLY with valid JSON, no markdown or preamble:
{"title": "max 80 chars, SEO-friendly title", "description": "2-3 sentences covering fabric, occasion, and color appeal"}`,
        },
      ],
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    try {
      res.json(JSON.parse(text))
    } catch {
      res.status(500).json({ error: 'AI returned invalid JSON', raw: text })
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

    if (req.file) {
      sourceBuffer = req.file.buffer
      mimeType = req.file.mimetype
    } else if (req.body.imageUrl) {
      const resp = await fetch(req.body.imageUrl)
      if (!resp.ok) return res.status(400).json({ error: 'Could not fetch the source image' })
      sourceBuffer = Buffer.from(await resp.arrayBuffer())
      mimeType = resp.headers.get('content-type') || 'image/jpeg'
    } else {
      return res.status(400).json({ error: 'Provide an image file or imageUrl' })
    }

    const { productType, color, category } = req.body

    try {
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
