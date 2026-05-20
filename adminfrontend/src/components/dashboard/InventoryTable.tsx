'use client';

import { useState } from 'react';
import type { InventoryItem } from '@/types';
import { cn } from '@/lib/utils';

interface InventoryTableProps {
  data: InventoryItem[];
}

const TYPE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'All', value: '' },
  { label: 'Saree', value: 'saree' },
  { label: 'Dress', value: 'dress' },
  { label: 'Jewellery', value: 'jewellery' },
];

export function InventoryTable({ data }: InventoryTableProps) {
  const [typeFilter, setTypeFilter] = useState('');
  const [sortField, setSortField] = useState<'quantity' | 'sold' | ''>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = data
    .filter((item) => !typeFilter || item.type === typeFilter)
    .sort((a, b) => {
      if (!sortField) return 0;
      const diff = a[sortField] - b[sortField];
      return sortDir === 'asc' ? diff : -diff;
    });

  const toggleSort = (field: 'quantity' | 'sold') => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const getRowClass = (qty: number) => {
    if (qty === 0) return 'row-critical-stock';
    if (qty < 5) return 'row-low-stock';
    return '';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between p-5 border-b border-gray-50">
        <div>
          <h3 className="font-semibold text-gray-900">Inventory</h3>
          <p className="text-sm text-gray-500">Stock levels by variant</p>
        </div>
        <div className="flex gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTypeFilter(opt.value)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                typeFilter === opt.value
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="text-left px-5 py-3 font-medium text-gray-500">Product</th>
              <th className="text-left px-3 py-3 font-medium text-gray-500">Type</th>
              <th className="text-left px-3 py-3 font-medium text-gray-500">Color</th>
              <th className="text-left px-3 py-3 font-medium text-gray-500">Size</th>
              <th
                className="text-right px-3 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-900"
                onClick={() => toggleSort('quantity')}
              >
                In Stock {sortField === 'quantity' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th
                className="text-right px-5 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-900"
                onClick={() => toggleSort('sold')}
              >
                Sold {sortField === 'sold' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">No inventory data</td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.id}
                  className={cn('border-b border-gray-50 hover:bg-gray-50/50 transition-colors', getRowClass(item.quantity))}
                >
                  <td className="px-5 py-3 font-medium text-gray-900 truncate max-w-[180px]">{item.product_title}</td>
                  <td className="px-3 py-3">
                    <span className="capitalize text-gray-600">{item.type}</span>
                  </td>
                  <td className="px-3 py-3 text-gray-600">{item.color}</td>
                  <td className="px-3 py-3 text-gray-600">{item.size}</td>
                  <td className="px-3 py-3 text-right">
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      item.quantity === 0
                        ? 'bg-red-100 text-red-700'
                        : item.quantity < 5
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    )}>
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
                      {item.sold}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
