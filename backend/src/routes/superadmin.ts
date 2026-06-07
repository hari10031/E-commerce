import { Router, Response } from 'express'
import { body, validationResult } from 'express-validator'
import { authenticate, requireSuperAdmin, AuthRequest } from '../middleware/auth'
import {
  getQuotaStats,
  updateLimits,
  resetPeriodCounters,
} from '../services/aiQuotaService'
import {
  listRequestsForSuperadmin,
  reviewRequest,
  countPendingRequests,
  type RequestStatus,
} from '../services/aiQuotaRequestService'
import {
  listAdmins,
  getAdmin,
  createAdmin,
  updateAdmin,
  resetAdminPassword,
  setAdminActive,
  deleteAdmin,
} from '../controllers/adminManagementController'

const router = Router()

router.get('/admins', authenticate, requireSuperAdmin, listAdmins)
router.post('/admins', authenticate, requireSuperAdmin, createAdmin)
router.get('/admins/:id', authenticate, requireSuperAdmin, getAdmin)
router.patch('/admins/:id', authenticate, requireSuperAdmin, updateAdmin)
router.patch('/admins/:id/password', authenticate, requireSuperAdmin, resetAdminPassword)
router.patch('/admins/:id/status', authenticate, requireSuperAdmin, setAdminActive)
router.delete('/admins/:id', authenticate, requireSuperAdmin, deleteAdmin)

router.get('/ai-quota', authenticate, requireSuperAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const stats = await getQuotaStats()
    res.json(stats)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to load quota stats' })
  }
})

router.patch(
  '/ai-quota',
  authenticate,
  requireSuperAdmin,
  body('imageLimit').optional().isInt({ min: 0 }),
  body('contentLimit').optional().isInt({ min: 0 }),
  body('resetPeriod').optional().isIn(['lifetime', 'monthly']),
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { imageLimit, contentLimit, resetPeriod } = req.body
    if (imageLimit === undefined && contentLimit === undefined && resetPeriod === undefined) {
      return res.status(400).json({ error: 'Provide at least one field to update' })
    }

    try {
      const stats = await updateLimits(
        { imageLimit, contentLimit, resetPeriod },
        req.user!.id
      )
      res.json(stats)
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update limits' })
    }
  }
)

router.post(
  '/ai-quota/reset-period',
  authenticate,
  requireSuperAdmin,
  async (_req: AuthRequest, res: Response) => {
    try {
      const stats = await resetPeriodCounters()
      res.json(stats)
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to reset period' })
    }
  }
)

router.get(
  '/ai-quota/requests/pending-count',
  authenticate,
  requireSuperAdmin,
  async (_req: AuthRequest, res: Response) => {
    try {
      const count = await countPendingRequests()
      res.json({ count })
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to count requests' })
    }
  }
)

router.get(
  '/ai-quota/requests',
  authenticate,
  requireSuperAdmin,
  async (req: AuthRequest, res: Response) => {
    const status = req.query.status as RequestStatus | undefined
    const allowed: RequestStatus[] = ['pending', 'approved', 'denied', 'cancelled']
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status filter' })
    }

    try {
      const requests = await listRequestsForSuperadmin(status)
      res.json(requests)
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to load requests' })
    }
  }
)

router.patch(
  '/ai-quota/requests/:id',
  authenticate,
  requireSuperAdmin,
  body('action').isIn(['approve', 'deny']),
  body('applyLimits').optional().isBoolean(),
  body('reviewNote').optional().isString(),
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { action, applyLimits, reviewNote } = req.body

    try {
      const request = await reviewRequest(req.params.id, req.user!.id, {
        action,
        applyLimits: applyLimits === true,
        reviewNote,
      })
      res.json(request)
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to review request' })
    }
  }
)

export default router
