'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Tag, FolderTree, Camera, X } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import type { Category } from '@/types';

const COLLECTION_ROOT_SLUGS = ['saree', 'jewellery'];

function isCollectionRoot(cat: Category | null): boolean {
  if (!cat) return false;
  return !cat.parent_id && COLLECTION_ROOT_SLUGS.includes(cat.slug);
}

function isSubCategoryForm(parentId: string, editing: Category | null): boolean {
  if (parentId) return true;
  if (editing?.parent_id) return true;
  return false;
}

export default function CategoriesPage() {
  const token = useAuthStore((s) => s.token);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [parentId, setParentId] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const topLevel = categories.filter((c) => !c.parent_id);
  const childrenOf = (id: string) => categories.filter((c) => c.parent_id === id);

  const resetImageState = () => {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openNew = (presetParent = '') => {
    setEditingCategory(null);
    setName('');
    resetImageState();
    setParentId(presetParent);
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    resetImageState();
    setImageUrl(cat.image_url ?? '');
    setImagePreview(cat.image_url ?? null);
    setParentId(cat.parent_id ?? '');
    setDialogOpen(true);
  };

  const showCoverPhoto = isSubCategoryForm(parentId, editingCategory);

  const handlePickFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageUrl('');
  };

  const clearPickedImage = () => {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(editingCategory?.image_url ?? null);
    setImageUrl(editingCategory?.image_url ?? '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!name.trim() || !token) return;
    setSaving(true);
    try {
      if (imageFile && showCoverPhoto) {
        const fd = new FormData();
        fd.append('name', name.trim());
        fd.append('parent_id', parentId || '');
        fd.append('image', imageFile);
        if (editingCategory) {
          await api.patchForm<Category>(`/api/categories/${editingCategory.id}`, fd, token);
          toast.success('Category updated');
        } else {
          await api.submitForm<Category>('/api/categories', fd, token, 'POST');
          toast.success('Category created');
        }
      } else {
        const payload = {
          name: name.trim(),
          image_url: showCoverPhoto ? imageUrl || null : undefined,
          parent_id: parentId || null,
        };
        if (editingCategory) {
          await api.patch(`/api/categories/${editingCategory.id}`, payload, token);
          toast.success('Category updated');
        } else {
          await api.post('/api/categories', payload, token);
          toast.success('Category created');
        }
      }
      setDialogOpen(false);
      resetImageState();
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
                <div className="flex items-center gap-3 p-4 border-b border-gray-50">
                  <div className="relative w-12 h-12 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0">
                    {parent.image_url && !isCollectionRoot(parent) ? (
                      <Image src={parent.image_url} alt={parent.name} fill className="object-cover" unoptimized />
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

                {kids.length > 0 ? (
                  <div className="p-3 flex flex-wrap gap-2">
                    {kids.map((kid) => (
                      <div
                        key={kid.id}
                        className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg pl-2 pr-1.5 py-1.5"
                      >
                        <div className="relative w-9 h-9 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                          {kid.image_url ? (
                            <Image src={kid.image_url} alt={kid.name} fill className="object-cover" unoptimized />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FolderTree className="w-3.5 h-3.5 text-amber-400" />
                            </div>
                          )}
                        </div>
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
            {showCoverPhoto && (
              <div className="space-y-2">
                <Label>Cover photo</Label>
                <div className="relative aspect-[4/3] rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                  {imagePreview ? (
                    <Image src={imagePreview} alt="Cover preview" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                      <Camera className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">No cover photo yet</p>
                    </div>
                  )}
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={clearPickedImage}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePickFile(e.target.files?.[0] ?? null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4" />
                  {imagePreview ? 'Change photo' : 'Choose from device'}
                </Button>
                <p className="text-xs text-gray-400">Or paste an image URL below</p>
              </div>
            )}
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
            {showCoverPhoto && (
              <div className="space-y-1.5">
                <Label>Image URL (optional)</Label>
                <Input
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    if (imageFile) {
                      setImageFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                    setImagePreview(e.target.value || null);
                  }}
                  disabled={!!imageFile}
                />
              </div>
            )}
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
