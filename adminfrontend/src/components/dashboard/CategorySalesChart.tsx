'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { CategorySalesPoint } from '@/types';

interface CategorySalesChartProps {
  data: CategorySalesPoint[];
}

const COLORS = ['#f59e0b', '#10b981', '#6366f1'];

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-lg shadow-lg p-3">
        <p className="text-xs font-medium text-gray-700 capitalize mb-1">{label}</p>
        <p className="text-sm font-semibold text-gray-900">
          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
}

export function CategorySalesChart({ data }: CategorySalesChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">Sales by Category</h3>
        <p className="text-sm text-gray-500">Revenue per product type</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="type"
            tick={{ fontSize: 12, fill: '#64748b', textTransform: 'capitalize' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={60}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
