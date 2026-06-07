'use client';

import { useCallback, useEffect, useState } from 'react';
import { ImageIcon, FileText, Sparkles, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '@/lib/utils';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/toast';

interface QuotaBucket {
  used: number;
  limit: number;
  remaining: number;
}

interface QuotaStats {
  images: QuotaBucket;
  content: QuotaBucket;
  resetPeriod: 'lifetime' | 'monthly';
  periodStart: string;
  updatedAt: string | null;
}

interface QuotaRequest {
  id: string;
  requestType: 'extend' | 'decrease';
  usageType: 'image' | 'content' | 'both';
  requestedImageLimit: number | null;
  requestedContentLimit: number | null;
  reason: string;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

function isLowQuota(bucket: QuotaBucket): boolean {
  return bucket.remaining <= Math.max(20, Math.ceil(bucket.limit * 0.1));
}

function usagePercent(bucket: QuotaBucket): number {
  if (bucket.limit <= 0) return 0;
  return Math.min(100, Math.round((bucket.used / bucket.limit) * 100));
}

export default function AiQuotaPage() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<QuotaStats | null>(null);
  const [requests, setRequests] = useState<QuotaRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requestType, setRequestType] = useState<'extend' | 'decrease'>('extend');
  const [usageType, setUsageType] = useState<'image' | 'content' | 'both'>('image');
  const [requestedImageLimit, setRequestedImageLimit] = useState('');
  const [requestedContentLimit, setRequestedContentLimit] = useState('');
  const [reason, setReason] = useState('');

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const [quota, history] = await Promise.all([
        api.get<QuotaStats>('/api/ai/quota', token),
        api.get<QuotaRequest[]>('/api/ai/quota/requests', token),
      ]);
      setStats(quota);
      setRequests(history);
      if (requestType === 'extend') {
        setRequestedImageLimit(String(quota.images.limit + 100));
        setRequestedContentLimit(String(quota.content.limit + 200));
      } else {
        setRequestedImageLimit(String(Math.max(quota.images.used, quota.images.limit - 50)));
        setRequestedContentLimit(String(Math.max(quota.content.used, quota.content.limit - 100)));
      }
    } catch (err) {
      toast.error('Failed to load AI quota', err instanceof Error ? err.message : '');
    } finally {
      setLoading(false);
    }
  }, [token, requestType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const hasPending = requests.some((r) => r.status === 'pending');
  const lowImage = stats ? isLowQuota(stats.images) : false;
  const lowContent = stats ? isLowQuota(stats.content) : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      await api.post(
        '/api/ai/quota/requests',
        {
          requestType,
          usageType,
          requestedImageLimit:
            usageType === 'image' || usageType === 'both'
              ? parseInt(requestedImageLimit, 10)
              : undefined,
          requestedContentLimit:
            usageType === 'content' || usageType === 'both'
              ? parseInt(requestedContentLimit, 10)
              : undefined,
          reason: reason.trim(),
        },
        token
      );
      toast.success('Request submitted to platform admin');
      setReason('');
      await loadData();
    } catch (err) {
      toast.error('Failed to submit request', err instanceof Error ? err.message : '');
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Sparkles className="w-10 h-10 mb-3 opacity-40" />
        <p>Access restricted to admins only.</p>
      </div>
    );
  }

  if (loading || !stats) {
    return <p className="text-sm text-gray-500">Loading AI quota...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">AI Quota</h1>
        <p className="text-sm text-gray-500 mt-1">
          Platform-wide Gemini usage for your store. Request more or lower limits from the platform admin.
        </p>
      </div>

      {(lowImage || lowContent) && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Running low on AI quota</p>
            <p className="mt-0.5 text-amber-800">
              Submit an extension request below before your team hits the limit.
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Note: each AI attempt counts toward quota even if generation fails after the request starts.
      </p>

      <div className="flex flex-wrap gap-2 text-sm text-gray-500">
        <Badge variant="outline" className="capitalize">
          {stats.resetPeriod} reset
        </Badge>
        {stats.resetPeriod === 'monthly' && (
          <span>Period started {formatDateTime(stats.periodStart)}</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <KpiCard
            label="AI images"
            value={`${stats.images.used} / ${stats.images.limit}`}
            icon={ImageIcon}
            description={`${stats.images.remaining} remaining`}
          />
          <Progress value={usagePercent(stats.images)} className="h-2" />
        </div>
        <div className="space-y-2">
          <KpiCard
            label="AI content"
            value={`${stats.content.used} / ${stats.content.limit}`}
            icon={FileText}
            iconColor="text-violet-600"
            iconBg="bg-violet-50"
            description={`${stats.content.remaining} remaining`}
          />
          <Progress value={usagePercent(stats.content)} className="h-2" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Request limit change</h2>
        {hasPending && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            You have a pending request. Wait for platform admin review before submitting another.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Request type</Label>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value as 'extend' | 'decrease')}
                className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm"
              >
                <option value="extend">Extend (need more quota)</option>
                <option value="decrease">Decrease (unused quota)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Applies to</Label>
              <select
                value={usageType}
                onChange={(e) => setUsageType(e.target.value as 'image' | 'content' | 'both')}
                className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm"
              >
                <option value="image">Images only</option>
                <option value="content">Content only</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          {(usageType === 'image' || usageType === 'both') && (
            <div className="space-y-1.5">
              <Label htmlFor="imageLimit">
                Proposed image limit (current: {stats.images.limit})
              </Label>
              <Input
                id="imageLimit"
                type="number"
                min={0}
                value={requestedImageLimit}
                onChange={(e) => setRequestedImageLimit(e.target.value)}
                required
              />
            </div>
          )}

          {(usageType === 'content' || usageType === 'both') && (
            <div className="space-y-1.5">
              <Label htmlFor="contentLimit">
                Proposed content limit (current: {stats.content.limit})
              </Label>
              <Input
                id="contentLimit"
                type="number"
                min={0}
                value={requestedContentLimit}
                onChange={(e) => setRequestedContentLimit(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason (min 10 characters)</Label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              minLength={10}
              required
              className="flex w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="e.g. Festival season — need more product photos for new saree collection"
            />
          </div>

          <Button type="submit" disabled={submitting || hasPending}>
            {submitting ? 'Submitting...' : 'Submit request'}
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Your requests</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-gray-500">No requests yet.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="rounded-lg border border-gray-100 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge variant="outline" className="capitalize">
                    {req.status}
                  </Badge>
                  <span className="capitalize text-gray-600">
                    {req.requestType} · {req.usageType}
                  </span>
                  <span className="text-gray-400">{formatDateTime(req.createdAt)}</span>
                </div>
                <p className="text-gray-700">{req.reason}</p>
                {req.reviewNote && (
                  <p className="text-gray-500 mt-1">Platform reply: {req.reviewNote}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
