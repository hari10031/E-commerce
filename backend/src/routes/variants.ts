import { Router, Response } from 'express'
import { body, validationResult } from 'express-validator'
import { supabase } from '../supabase'
import { authenticate, requireRole, requireApprovedEmployee, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/product/:productId', async (req, res) => {
  const { data, error } = await supabase
    .from('variants')
    .select('*')
    .eq('product_id', req.params.productId)
    .order('created_at')

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post(
  '/',
  authenticate,
  requireApprovedEmployee,
  [
    body('product_id').isUUID(),
    body('quantity').isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { product_id, color, size, quantity, sku, image_url } = req.body

    const { data, error } = await supabase
      .from('variants')
      .insert({ product_id, color, size, quantity, sku, image_url })
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    res.status(201).json(data)
  }
)

router.put('/product/:productId/bulk', authenticate, requireApprovedEmployee, async (req: AuthRequest, res: Response) => {
  const { variants } = req.body as { variants: Array<{ color: string; size: string; quantity: number; sku?: string; image_url?: string }> }

  if (!Array.isArray(variants)) return res.status(400).json({ error: 'variants must be an array' })

  const rows = variants.map((v) => ({
    product_id: req.params.productId,
    color: v.color,
    size: v.size,
    quantity: v.quantity,
    sku: v.sku ?? `${req.params.productId.slice(0, 6)}-${v.color}-${v.size}`.toLowerCase(),
    image_url: v.image_url ?? null,
  }))

  const { data, error } = await supabase
    .from('variants')
    .upsert(rows, { onConflict: 'sku' })
    .select()

  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

router.patch('/:id', authenticate, requireApprovedEmployee, async (req: AuthRequest, res: Response) => {
  const { quantity, color, size, image_url } = req.body
  const updates: Record<string, unknown> = {}
  if (quantity !== undefined) updates.quantity = quantity
  if (color) updates.color = color
  if (size) updates.size = size
  if (image_url !== undefined) updates.image_url = image_url

  const { data, error } = await supabase
    .from('variants')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

router.delete('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const { error } = await supabase.from('variants').delete().eq('id', req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ success: true })
})

export default router
