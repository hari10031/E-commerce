import { Router, Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import { supabase, supabaseAuth } from '../supabase'
import { authenticate, AuthRequest } from '../middleware/auth'
import { authLimiter } from '../middleware/rateLimiter'

const router = Router()

router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('name').trim().notEmpty(),
    body('role').optional().isIn(['customer', 'employee']),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { email, password, name, phone, role = 'customer' } = req.body

    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone: phone ?? null,
          role,
          ...(role === 'employee' ? { employee_status: 'pending' } : {}),
        },
      },
    })

    if (error) return res.status(400).json({ error: error.message })

    // Sync extra fields to profiles table
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name,
        phone: phone ?? null,
        role,
        ...(role === 'employee' ? { employee_status: 'pending' } : {}),
      })
    }

    res.status(201).json({ user: data.user, session: data.session })
  }
)

router.post(
  '/login',
  authLimiter,
  [body('email').isEmail(), body('password').notEmpty()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { email, password } = req.body

    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password })
    if (error) return res.status(401).json({ error: error.message })

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, role, employee_status, phone')
      .eq('id', data.user.id)
      .single()

    res.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: { ...profile, email: data.user.email },
    })
  }
)

// Exchange a refresh token for a fresh access token. Supabase access tokens
// expire after ~1h; without this the app would 401 and log the user out.
router.post(
  '/refresh',
  authLimiter,
  [body('refreshToken').notEmpty()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { refreshToken } = req.body
    const { data, error } = await supabaseAuth.auth.refreshSession({ refresh_token: refreshToken })
    if (error || !data.session) {
      return res.status(401).json({ error: error?.message ?? 'Could not refresh session' })
    }

    res.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    })
  }
)

router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (token) await supabase.auth.admin.signOut(token)
  res.json({ success: true })
})

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.user!.id)
    .single()

  res.json(profile)
})

router.patch('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const { name, phone, whatsapp } = req.body
  const updates: Record<string, unknown> = {}
  if (name) updates.name = name
  if (phone !== undefined) updates.phone = phone
  if (whatsapp !== undefined) updates.whatsapp = whatsapp
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', req.user!.id)
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

router.patch('/push-token', authenticate, async (req: AuthRequest, res: Response) => {
  const { fcmToken } = req.body
  if (!fcmToken) return res.status(400).json({ error: 'fcmToken required' })

  await supabase
    .from('profiles')
    .update({ fcm_token: fcmToken, updated_at: new Date().toISOString() })
    .eq('id', req.user!.id)

  res.json({ success: true })
})

export default router
