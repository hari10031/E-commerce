import { supabase } from '../supabase'
import { getQuotaStats, updateLimits } from './aiQuotaService'

export type RequestType = 'extend' | 'decrease'
export type RequestUsageType = 'image' | 'content' | 'both'
export type RequestStatus = 'pending' | 'approved' | 'denied' | 'cancelled'

export interface CreateQuotaRequestInput {
  requestType: RequestType
  usageType: RequestUsageType
  requestedImageLimit?: number
  requestedContentLimit?: number
  reason: string
}

export interface ReviewQuotaRequestInput {
  action: 'approve' | 'deny'
  applyLimits?: boolean
  reviewNote?: string
}

interface QuotaRequestRow {
  id: string
  requested_by: string
  request_type: RequestType
  usage_type: RequestUsageType
  requested_image_limit: number | null
  requested_content_limit: number | null
  reason: string
  status: RequestStatus
  apply_on_approve: boolean | null
  review_note: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  requester?: { id: string; name: string; email: string } | null
}

export interface QuotaRequest {
  id: string
  requestedBy: string
  requestType: RequestType
  usageType: RequestUsageType
  requestedImageLimit: number | null
  requestedContentLimit: number | null
  reason: string
  status: RequestStatus
  applyOnApprove: boolean | null
  reviewNote: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  requester?: { id: string; name: string; email: string }
}

function toRequest(row: QuotaRequestRow): QuotaRequest {
  const req: QuotaRequest = {
    id: row.id,
    requestedBy: row.requested_by,
    requestType: row.request_type,
    usageType: row.usage_type,
    requestedImageLimit: row.requested_image_limit,
    requestedContentLimit: row.requested_content_limit,
    reason: row.reason,
    status: row.status,
    applyOnApprove: row.apply_on_approve,
    reviewNote: row.review_note,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
  }
  if (row.requester) {
    req.requester = {
      id: row.requester.id,
      name: row.requester.name,
      email: row.requester.email,
    }
  }
  return req
}

function affectsImage(usageType: RequestUsageType): boolean {
  return usageType === 'image' || usageType === 'both'
}

function affectsContent(usageType: RequestUsageType): boolean {
  return usageType === 'content' || usageType === 'both'
}

async function validateRequestInput(input: CreateQuotaRequestInput): Promise<void> {
  const reason = input.reason?.trim()
  if (!reason || reason.length < 10) {
    throw new Error('Reason must be at least 10 characters')
  }

  const stats = await getQuotaStats()

  if (affectsImage(input.usageType)) {
    if (input.requestedImageLimit === undefined || !Number.isInteger(input.requestedImageLimit)) {
      throw new Error('requestedImageLimit is required for image quota requests')
    }
    if (input.requestedImageLimit < 0) {
      throw new Error('requestedImageLimit must be non-negative')
    }
    if (input.requestType === 'extend' && input.requestedImageLimit <= stats.images.limit) {
      throw new Error('Extend request must propose a limit higher than the current image limit')
    }
    if (input.requestType === 'decrease') {
      if (input.requestedImageLimit >= stats.images.limit) {
        throw new Error('Decrease request must propose a limit lower than the current image limit')
      }
      if (input.requestedImageLimit < stats.images.used) {
        throw new Error('Image limit cannot be set below current usage')
      }
    }
  }

  if (affectsContent(input.usageType)) {
    if (input.requestedContentLimit === undefined || !Number.isInteger(input.requestedContentLimit)) {
      throw new Error('requestedContentLimit is required for content quota requests')
    }
    if (input.requestedContentLimit < 0) {
      throw new Error('requestedContentLimit must be non-negative')
    }
    if (input.requestType === 'extend' && input.requestedContentLimit <= stats.content.limit) {
      throw new Error('Extend request must propose a limit higher than the current content limit')
    }
    if (input.requestType === 'decrease') {
      if (input.requestedContentLimit >= stats.content.limit) {
        throw new Error('Decrease request must propose a limit lower than the current content limit')
      }
      if (input.requestedContentLimit < stats.content.used) {
        throw new Error('Content limit cannot be set below current usage')
      }
    }
  }
}

export async function createRequest(
  adminId: string,
  input: CreateQuotaRequestInput
): Promise<QuotaRequest> {
  await validateRequestInput(input)

  const { data: pending } = await supabase
    .from('ai_quota_requests')
    .select('id')
    .eq('requested_by', adminId)
    .eq('status', 'pending')
    .maybeSingle()

  if (pending) {
    throw new Error('You already have a pending quota request. Wait for review or cancel it first.')
  }

  const { data, error } = await supabase
    .from('ai_quota_requests')
    .insert({
      requested_by: adminId,
      request_type: input.requestType,
      usage_type: input.usageType,
      requested_image_limit: affectsImage(input.usageType) ? input.requestedImageLimit : null,
      requested_content_limit: affectsContent(input.usageType) ? input.requestedContentLimit : null,
      reason: input.reason.trim(),
    })
    .select('*')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to create quota request')
  return toRequest(data as QuotaRequestRow)
}

export async function listRequestsForAdmin(adminId: string): Promise<QuotaRequest[]> {
  const { data, error } = await supabase
    .from('ai_quota_requests')
    .select('*')
    .eq('requested_by', adminId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => toRequest(row as QuotaRequestRow))
}

export async function listRequestsForSuperadmin(status?: RequestStatus): Promise<QuotaRequest[]> {
  let query = supabase
    .from('ai_quota_requests')
    .select('*, requester:profiles!ai_quota_requests_requested_by_fkey(id, name)')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const rows = data ?? []
  const requesterIds = [...new Set(rows.map((row) => row.requested_by as string))]
  const emailById = new Map<string, string>()

  await Promise.all(
    requesterIds.map(async (id) => {
      const { data: authUser } = await supabase.auth.admin.getUserById(id)
      if (authUser?.user?.email) emailById.set(id, authUser.user.email)
    })
  )

  return rows.map((row) => {
    const { requester, ...rest } = row as QuotaRequestRow & {
      requester?: { id: string; name: string } | null
    }
    const enrichedRequester = requester
      ? {
          id: requester.id,
          name: requester.name,
          email: emailById.get(rest.requested_by) ?? '',
        }
      : null
    return toRequest({ ...rest, requester: enrichedRequester })
  })
}

export async function countPendingRequests(): Promise<number> {
  const { count, error } = await supabase
    .from('ai_quota_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function reviewRequest(
  requestId: string,
  superadminId: string,
  input: ReviewQuotaRequestInput
): Promise<QuotaRequest> {
  const { data: row, error: fetchError } = await supabase
    .from('ai_quota_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (fetchError || !row) throw new Error('Quota request not found')
  if (row.status !== 'pending') throw new Error('This request has already been reviewed')

  const now = new Date().toISOString()

  if (input.action === 'deny') {
    const { data, error } = await supabase
      .from('ai_quota_requests')
      .update({
        status: 'denied',
        apply_on_approve: false,
        review_note: input.reviewNote?.trim() || null,
        reviewed_by: superadminId,
        reviewed_at: now,
      })
      .eq('id', requestId)
      .select('*')
      .single()

    if (error || !data) throw new Error(error?.message ?? 'Failed to deny request')
    return toRequest(data as QuotaRequestRow)
  }

  const applyLimits = input.applyLimits === true

  if (applyLimits) {
    const patch: { imageLimit?: number; contentLimit?: number } = {}
    if (affectsImage(row.usage_type as RequestUsageType) && row.requested_image_limit != null) {
      patch.imageLimit = row.requested_image_limit
    }
    if (affectsContent(row.usage_type as RequestUsageType) && row.requested_content_limit != null) {
      patch.contentLimit = row.requested_content_limit
    }
    if (Object.keys(patch).length === 0) {
      throw new Error('No limits to apply on this request')
    }
    await updateLimits(patch, superadminId)
  }

  const { data, error } = await supabase
    .from('ai_quota_requests')
    .update({
      status: 'approved',
      apply_on_approve: applyLimits,
      review_note: input.reviewNote?.trim() || null,
      reviewed_by: superadminId,
      reviewed_at: now,
    })
    .eq('id', requestId)
    .select('*')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to approve request')
  return toRequest(data as QuotaRequestRow)
}
