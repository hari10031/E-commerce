'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Ticket, Calendar, Users, Percent, ToggleLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import type { Coupon } from '@/types';

interface CreateCouponPayload {
  code: string;
  discount_percent: number;
  max_uses: number;
  expires_at: string;
}

export default function CouponsPage() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateCouponPayload>({
    code: '',
    discount_percent: 10,
    max_uses: 100,
    expires_at: '',
  });

  const fetchCoupons = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get<Coupon[]>('/api/coupons', token);
      setCoupons(res);
    } catch {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const handleCreate = async () => {
    if (!form.code.trim() || !token) return;
    setSaving(true);
    try {
      await api.post('/api/coupons', form, token);
      toast.success('Coupon created');
      setDialogOpen(false);
      setForm({ code: '', discount_percent: 10, max_uses: 100, expires_at: '' });
      fetchCoupons();
    } catch (err: unknown) {
      toast.error('Failed to create coupon', err instanceof Error ? err.message : '');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    if (!token) return;
    try {
      await api.patch(`/api/coupons/${coupon.id}`, { is_active: !coupon.is_active }, token);
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, is_active: !c.is_active } : c))
      );
    } catch {
      toast.error('Failed to update coupon');
    }
  };

  // Only admins
  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Ticket className="w-10 h-10 mb-3 opacity-40" />
        <p>Access restricted to admins only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{coupons.length} coupons</p>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          New Coupon
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Code</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500">Discount</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500">Usage</th>
                <th className="text-left px-3 py-3 font-medium text-gray-500">Expires</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500">Status</th>
                <th className="text-center px-5 py-3 font-medium text-gray-500">Active</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => {
                const expired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
                return (
                  <tr key={coupon.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <span className="font-mono font-bold text-gray-900 bg-gray-50 px-2 py-1 rounded text-xs">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Percent className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-semibold text-amber-600">{coupon.discount_percent}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-600">
                        <Users className="w-3.5 h-3.5" />
                        <span>{coupon.used_count}/{coupon.max_uses}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                        {coupon.expires_at ? formatDate(coupon.expires_at) : 'Never'}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {expired ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : coupon.used_count >= coupon.max_uses ? (
                        <Badge variant="secondary">Exhausted</Badge>
                      ) : coupon.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Switch
                        checked={coupon.is_active}
                        onCheckedChange={() => toggleActive(coupon)}
                      />
                    </td>
                  </tr>
                );
              })}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">No coupons yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Coupon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Coupon Code</Label>
              <Input
                placeholder="e.g., SUMMER25"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="uppercase font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Discount %</Label>
                <Input
                  type="number"
                  min={1}
                  max={80}
                  value={form.discount_percent}
                  onChange={(e) => setForm({ ...form, discount_percent: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max Uses</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.max_uses}
                  onChange={(e) => setForm({ ...form, max_uses: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Expiry Date (optional)</Label>
              <Input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.code.trim()}>
              {saving ? 'Creating...' : 'Create Coupon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
