import { Router, Request, Response } from 'express'
import { supabase } from '../supabase'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()

// Public: validate a coupon code
router.get('/validate/:code', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('coupons')
    .select('code, discount_pct, expires_at, max_uses, used_count, active')
    .eq('code', req.params.code.toUpperCase())
    .single()

  if (error || !data) return res.status(404).json({ error: 'Invalid coupon code' })
  if (!data.active) return res.status(400).json({ error: 'Coupon is not active' })
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Coupon has expired' })
  }
  if (data.max_uses && data.used_count >= data.max_uses) {
    return res.status(400).json({ error: 'Coupon usage limit reached' })
  }

  res.json({ code: data.code, discount_pct: data.discount_pct })
})

// Admin CRUD
router.get('/', authenticate, requireRole('admin'), async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const { code, discount_pct, max_uses, expires_at } = req.body

  const { data, error } = await supabase
    .from('coupons')
    .insert({
      code: code.toUpperCase(),
      discount_pct,
      max_uses: max_uses || null,
      expires_at: expires_at || null,
    })
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data)
})

router.patch('/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const { active, discount_pct, max_uses, expires_at } = req.body
  const updates: Record<string, unknown> = {}
  if (active !== undefined) updates.active = active
  if (discount_pct !== undefined) updates.discount_pct = discount_pct
  if (max_uses !== undefined) updates.max_uses = max_uses
  if (expires_at !== undefined) updates.expires_at = expires_at

  const { data, error } = await supabase
    .from('coupons')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

export default router
