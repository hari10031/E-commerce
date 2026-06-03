'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Key, Trash2, UserCog } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  active: boolean;
  created_at: string;
  updated_at?: string;
}

export default function AdminDetailPage() {
  const { id } = useParams<{ id: string }>();
  const token = useAuthStore((s) => s.token)!;
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [resettingPw, setResettingPw] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const loadAdmin = useCallback(async () => {
    setError('');
    try {
      const data = await api.get<AdminDetail>(`/api/superadmin/admins/${id}`, token);
      setAdmin(data);
      setName(data.name);
      setEmail(data.email ?? '');
      setPhone(data.phone ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    loadAdmin();
  }, [loadAdmin]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = await api.patch<AdminDetail>(
        `/api/superadmin/admins/${id}`,
        { name, email, phone: phone || null },
        token
      );
      setAdmin(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update admin');
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setResettingPw(true);
    setError('');
    try {
      await api.patch(`/api/superadmin/admins/${id}/password`, { password: newPassword }, token);
      setNewPassword('');
      setError('');
      alert('Password updated. Share the new password with the admin securely.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setResettingPw(false);
    }
  };

  const toggleActive = async () => {
    if (!admin) return;
    const next = !admin.active;
    const msg = next
      ? 'Activate this admin? They can sign in again.'
      : 'Deactivate this admin? Login will be blocked.';
    if (!confirm(msg)) return;

    setTogglingStatus(true);
    setError('');
    try {
      await api.patch(`/api/superadmin/admins/${id}/status`, { active: next }, token);
      await loadAdmin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setTogglingStatus(false);
    }
  };

  const removeAdmin = async () => {
    if (!confirm('Permanently delete this admin account? This cannot be undone.')) return;
    setDeleting(true);
    setError('');
    try {
      await api.delete(`/api/superadmin/admins/${id}`, token);
      router.push('/dashboard/admins');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete admin');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <p className="text-slate-400">Loading admin...</p>;
  }

  if (!admin) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/admins" className="inline-flex items-center gap-2 text-sm text-cyan-400">
          <ArrowLeft className="w-4 h-4" />
          Back to admins
        </Link>
        <p className="text-red-300">{error || 'Admin not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/admins"
        className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to admins
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">{admin.name}</h1>
          <p className="text-slate-400 text-sm mt-1">{admin.email}</p>
          <p className="text-xs text-slate-500 mt-2">
            Created {formatDate(admin.created_at)}
            {admin.updated_at && ` · Updated ${formatDateTime(admin.updated_at)}`}
          </p>
        </div>
        <span
          className={
            admin.active
              ? 'rounded-full bg-emerald-950 border border-emerald-800 px-3 py-1 text-xs text-emerald-300'
              : 'rounded-full bg-amber-950 border border-amber-800 px-3 py-1 text-xs text-amber-300'
          }
        >
          {admin.active ? 'Active' : 'Deactivated'}
        </span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="w-4 h-4 text-cyan-400" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email (login)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save profile'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" />
              Reset password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400 mb-4">
              Only super admins can change store admin passwords. Share the new password securely.
            </p>
            <form onSubmit={resetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="text"
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" variant="outline" disabled={resettingPw}>
                {resettingPw ? 'Updating...' : 'Set new password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={toggleActive} disabled={togglingStatus}>
            {togglingStatus
              ? 'Updating...'
              : admin.active
                ? 'Deactivate account'
                : 'Activate account'}
          </Button>
          <Button variant="outline" onClick={removeAdmin} disabled={deleting} className="text-red-300 border-red-900 hover:bg-red-950/40">
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting...' : 'Delete admin'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
