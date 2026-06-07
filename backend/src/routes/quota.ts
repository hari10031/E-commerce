import { Router, Response } from 'express'
import { body, validationResult } from 'express-validator'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'
import { getQuotaStats } from '../services/aiQuotaService'
import { createRequest, listRequestsForAdmin } from '../services/aiQuotaRequestService'

const router = Router()

router.get('/', authenticate, requireRole('admin'), async (_req: AuthRequest, res: Response) => {
  try {
    const stats = await getQuotaStats()
    res.json(stats)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to load quota stats' })
  }
})

router.get('/requests', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const requests = await listRequestsForAdmin(req.user!.id)
    res.json(requests)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to load requests' })
  }
})

router.post(
  '/requests',
  authenticate,
  requireRole('admin'),
  body('requestType').isIn(['extend', 'decrease']),
  body('usageType').isIn(['image', 'content', 'both']),
  body('requestedImageLimit').optional().isInt({ min: 0 }),
  body('requestedContentLimit').optional().isInt({ min: 0 }),
  body('reason').isString().trim().isLength({ min: 10 }),
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { requestType, usageType, requestedImageLimit, requestedContentLimit, reason } = req.body

    try {
      const request = await createRequest(req.user!.id, {
        requestType,
        usageType,
        requestedImageLimit:
          requestedImageLimit !== undefined ? Number(requestedImageLimit) : undefined,
        requestedContentLimit:
          requestedContentLimit !== undefined ? Number(requestedContentLimit) : undefined,
        reason,
      })
      res.status(201).json(request)
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to create request' })
    }
  }
)

export default router
