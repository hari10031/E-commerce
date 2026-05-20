import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import {
  getDashboardStats,
  getSalesTimeline,
  getInventory,
  getCategorySales,
  getCategoryInventory,
  getEmployeePerformance,
  getSalesSummary,
} from '../controllers/analyticsController'

const router = Router()

router.use(authenticate, requireRole('admin'))

router.get('/dashboard', getDashboardStats)
router.get('/sales', getSalesTimeline)
router.get('/inventory', getInventory)
router.get('/category-sales', getCategorySales)
router.get('/category-inventory', getCategoryInventory)
router.get('/employee-performance', getEmployeePerformance)
router.get('/sales-summary', getSalesSummary)

export default router
