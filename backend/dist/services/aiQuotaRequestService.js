"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequest = createRequest;
exports.listRequestsForAdmin = listRequestsForAdmin;
exports.listRequestsForSuperadmin = listRequestsForSuperadmin;
exports.countPendingRequests = countPendingRequests;
exports.reviewRequest = reviewRequest;
const supabase_1 = require("../supabase");
const aiQuotaService_1 = require("./aiQuotaService");
function toRequest(row) {
    const req = {
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
    };
    if (row.requester) {
        req.requester = {
            id: row.requester.id,
            name: row.requester.name,
            email: row.requester.email,
        };
    }
    return req;
}
function affectsImage(usageType) {
    return usageType === 'image' || usageType === 'both';
}
function affectsContent(usageType) {
    return usageType === 'content' || usageType === 'both';
}
async function validateRequestInput(input) {
    const reason = input.reason?.trim();
    if (!reason || reason.length < 10) {
        throw new Error('Reason must be at least 10 characters');
    }
    const stats = await (0, aiQuotaService_1.getQuotaStats)();
    if (affectsImage(input.usageType)) {
        if (input.requestedImageLimit === undefined || !Number.isInteger(input.requestedImageLimit)) {
            throw new Error('requestedImageLimit is required for image quota requests');
        }
        if (input.requestedImageLimit < 0) {
            throw new Error('requestedImageLimit must be non-negative');
        }
        if (input.requestType === 'extend' && input.requestedImageLimit <= stats.images.limit) {
            throw new Error('Extend request must propose a limit higher than the current image limit');
        }
        if (input.requestType === 'decrease') {
            if (input.requestedImageLimit >= stats.images.limit) {
                throw new Error('Decrease request must propose a limit lower than the current image limit');
            }
            if (input.requestedImageLimit < stats.images.used) {
                throw new Error('Image limit cannot be set below current usage');
            }
        }
    }
    if (affectsContent(input.usageType)) {
        if (input.requestedContentLimit === undefined || !Number.isInteger(input.requestedContentLimit)) {
            throw new Error('requestedContentLimit is required for content quota requests');
        }
        if (input.requestedContentLimit < 0) {
            throw new Error('requestedContentLimit must be non-negative');
        }
        if (input.requestType === 'extend' && input.requestedContentLimit <= stats.content.limit) {
            throw new Error('Extend request must propose a limit higher than the current content limit');
        }
        if (input.requestType === 'decrease') {
            if (input.requestedContentLimit >= stats.content.limit) {
                throw new Error('Decrease request must propose a limit lower than the current content limit');
            }
            if (input.requestedContentLimit < stats.content.used) {
                throw new Error('Content limit cannot be set below current usage');
            }
        }
    }
}
async function createRequest(adminId, input) {
    await validateRequestInput(input);
    const { data: pending } = await supabase_1.supabase
        .from('ai_quota_requests')
        .select('id')
        .eq('requested_by', adminId)
        .eq('status', 'pending')
        .maybeSingle();
    if (pending) {
        throw new Error('You already have a pending quota request. Wait for review or cancel it first.');
    }
    const { data, error } = await supabase_1.supabase
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
        .single();
    if (error || !data)
        throw new Error(error?.message ?? 'Failed to create quota request');
    return toRequest(data);
}
async function listRequestsForAdmin(adminId) {
    const { data, error } = await supabase_1.supabase
        .from('ai_quota_requests')
        .select('*')
        .eq('requested_by', adminId)
        .order('created_at', { ascending: false });
    if (error)
        throw new Error(error.message);
    return (data ?? []).map((row) => toRequest(row));
}
async function listRequestsForSuperadmin(status) {
    let query = supabase_1.supabase
        .from('ai_quota_requests')
        .select('*, requester:profiles!ai_quota_requests_requested_by_fkey(id, name)')
        .order('created_at', { ascending: false });
    if (status) {
        query = query.eq('status', status);
    }
    const { data, error } = await query;
    if (error)
        throw new Error(error.message);
    const rows = data ?? [];
    const requesterIds = [...new Set(rows.map((row) => row.requested_by))];
    const emailById = new Map();
    await Promise.all(requesterIds.map(async (id) => {
        const { data: authUser } = await supabase_1.supabase.auth.admin.getUserById(id);
        if (authUser?.user?.email)
            emailById.set(id, authUser.user.email);
    }));
    return rows.map((row) => {
        const { requester, ...rest } = row;
        const enrichedRequester = requester
            ? {
                id: requester.id,
                name: requester.name,
                email: emailById.get(rest.requested_by) ?? '',
            }
            : null;
        return toRequest({ ...rest, requester: enrichedRequester });
    });
}
async function countPendingRequests() {
    const { count, error } = await supabase_1.supabase
        .from('ai_quota_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
    if (error)
        throw new Error(error.message);
    return count ?? 0;
}
async function reviewRequest(requestId, superadminId, input) {
    const { data: row, error: fetchError } = await supabase_1.supabase
        .from('ai_quota_requests')
        .select('*')
        .eq('id', requestId)
        .single();
    if (fetchError || !row)
        throw new Error('Quota request not found');
    if (row.status !== 'pending')
        throw new Error('This request has already been reviewed');
    const now = new Date().toISOString();
    if (input.action === 'deny') {
        const { data, error } = await supabase_1.supabase
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
            .single();
        if (error || !data)
            throw new Error(error?.message ?? 'Failed to deny request');
        return toRequest(data);
    }
    const applyLimits = input.applyLimits === true;
    if (applyLimits) {
        const patch = {};
        if (affectsImage(row.usage_type) && row.requested_image_limit != null) {
            patch.imageLimit = row.requested_image_limit;
        }
        if (affectsContent(row.usage_type) && row.requested_content_limit != null) {
            patch.contentLimit = row.requested_content_limit;
        }
        if (Object.keys(patch).length === 0) {
            throw new Error('No limits to apply on this request');
        }
        await (0, aiQuotaService_1.updateLimits)(patch, superadminId);
    }
    const { data, error } = await supabase_1.supabase
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
        .single();
    if (error || !data)
        throw new Error(error?.message ?? 'Failed to approve request');
    return toRequest(data);
}
//# sourceMappingURL=aiQuotaRequestService.js.map