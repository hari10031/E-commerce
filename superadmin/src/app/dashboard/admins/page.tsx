'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, ChevronRight, UserCog, Copy, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  created_at: string;
}

interface CreateAdminResponse {
  admin: AdminRow;
  credentials: { email: string; password: string };
  message: string;
}

export default function AdminsPage() {
  const token = useAuthStore((s) => s.token)!;
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const loadAdmins = useCallback(async () => {
    setError('');
    try {
      const res = await api.get<{ data: AdminRow[] }>('/api/superadmin/admins', token);
      setAdmins(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setCredentials(null);
    try {
      const res = await api.post<CreateAdminResponse>(
        '/api/superadmin/admins',
        { name, email, phone: phone || undefined, password },
        token
      );
      setCredentials(res.credentials);
      setShowCreate(false);
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      await loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create admin');
    } finally {
      setCreating(false);
    }
  };

  const copyCredentials = async () => {
    if (!credentials) return;
    const text = `Admin login\nEmail: ${credentials.email}\nPassword: ${credentials.password}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Store admins</h1>
          <p className="text-slate-400 text-sm mt-1">
            Create store admin accounts, manage credentials, and control access. Only you can reset
            admin passwords.
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4" />
          New admin
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {credentials && (
        <div className="rounded-lg border border-emerald-800 bg-emerald-950/30 px-4 py-4 space-y-3">
          <p className="text-sm text-emerald-200 font-medium">Admin created — share credentials securely</p>
          <div className="text-sm text-slate-300 font-mono space-y-1">
            <p>Email: {credentials.email}</p>
            <p>Password: {credentials.password}</p>
          </div>
          <Button variant="outline" size="default" onClick={copyCredentials}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy credentials'}
          </Button>
        </div>
      )}

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="w-4 h-4 text-cyan-400" />
              Create store admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createAdmin} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Initial password</Label>
                <Input
                  id="password"
                  type="text"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create admin'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-slate-400">Loading admins...</p>
      ) : admins.length === 0 ? (
        <p className="text-slate-500 text-sm">No store admins yet. Create one to get started.</p>
      ) : (
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Created</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-slate-900/50">
                  <td className="px-4 py-3 text-slate-100">{admin.name}</td>
                  <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{admin.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        admin.active
                          ? 'text-emerald-400 text-xs font-medium'
                          : 'text-amber-400 text-xs font-medium'
                      }
                    >
                      {admin.active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                    {formatDate(admin.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/admins/${admin.id}`}
                      className="inline-flex text-cyan-400 hover:text-cyan-300"
                      aria-label={`View ${admin.name}`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
