'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { CategorySalesChart } from '@/components/dashboard/CategorySalesChart';
import { OrderStatusPie } from '@/components/dashboard/OrderStatusPie';
import { InventoryTable } from '@/components/dashboard/InventoryTable';
import { Skeleton } from '@/components/ui/skeleton';
import type { ApiAnalyticsDashboard } from '@/types';

export default function AnalyticsPage() {
  const token = useAuthStore((s) => s.token);
  const [data, setData] = useState<ApiAnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    api.get<ApiAnalyticsDashboard>('/api/analytics/dashboard', token)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
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

  if (!data) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RevenueChart data={data.daily_sales ?? []} />
        <CategorySalesChart data={data.category_sales ?? []} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <OrderStatusPie data={data.order_status_counts ?? []} />
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-1">Summary</h3>
          <p className="text-sm text-gray-500 mb-4">Key metrics snapshot</p>
          <dl className="space-y-3">
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Total Revenue</dt>
              <dd className="font-semibold text-gray-900">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(data.stats.totalRevenue)}
              </dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">This Month</dt>
              <dd className="font-semibold text-gray-900">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(data.stats.revenueThisMonth)}
              </dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Total Orders</dt>
              <dd className="font-semibold text-gray-900">{data.stats.totalOrders}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Pending Orders</dt>
              <dd className="font-semibold text-amber-600">{data.stats.pendingOrders}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Low Stock Variants</dt>
              <dd className="font-semibold text-red-500">{data.stats.lowStockVariants}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Total Products</dt>
              <dd className="font-semibold text-gray-900">{data.stats.totalProducts}</dd>
            </div>
          </dl>
        </div>
      </div>

      <InventoryTable data={data.inventory ?? []} />
    </div>
  );
}
