'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatPrice, discountedPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product, PaginatedResponse, Category } from '@/types';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const TYPE_FILTERS: Array<{ label: string; value: string }> = [
  { label: 'All', value: '' },
  { label: 'Saree', value: 'saree' },
  { label: 'Dress', value: 'dress' },
  { label: 'Jewellery', value: 'jewellery' },
];

export default function ProductsPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  const fetchProducts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        published: 'all',
        ...(search && { search }),
        ...(typeFilter && { type: typeFilter }),
        ...(categoryFilter && { category: categoryFilter }),
      });
      const res = await api.get<PaginatedResponse<Product>>(`/api/products?${params}`, token);
      setProducts(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err: unknown) {
      toast.error('Failed to load products', err instanceof Error ? err.message : '');
    } finally {
      setLoading(false);
    }
  }, [token, page, search, typeFilter, categoryFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!token) return;
    api.get<Category[]>('/api/categories', token).then(setCategories).catch(() => {});
  }, [token]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/api/products/${id}`, token ?? undefined);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err: unknown) {
      toast.error('Delete failed', err instanceof Error ? err.message : '');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{total} products total</p>
        </div>
        <Button onClick={() => router.push('/dashboard/products/new')}>
          <Plus className="w-4 h-4" />
          New Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setTypeFilter(f.value); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                typeFilter === f.value
                  ? 'bg-amber-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">All categories</option>
          {categories
            .filter((c) => !c.parent_id)
            .flatMap((parent) => [
              <option key={parent.id} value={parent.id}>{parent.name}</option>,
              ...categories
                .filter((c) => c.parent_id === parent.id)
                .map((child) => (
                  <option key={child.id} value={child.id}>&nbsp;&nbsp;— {child.name}</option>
                )),
            ])}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Product</th>
                <th className="text-left px-3 py-3 font-medium text-gray-500">Type</th>
                <th className="text-left px-3 py-3 font-medium text-gray-500">Category</th>
                <th className="text-right px-3 py-3 font-medium text-gray-500">Price</th>
                <th className="text-right px-3 py-3 font-medium text-gray-500">Disc %</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500">Status</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-3 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : products.map((product) => {
                    const primaryImage = product.images?.find((img) => img.is_primary);
                    return (
                      <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            {primaryImage ? (
                              <Image
                                src={primaryImage.image_url}
                                alt={product.title}
                                width={36}
                                height={36}
                                className="rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0" />
                            )}
                            <span className="font-medium text-gray-900 truncate max-w-[200px]">
                              {product.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="capitalize text-gray-600">{product.type}</span>
                        </td>
                        <td className="px-3 py-3 text-gray-500">
                          {product.category?.name ?? '—'}
                        </td>
                        <td className="px-3 py-3 text-right font-medium text-gray-900">
                          {formatPrice(discountedPrice(product.base_price, product.discount_percent))}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {product.discount_percent > 0 ? (
                            <Badge variant="warning">{product.discount_percent}%</Badge>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <Badge variant={product.published ? 'success' : 'secondary'}>
                            {product.published ? 'Published' : 'Draft'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/dashboard/products/${product.id}/edit`)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
