import { Response } from 'express'
import { supabase } from '../supabase'
import { AuthRequest } from '../middleware/auth'

const cartSelect = `
  id, quantity,
  product:products(id, title, base_price, discount_pct, type,
    images:product_images(url, is_primary, color)),
  variant:variants(id, color, size, quantity, sku, image_url)
`

export async function getCart(req: AuthRequest, res: Response) {
  const { data, error } = await supabase
    .from('cart_items')
    .select(cartSelect)
    .eq('user_id', req.user!.id)

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function addToCart(req: AuthRequest, res: Response) {
  const { product_id, variant_id, quantity = 1 } = req.body

  const { data: variant } = await supabase
    .from('variants')
    .select('quantity')
    .eq('id', variant_id)
    .single()

  if (!variant || variant.quantity < 1) {
    return res.status(400).json({ error: 'Item out of stock' })
  }

  const { data, error } = await supabase
    .from('cart_items')
    .upsert(
      { user_id: req.user!.id, product_id, variant_id, quantity },
      { onConflict: 'user_id,variant_id', ignoreDuplicates: false }
    )
    .select(cartSelect)
    .single()

  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data)
}

export async function updateCartItem(req: AuthRequest, res: Response) {
  const { quantity } = req.body
  if (!quantity || quantity < 1) {
    return res.status(400).json({ error: 'Quantity must be >= 1' })
  }

  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)
    .select(cartSelect)
    .single()

  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}

export async function removeFromCart(req: AuthRequest, res: Response) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)

  if (error) return res.status(400).json({ error: error.message })
  res.json({ success: true })
}

export async function clearCart(req: AuthRequest, res: Response) {
  await supabase.from('cart_items').delete().eq('user_id', req.user!.id)
  res.json({ success: true })
}
