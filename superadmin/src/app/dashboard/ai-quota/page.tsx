'use client';

import { useCallback, useEffect, useState } from 'react';
import { ImageIcon, FileText, RefreshCw, Settings2, Inbox, Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '@/lib/utils';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  requestedBy: string;
  requestType: 'extend' | 'decrease';
  usageType: 'image' | 'content' | 'both';
  requestedImageLimit: number | null;
  requestedContentLimit: number | null;
  reason: string;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  applyOnApprove: boolean | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  requester?: { id: string; name: string; email: string };
}

export default function AiQuotaPage() {
  const token = useAuthStore((s) => s.token)!;
  const [stats, setStats] = useState<QuotaStats | null>(null);
  const [requests, setRequests] = useState<QuotaRequest[]>([]);
  const [requestFilter, setRequestFilter] = useState<'pending' | 'all'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<QuotaRequest | null>(null);
  const [applyLimits, setApplyLimits] = useState(true);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [imageLimit, setImageLimit] = useState('');
  const [contentLimit, setContentLimit] = useState('');
  const [resetPeriod, setResetPeriod] = useState<'lifetime' | 'monthly'>('monthly');

  const loadRequests = useCallback(async () => {
    const endpoint =
      requestFilter === 'pending'
        ? '/api/superadmin/ai-quota/requests?status=pending'
        : '/api/superadmin/ai-quota/requests';
    const data = await api.get<QuotaRequest[]>(endpoint, token);
    setRequests(data);
  }, [token, requestFilter]);

  const loadStats = useCallback(async () => {
    setError('');
    try {
      const data = await api.get<QuotaStats>('/api/superadmin/ai-quota', token);
      setStats(data);
      setImageLimit(String(data.images.limit));
      setContentLimit(String(data.content.limit));
      setResetPeriod(data.resetPeriod);
      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quota');
    } finally {
      setLoading(false);
    }
  }, [token, loadRequests]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (loading) return;
    loadRequests().catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    });
  }, [requestFilter, loading, loadRequests]);

  const saveLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = await api.patch<QuotaStats>(
        '/api/superadmin/ai-quota',
        {
          imageLimit: parseInt(imageLimit, 10),
          contentLimit: parseInt(contentLimit, 10),
          resetPeriod,
        },
        token
      );
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save limits');
    } finally {
      setSaving(false);
    }
  };

  const resetCounters = async () => {
    if (!confirm('Reset usage counters for the current period?')) return;
    setResetting(true);
    setError('');
    try {
      const data = await api.post<QuotaStats>('/api/superadmin/ai-quota/reset-period', {}, token);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset counters');
    } finally {
      setResetting(false);
    }
  };

  const openReview = (request: QuotaRequest) => {
    setSelectedRequest(request);
    setApplyLimits(request.requestType === 'extend');
    setReviewNote('');
  };

  const submitReview = async (action: 'approve' | 'deny') => {
    if (!selectedRequest) return;
    setReviewing(true);
    setError('');
    try {
      await api.patch<QuotaRequest>(
        `/api/superadmin/ai-quota/requests/${selectedRequest.id}`,
        {
          action,
          applyLimits: action === 'approve' ? applyLimits : false,
          reviewNote: reviewNote.trim() || undefined,
        },
        token
      );
      setSelectedRequest(null);
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to review request');
    } finally {
      setReviewing(false);
    }
  };

  const formatLimits = (req: QuotaRequest) => {
    const parts: string[] = [];
    if (req.requestedImageLimit != null) parts.push(`images → ${req.requestedImageLimit}`);
    if (req.requestedContentLimit != null) parts.push(`content → ${req.requestedContentLimit}`);
    return parts.join(', ') || '—';
  };

  if (loading) {
    return <p className="text-slate-400">Loading quota stats...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Gemini AI Usage</h1>
        <p className="text-slate-400 text-sm mt-1">
          Track and control image generation and AI product copy across the platform.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {stats && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <span className="inline-flex items-center rounded-full bg-slate-800 px-3 py-1 border border-slate-700">
              Reset: <strong className="ml-1 text-slate-200 capitalize">{stats.resetPeriod}</strong>
            </span>
            {stats.resetPeriod === 'monthly' && (
              <span>Period started {formatDateTime(stats.periodStart)}</span>
            )}
            {stats.updatedAt && <span>· Limits updated {formatDateTime(stats.updatedAt)}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <KpiCard
              label="Images generated"
              value={String(stats.images.used)}
              sub={`of ${stats.images.limit} limit`}
              icon={ImageIcon}
            />
            <KpiCard
              label="Images remaining"
              value={String(stats.images.remaining)}
              icon={ImageIcon}
              accent="text-emerald-400"
            />
            <KpiCard
              label="Content generations"
              value={String(stats.content.used)}
              sub={`of ${stats.content.limit} limit`}
              icon={FileText}
              accent="text-violet-400"
            />
            <KpiCard
              label="Content remaining"
              value={String(stats.content.remaining)}
              icon={FileText}
              accent="text-emerald-400"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-cyan-400" />
                  Edit limits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={saveLimits} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="imageLimit">Image generation limit</Label>
                    <Input
                      id="imageLimit"
                      type="number"
                      min={0}
                      value={imageLimit}
                      onChange={(e) => setImageLimit(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contentLimit">Content generation limit</Label>
                    <Input
                      id="contentLimit"
                      type="number"
                      min={0}
                      value={contentLimit}
                      onChange={(e) => setContentLimit(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="resetPeriod">Reset period</Label>
                    <select
                      id="resetPeriod"
                      value={resetPeriod}
                      onChange={(e) => setResetPeriod(e.target.value as 'lifetime' | 'monthly')}
                      className="flex h-9 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 text-sm text-slate-100"
                    >
                      <option value="monthly">Monthly (resets each calendar month)</option>
                      <option value="lifetime">Lifetime (never auto-resets)</option>
                    </select>
                  </div>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save limits'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-cyan-400" />
                  Manual reset
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-400">
                  Zero out usage counters immediately. Limits stay unchanged. Useful at the start of
                  a billing cycle or after topping up Gemini credits.
                </p>
                <Button variant="outline" onClick={resetCounters} disabled={resetting}>
                  {resetting ? 'Resetting...' : 'Reset usage counters'}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-cyan-400" />
                  Quota change requests
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={requestFilter === 'pending' ? 'default' : 'outline'}
                    onClick={() => setRequestFilter('pending')}
                    className="h-8 px-3 text-xs"
                  >
                    Pending
                  </Button>
                  <Button
                    type="button"
                    variant={requestFilter === 'all' ? 'default' : 'outline'}
                    onClick={() => setRequestFilter('all')}
                    className="h-8 px-3 text-xs"
                  >
                    All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {requests.length === 0 ? (
                <p className="text-sm text-slate-400">No requests in this view.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-400 border-b border-slate-800">
                        <th className="pb-2 pr-4">Admin</th>
                        <th className="pb-2 pr-4">Type</th>
                        <th className="pb-2 pr-4">Proposed limits</th>
                        <th className="pb-2 pr-4">Reason</th>
                        <th className="pb-2 pr-4">Status</th>
                        <th className="pb-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((req) => (
                        <tr key={req.id} className="border-b border-slate-800/60 align-top">
                          <td className="py-3 pr-4">
                            <div className="text-slate-200">{req.requester?.name ?? '—'}</div>
                            <div className="text-xs text-slate-500">{req.requester?.email}</div>
                          </td>
                          <td className="py-3 pr-4 capitalize">
                            {req.requestType} · {req.usageType}
                          </td>
                          <td className="py-3 pr-4 font-mono text-xs">{formatLimits(req)}</td>
                          <td className="py-3 pr-4 max-w-xs">
                            <p className="text-slate-300">{req.reason}</p>
                            {req.reviewNote && (
                              <p className="text-xs text-slate-500 mt-1">Note: {req.reviewNote}</p>
                            )}
                          </td>
                          <td className="py-3 pr-4 capitalize">{req.status}</td>
                          <td className="py-3">
                            {req.status === 'pending' ? (
                              <Button type="button" variant="outline" onClick={() => openReview(req)} className="h-8 px-3 text-xs">
                                Review
                              </Button>
                            ) : (
                              <span className="text-xs text-slate-500">
                                {req.reviewedAt ? formatDateTime(req.reviewedAt) : '—'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedRequest && (
                <div className="rounded-lg border border-cyan-900/50 bg-slate-900/60 p-4 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      Review request from {selectedRequest.requester?.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 capitalize">
                      {selectedRequest.requestType} · {selectedRequest.usageType} · {formatLimits(selectedRequest)}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reviewNote">Review note (optional)</Label>
                    <textarea
                      id="reviewNote"
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      rows={2}
                      className="flex w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                      placeholder="Message visible to the store admin"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={applyLimits}
                      onChange={(e) => setApplyLimits(e.target.checked)}
                      className="rounded border-slate-600"
                    />
                    Apply proposed limits on approve
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" disabled={reviewing} onClick={() => submitReview('approve')}>
                      <Check className="w-4 h-4 mr-1" />
                      {reviewing ? 'Saving...' : 'Approve'}
                    </Button>
                    <Button type="button" variant="outline" disabled={reviewing} onClick={() => submitReview('deny')}>
                      <X className="w-4 h-4 mr-1" />
                      Deny
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setSelectedRequest(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
