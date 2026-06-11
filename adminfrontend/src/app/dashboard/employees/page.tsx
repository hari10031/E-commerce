'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { PendingEmployeeCard } from '@/components/employees/PendingEmployeeCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatDate, formatPrice } from '@/lib/utils';
import { Users, UserCheck, Trophy, Globe, Store } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import type { Employee } from '@/types';

interface EmployeeStat {
  id: string;
  name: string;
  revenue: number;
  itemsSold: number;
  saleCount: number;
}

interface SalesSummary {
  onlineRevenue: number;
  offlineRevenue: number;
  totalRevenue: number;
  onlineCount: number;
  offlineCount: number;
}

export default function EmployeesPage() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [pending, setPending] = useState<Employee[]>([]);
  const [active, setActive] = useState<Employee[]>([]);
  const [performance, setPerformance] = useState<EmployeeStat[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [pendingRes, activeRes] = await Promise.all([
        api.get<{ data: Employee[] }>('/api/employees?status=pending', token),
        api.get<{ data: Employee[] }>('/api/employees?status=approved', token),
      ]);
      setPending(pendingRes.data ?? []);
      setActive(activeRes.data ?? []);
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!token) return;
    api.get<{ employees: EmployeeStat[] }>('/api/analytics/employee-performance', token)
      .then((r) => setPerformance(r.employees ?? []))
      .catch(() => {});
    api.get<SalesSummary>('/api/analytics/sales-summary', token)
      .then(setSummary)
      .catch(() => {});
  }, [token]);

  // Only admins can see this page
  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Users className="w-10 h-10 mb-3 opacity-40" />
        <p>Access restricted to admins only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sales channels: online vs offline */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Globe className="w-4 h-4 text-blue-500" /> Online Sales
            </div>
            <p className="text-xl font-bold text-gray-900">{formatPrice(summary.onlineRevenue)}</p>
            <p className="text-xs text-gray-400">{summary.onlineCount} web orders</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Store className="w-4 h-4 text-amber-500" /> Offline Sales
            </div>
            <p className="text-xl font-bold text-gray-900">{formatPrice(summary.offlineRevenue)}</p>
            <p className="text-xs text-gray-400">{summary.offlineCount} in-person sales</p>
          </div>
          <div className="bg-amber-500 rounded-xl shadow-sm p-4 text-white">
            <div className="text-amber-50 text-sm mb-1">Total Revenue</div>
            <p className="text-xl font-bold">{formatPrice(summary.totalRevenue)}</p>
            <p className="text-xs text-amber-100">Online + offline combined</p>
          </div>
        </div>
      )}

      {/* Employee performance */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-50">
          <h3 className="font-semibold text-gray-900">Employee Performance</h3>
          <p className="text-sm text-gray-500">Ranked by offline sales revenue</p>
        </div>
        {performance.length === 0 ? (
          <p className="text-center py-10 text-gray-400 text-sm">No offline sales recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Employee</th>
                <th className="text-right px-3 py-3 font-medium text-gray-500">Items Sold</th>
                <th className="text-right px-3 py-3 font-medium text-gray-500">Sales</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {performance.map((emp, i) => (
                <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {i === 0 ? (
                        <Trophy className="w-4 h-4 text-amber-500" />
                      ) : (
                        <span className="w-4 text-center text-xs text-gray-400">{i + 1}</span>
                      )}
                      <span className="font-medium text-gray-900">{emp.name}</span>
                      {i === 0 && (
                        <Badge variant="warning" className="ml-1 text-xs">Top performer</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-gray-600">{emp.itemsSold}</td>
                  <td className="px-3 py-3 text-right text-gray-600">{emp.saleCount}</td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">
                    {formatPrice(emp.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pending / active employees */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            {pending.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-4 px-1.5 text-xs">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active">
            Active
            <Badge variant="secondary" className="ml-2 h-4 px-1.5 text-xs">
              {active.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
            </div>
          ) : pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <UserCheck className="w-10 h-10 mb-3 opacity-40" />
              <p>No pending employee requests</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pending.map((emp) => (
                <PendingEmployeeCard key={emp.id} employee={emp} onAction={fetchAll} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : active.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Users className="w-10 h-10 mb-3 opacity-40" />
              <p>No active employees</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/50">
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Name</th>
                    <th className="text-left px-3 py-3 font-medium text-gray-500">Email</th>
                    <th className="text-left px-3 py-3 font-medium text-gray-500">Phone</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((emp) => (
                    <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-amber-700 text-xs font-bold">{emp.name[0]?.toUpperCase()}</span>
                          </div>
                          <span className="font-medium text-gray-900">{emp.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-600">{emp.email}</td>
                      <td className="px-3 py-3 text-gray-500">{emp.phone ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(emp.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
