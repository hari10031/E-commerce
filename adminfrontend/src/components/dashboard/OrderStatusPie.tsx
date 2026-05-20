'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { OrderStatusCount } from '@/types';

interface OrderStatusPieProps {
  data: OrderStatusCount[];
}

const STATUS_COLORS: Record<string, string> = {
  placed: '#3b82f6',
  confirmed: '#6366f1',
  processing: '#f59e0b',
  shipped: '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { status: string } }>;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-lg shadow-lg p-3">
        <p className="text-xs font-medium text-gray-700 capitalize">{payload[0].payload.status}</p>
        <p className="text-sm font-semibold text-gray-900">{payload[0].value} orders</p>
      </div>
    );
  }
  return null;
}

export function OrderStatusPie({ data }: OrderStatusPieProps) {
  const chartData = data.map((d) => ({
    ...d,
    name: d.status.charAt(0).toUpperCase() + d.status.slice(1),
    fill: STATUS_COLORS[d.status] || '#94a3b8',
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">Order Status Distribution</h3>
        <p className="text-sm text-gray-500">Orders by current status</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="count"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-gray-600 capitalize">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
