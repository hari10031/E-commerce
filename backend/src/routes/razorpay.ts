import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { abandonRazorpayOrder, createRazorpayOrder, verifyPayment } from '../controllers/orderController'

const router = Router()

router.post('/create', authenticate, createRazorpayOrder)
router.post('/verify', authenticate, verifyPayment)
router.post('/abandon', authenticate, abandonRazorpayOrder)

export default router
