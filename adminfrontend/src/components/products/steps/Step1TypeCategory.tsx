'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Category, ProductType } from '@/types';
import { toast } from '@/components/ui/toast';

interface Step1Data {
  type: ProductType;
  categoryId: string;
}

interface Step1Props {
  data: Step1Data;
  onChange: (data: Partial<Step1Data>) => void;
}

const PRODUCT_TYPES: Array<{ value: ProductType; label: string; emoji: string }> = [
  { value: 'saree', label: 'Saree', emoji: '🥻' },
  { value: 'dress', label: 'Dress', emoji: '👗' },
  { value: 'jewellery', label: 'Jewellery', emoji: '💎' },
];

export function Step1TypeCategory({ data, onChange }: Step1Props) {
  const token = useAuthStore((s) => s.token);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.get<Category[]>('/api/categories', token)
      .then(setCategories)
      .catch(() => {});
  }, [token]);

  const topLevel = categories.filter((c) => !c.parent_id);
  const childrenOf = (id: string) => categories.filter((c) => c.parent_id === id);

  const selected = categories.find((c) => c.id === data.categoryId);
  const activeParentId = selected?.parent_id || selected?.id || '';
  const subs = activeParentId ? childrenOf(activeParentId) : [];

  const handleCreateCategory = async () => {
    if (!newCatName.trim() || !token) return;
    setCreating(true);
    try {
      const cat = await api.post<Category>('/api/categories', { name: newCatName.trim() }, token);
      setCategories((prev) => [...prev, cat]);
      onChange({ categoryId: cat.id });
      setNewCatName('');
      setShowNewCat(false);
      toast.success('Category created');
    } catch (err: unknown) {
      toast.error('Failed to create category', err instanceof Error ? err.message : '');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Product Type */}
      <div>
        <Label className="text-base font-semibold mb-3 block">Product Type</Label>
        <div className="grid grid-cols-3 gap-3">
          {PRODUCT_TYPES.map((pt) => (
            <button
              key={pt.value}
              type="button"
              onClick={() => onChange({ type: pt.value })}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                data.type === pt.value
                  ? 'border-amber-500 bg-amber-50 text-amber-800'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <span className="text-2xl">{pt.emoji}</span>
              <span className="text-sm font-medium">{pt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-base font-semibold">Category</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowNewCat(!showNewCat)}
          >
            <Plus className="w-3.5 h-3.5" />
            New category
          </Button>
        </div>

        {showNewCat && (
          <div className="flex gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
            <Input
              placeholder="Category name"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateCategory(); }}
            />
            <Button onClick={handleCreateCategory} disabled={creating} size="sm">
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </div>
        )}

        {topLevel.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No categories yet. Create one above.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {topLevel.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onChange({ categoryId: cat.id })}
                className={cn(
                  'px-4 py-2 rounded-lg border text-sm transition-all',
                  activeParentId === cat.id
                    ? 'border-amber-500 bg-amber-50 text-amber-800 font-medium'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sub-category */}
      {subs.length > 0 && (
        <div>
          <Label className="text-base font-semibold mb-2 block">Sub-category</Label>
          <div className="flex flex-wrap gap-2">
            {subs.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onChange({ categoryId: cat.id })}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg border text-sm transition-all',
                  data.categoryId === cat.id
                    ? 'border-amber-500 bg-amber-50 text-amber-800 font-medium'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
