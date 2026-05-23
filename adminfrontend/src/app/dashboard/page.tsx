'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatPrice, formatDateTime } from '@/lib/utils';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/badge';
import {
  IndianRupee,
  ShoppingCart,
  Clock,
  Package,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import type { DashboardStats, SalesDataPoint, OrderStatus } from '@/types';
import Link from 'next/link';

interface RecentOrder {
  id: string;
  status: OrderStatus;
  created_at: string;
  total_amount: number;
  user?: { name?: string; phone?: string };
}

export default function DashboardPage() {
  const token = useAuthStore((s) => s.token);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailySales, setDailySales] = useState<SalesDataPoint[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    // Stats drive the page — a failure here is fatal.
    api.get<DashboardStats>('/api/analytics/dashboard', token)
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    // Chart + recent orders are best-effort; degrade silently on failure
    // (e.g. /sales is admin-only and 403s for employees).
    api.get<SalesDataPoint[]>('/api/analytics/sales', token)
      .then((rows) => setDailySales(rows ?? []))
      .catch(() => setDailySales([]));

    api.get<{ data: RecentOrder[] }>('/api/orders?limit=5', token)
      .then((res) => setRecentOrders(res.data ?? []))
      .catch(() => setRecentOrders([]));
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          label="Total Revenue"
          value={formatPrice(stats.totalRevenue)}
          icon={IndianRupee}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          description="all time"
        />
        <KpiCard
          label="This Month"
          value={formatPrice(stats.revenueThisMonth)}
          icon={TrendingUp}
          iconColor="text-green-600"
          iconBg="bg-green-50"
          description="revenue"
        />
        <KpiCard
          label="Total Orders"
          value={String(stats.totalOrders)}
          icon={ShoppingCart}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <KpiCard
          label="Pending Orders"
          value={String(stats.pendingOrders)}
          icon={Clock}
          iconColor="text-yellow-600"
          iconBg="bg-yellow-50"
          description="awaiting action"
        />
        <KpiCard
          label="Low Stock"
          value={String(stats.lowStockVariants)}
          icon={AlertTriangle}
          iconColor="text-red-500"
          iconBg="bg-red-50"
          description="variants < 5"
        />
        <KpiCard
          label="Products"
          value={String(stats.totalProducts)}
          icon={Package}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      {/* Revenue Chart */}
      <RevenueChart data={dailySales} />

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-50">
          <h3 className="font-semibold text-gray-900">Recent Orders</h3>
          <Link href="/dashboard/orders" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Order ID</th>
                <th className="text-left px-3 py-3 font-medium text-gray-500">Customer</th>
                <th className="text-left px-3 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-3 py-3 font-medium text-gray-500">Status</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.slice(0, 5).map((order) => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="font-mono text-xs text-amber-600 hover:text-amber-700"
                    >
                      #{order.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-gray-700">{order.user?.name ?? '—'}</td>
                  <td className="px-3 py-3 text-gray-500 text-xs">{formatDateTime(order.created_at)}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-gray-900">
                    {formatPrice(order.total_amount)}
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">No recent orders</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
