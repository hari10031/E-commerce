'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Tag, FolderTree } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import type { Category } from '@/types';

export default function CategoriesPage() {
  const token = useAuthStore((s) => s.token);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [parentId, setParentId] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    if (!token) return;
    try {
      const res = await api.get<Category[]>('/api/categories', token);
      setCategories(res);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [token]);

  const topLevel = categories.filter((c) => !c.parent_id);
  const childrenOf = (id: string) => categories.filter((c) => c.parent_id === id);

  const openNew = (presetParent = '') => {
    setEditingCategory(null);
    setName('');
    setImageUrl('');
    setParentId(presetParent);
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setImageUrl(cat.image_url ?? '');
    setParentId(cat.parent_id ?? '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !token) return;
    setSaving(true);
    try {
      const payload = { name: name.trim(), image_url: imageUrl, parent_id: parentId || null };
      if (editingCategory) {
        await api.patch(`/api/categories/${editingCategory.id}`, payload, token);
        toast.success('Category updated');
      } else {
        await api.post('/api/categories', payload, token);
        toast.success('Category created');
      }
      setDialogOpen(false);
      fetchCategories();
    } catch (err: unknown) {
      toast.error('Failed to save', err instanceof Error ? err.message : '');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    const kids = childrenOf(cat.id);
    const warn = kids.length
      ? `Delete "${cat.name}" and its ${kids.length} sub-categor${kids.length === 1 ? 'y' : 'ies'}?`
      : `Delete "${cat.name}"?`;
    if (!confirm(warn) || !token) return;
    try {
      await api.delete(`/api/categories/${cat.id}`, token);
      toast.success('Category deleted');
      fetchCategories();
    } catch {
      toast.error('Delete failed');
    }
  };

  // Parent options: top-level categories only (max 2 levels), excluding the one being edited.
  const parentOptions = topLevel.filter((c) => c.id !== editingCategory?.id);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {topLevel.length} categories · {categories.length - topLevel.length} sub-categories
        </p>
        <Button onClick={() => openNew()}>
          <Plus className="w-4 h-4" />
          New Category
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : topLevel.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Tag className="w-10 h-10 mb-3 opacity-40" />
          <p>No categories yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topLevel.map((parent) => {
            const kids = childrenOf(parent.id);
            return (
              <div key={parent.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Parent row */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-50">
                  <div className="relative w-12 h-12 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0">
                    {parent.image_url ? (
                      <Image src={parent.image_url} alt={parent.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Tag className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{parent.name}</p>
                    <p className="text-xs text-gray-400 truncate">/{parent.slug}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => openNew(parent.id)}>
                    <Plus className="w-3 h-3" />
                    Sub-category
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(parent)}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(parent)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Sub-categories */}
                {kids.length > 0 ? (
                  <div className="p-3 flex flex-wrap gap-2">
                    {kids.map((kid) => (
                      <div
                        key={kid.id}
                        className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg pl-3 pr-1.5 py-1.5"
                      >
                        <FolderTree className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-sm text-gray-700">{kid.name}</span>
                        <button
                          className="p-1 rounded hover:bg-gray-200 text-gray-500"
                          onClick={() => openEdit(kid)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          className="p-1 rounded hover:bg-red-100 text-red-500"
                          onClick={() => handleDelete(kid)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 py-3 text-xs text-gray-400">No sub-categories yet.</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Category Name</Label>
              <Input
                placeholder="e.g., Silk Sarees"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Parent Category</Label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">— None (top-level) —</option>
                {parentOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Image URL (optional)</Label>
              <Input
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
