"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotaExceededError = void 0;
exports.getQuotaStats = getQuotaStats;
exports.consumeQuota = consumeQuota;
exports.refundQuota = refundQuota;
exports.updateLimits = updateLimits;
exports.resetPeriodCounters = resetPeriodCounters;
const supabase_1 = require("../supabase");
class QuotaExceededError extends Error {
    usageType;
    constructor(usageType) {
        const label = usageType === 'image' ? 'image' : 'content';
        super(`AI ${label} quota exhausted. Contact platform admin.`);
        this.name = 'QuotaExceededError';
        this.usageType = usageType;
    }
}
exports.QuotaExceededError = QuotaExceededError;
async function ensurePeriodFresh() {
    const { error } = await supabase_1.supabase.rpc('maybe_reset_ai_quota_period');
    if (error)
        throw new Error(error.message);
}
async function fetchSettingsRow() {
    await ensurePeriodFresh();
    const { data, error } = await supabase_1.supabase
        .from('ai_quota_settings')
        .select('image_limit, content_limit, reset_period, period_start, images_used, content_used, updated_at')
        .eq('id', 1)
        .single();
    if (error || !data)
        throw new Error('AI quota settings not configured');
    return data;
}
function toStats(row) {
    return {
        images: {
            used: row.images_used,
            limit: row.image_limit,
            remaining: Math.max(0, row.image_limit - row.images_used),
        },
        content: {
            used: row.content_used,
            limit: row.content_limit,
            remaining: Math.max(0, row.content_limit - row.content_used),
        },
        resetPeriod: row.reset_period,
        periodStart: row.period_start,
        updatedAt: row.updated_at,
    };
}
async function getQuotaStats() {
    const row = await fetchSettingsRow();
    return toStats(row);
}
async function consumeQuota(type, userId) {
    const { error } = await supabase_1.supabase.rpc('consume_ai_quota', {
        p_type: type,
        p_user_id: userId ?? null,
    });
    if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('image quota exhausted'))
            throw new QuotaExceededError('image');
        if (msg.includes('content quota exhausted'))
            throw new QuotaExceededError('content');
        throw new Error(error.message);
    }
}
/** Refund one quota unit when generation fails after consume. */
async function refundQuota(type) {
    const column = type === 'image' ? 'images_used' : 'content_used';
    const { data: row } = await supabase_1.supabase
        .from('ai_quota_settings')
        .select(column)
        .eq('id', 1)
        .single();
    if (!row)
        return;
    const used = Number(row[column] ?? 0);
    if (used <= 0)
        return;
    await supabase_1.supabase
        .from('ai_quota_settings')
        .update({ [column]: used - 1, updated_at: new Date().toISOString() })
        .eq('id', 1);
}
async function updateLimits(input, updatedBy) {
    const { data: profile } = await supabase_1.supabase
        .from('profiles')
        .select('id')
        .eq('id', updatedBy)
        .maybeSingle();
    const patch = {
        updated_at: new Date().toISOString(),
        updated_by: profile?.id ?? null,
    };
    if (input.imageLimit !== undefined) {
        if (!Number.isInteger(input.imageLimit) || input.imageLimit < 0) {
            throw new Error('imageLimit must be a non-negative integer');
        }
        patch.image_limit = input.imageLimit;
    }
    if (input.contentLimit !== undefined) {
        if (!Number.isInteger(input.contentLimit) || input.contentLimit < 0) {
            throw new Error('contentLimit must be a non-negative integer');
        }
        patch.content_limit = input.contentLimit;
    }
    if (input.resetPeriod !== undefined) {
        if (!['lifetime', 'monthly'].includes(input.resetPeriod)) {
            throw new Error('resetPeriod must be lifetime or monthly');
        }
        patch.reset_period = input.resetPeriod;
        if (input.resetPeriod === 'monthly') {
            patch.period_start = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        }
    }
    const { error } = await supabase_1.supabase.from('ai_quota_settings').update(patch).eq('id', 1);
    if (error)
        throw new Error(error.message);
    return getQuotaStats();
}
async function resetPeriodCounters() {
    const { error } = await supabase_1.supabase.rpc('reset_ai_quota_period');
    if (error)
        throw new Error(error.message);
    return getQuotaStats();
}
//# sourceMappingURL=aiQuotaService.js.map