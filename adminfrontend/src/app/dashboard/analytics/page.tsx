'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { CategorySalesChart } from '@/components/dashboard/CategorySalesChart';
import { OrderStatusPie } from '@/components/dashboard/OrderStatusPie';
import { InventoryTable } from '@/components/dashboard/InventoryTable';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  DashboardStats,
  SalesDataPoint,
  CategorySalesPoint,
  OrderStatusCount,
  InventoryItem,
  OrderStatus,
} from '@/types';

interface RawInventory {
  id: string;
  color: string;
  size: string;
  quantity: number;
  sold_count: number;
  product?: {
    id: string;
    title: string;
    type: InventoryItem['type'];
    category?: { id: string; name: string };
  };
}

export default function AnalyticsPage() {
  const token = useAuthStore((s) => s.token);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailySales, setDailySales] = useState<SalesDataPoint[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySalesPoint[]>([]);
  const [statusCounts, setStatusCounts] = useState<OrderStatusCount[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    // Stats drive the summary panel — a failure here is fatal.
    api.get<DashboardStats>('/api/analytics/dashboard', token)
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    // Charts are best-effort; degrade silently (some endpoints are admin-only).
    api.get<SalesDataPoint[]>('/api/analytics/sales', token)
      .then((rows) => setDailySales(rows ?? []))
      .catch(() => setDailySales([]));

    api.get<CategorySalesPoint[]>('/api/analytics/category-sales', token)
      .then((rows) => setCategorySales(rows ?? []))
      .catch(() => setCategorySales([]));

    api.get<RawInventory[]>('/api/analytics/inventory', token)
      .then((rows) =>
        setInventory(
          (rows ?? []).map((v) => ({
            id: v.id,
            product_id: v.product?.id ?? '',
            product_title: v.product?.title ?? '—',
            type: v.product?.type ?? 'saree',
            category: v.product?.category?.name ?? '—',
            color: v.color,
            size: v.size,
            quantity: v.quantity,
            sold: v.sold_count,
            sku: '',
          }))
        )
      )
      .catch(() => setInventory([]));

    // No dedicated endpoint for status counts — derive from the orders list.
    api.get<{ data: Array<{ status: OrderStatus }> }>('/api/orders?limit=500', token)
      .then((res) => {
        const counts: Record<string, number> = {};
        for (const o of res.data ?? []) {
          counts[o.status] = (counts[o.status] ?? 0) + 1;
        }
        setStatusCounts(
          Object.entries(counts).map(([status, count]) => ({ status: status as OrderStatus, count }))
        );
      })
      .catch(() => setStatusCounts([]));
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RevenueChart data={dailySales} />
        <CategorySalesChart data={categorySales} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <OrderStatusPie data={statusCounts} />
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-1">Summary</h3>
          <p className="text-sm text-gray-500 mb-4">Key metrics snapshot</p>
          <dl className="space-y-3">
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Total Revenue</dt>
              <dd className="font-semibold text-gray-900">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.totalRevenue)}
              </dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">This Month</dt>
              <dd className="font-semibold text-gray-900">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.revenueThisMonth)}
              </dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Total Orders</dt>
              <dd className="font-semibold text-gray-900">{stats.totalOrders}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Pending Orders</dt>
              <dd className="font-semibold text-amber-600">{stats.pendingOrders}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Low Stock Variants</dt>
              <dd className="font-semibold text-red-500">{stats.lowStockVariants}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Total Products</dt>
              <dd className="font-semibold text-gray-900">{stats.totalProducts}</dd>
            </div>
          </dl>
        </div>
      </div>

      <InventoryTable data={inventory} />
    </div>
  );
}
