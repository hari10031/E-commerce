import Link from 'next/link';
import { formatPrice, formatDateTime } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import type { Order } from '@/types';

interface OrdersTableProps {
  orders: Order[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-50 bg-gray-50/50">
            <th className="text-left px-5 py-3 font-medium text-gray-500">Order ID</th>
            <th className="text-left px-3 py-3 font-medium text-gray-500">Customer</th>
            <th className="text-left px-3 py-3 font-medium text-gray-500">Date</th>
            <th className="text-left px-3 py-3 font-medium text-gray-500">Status</th>
            <th className="text-right px-3 py-3 font-medium text-gray-500">Total</th>
            <th className="text-right px-5 py-3 font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              <td className="px-5 py-3">
                <Link
                  href={`/dashboard/orders/${order.id}`}
                  className="font-mono text-xs text-amber-600 hover:text-amber-700 font-medium"
                >
                  #{order.id.slice(0, 8)}
                </Link>
              </td>
              <td className="px-3 py-3">
                <div>
                  <p className="text-gray-900 font-medium">{order.user?.name ?? '—'}</p>
                  <p className="text-xs text-gray-400">{order.user?.phone ?? ''}</p>
                </div>
              </td>
              <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                {formatDateTime(order.created_at)}
              </td>
              <td className="px-3 py-3">
                <StatusBadge status={order.status} />
              </td>
              <td className="px-3 py-3 text-right font-semibold text-gray-900">
                {formatPrice(order.total_amount)}
              </td>
              <td className="px-5 py-3 text-right">
                <Link href={`/dashboard/orders/${order.id}`}>
                  <Button variant="ghost" size="icon">
                    <Eye className="w-4 h-4" />
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center py-12 text-gray-400">No orders found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
