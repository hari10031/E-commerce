'use client';

import { useCallback, useEffect, useState } from 'react';
import { ImageIcon, FileText, RefreshCw, Settings2 } from 'lucide-react';
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

export default function AiQuotaPage() {
  const token = useAuthStore((s) => s.token)!;
  const [stats, setStats] = useState<QuotaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [imageLimit, setImageLimit] = useState('');
  const [contentLimit, setContentLimit] = useState('');
  const [resetPeriod, setResetPeriod] = useState<'lifetime' | 'monthly'>('monthly');

  const loadStats = useCallback(async () => {
    setError('');
    try {
      const data = await api.get<QuotaStats>('/api/superadmin/ai-quota', token);
      setStats(data);
      setImageLimit(String(data.images.limit));
      setContentLimit(String(data.content.limit));
      setResetPeriod(data.resetPeriod);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quota');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

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
        </>
      )}
    </div>
  );
}
