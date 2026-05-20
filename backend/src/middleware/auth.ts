import { Request, Response, NextFunction } from 'express'
import { supabase } from '../supabase'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    employeeStatus?: string
  }
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'No token provided' })

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) return res.status(401).json({ error: 'Invalid or expired token' })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, employee_status')
    .eq('id', user.id)
    .single()

  req.user = {
    id: user.id,
    email: user.email!,
    role: profile?.role ?? 'customer',
    employeeStatus: profile?.employee_status,
  }
  next()
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  }
}

export function requireApprovedEmployee(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' })
  if (req.user.role === 'admin') return next()
  if (req.user.role === 'employee' && req.user.employeeStatus === 'approved') return next()
  return res.status(403).json({ error: 'Employee account pending approval' })
}
