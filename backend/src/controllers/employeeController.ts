import { Response } from 'express'
import { supabase } from '../supabase'
import { AuthRequest } from '../middleware/auth'
import { notifyEmployeeApproval } from '../services/notificationService'

export async function getEmployees(req: AuthRequest, res: Response) {
  const { status, page = '1', limit = '20' } = req.query

  let query = supabase
    .from('profiles')
    .select('id, name, email:id, phone, employee_status, created_at, updated_at', { count: 'exact' })
    .eq('role', 'employee')
    .order('created_at', { ascending: false })
    .range((+page - 1) * +limit, +page * +limit - 1)

  if (status) query = query.eq('employee_status', status as string)

  const { data, error, count } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data, count, page: +page, limit: +limit })
}

export async function approveOrRejectEmployee(req: AuthRequest, res: Response) {
  const { action } = req.body
  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'action must be "approve" or "reject"' })
  }

  const status = action === 'approve' ? 'approved' : 'rejected'

  const { data, error } = await supabase
    .from('profiles')
    .update({ employee_status: status, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('role', 'employee')
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })

  notifyEmployeeApproval(req.params.id, action === 'approve')
  res.json(data)
}

export async function removeEmployee(req: AuthRequest, res: Response) {
  const { error } = await supabase
    .from('profiles')
    .update({ role: 'customer', employee_status: null, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)

  if (error) return res.status(400).json({ error: error.message })
  res.json({ success: true })
}
