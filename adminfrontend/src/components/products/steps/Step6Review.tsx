'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { formatPrice, discountedPrice } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import type { WizardData } from '../ProductWizard';

interface Step6Props {
  data: WizardData;
  editId?: string;
}

export function Step6Review({ data, editId }: Step6Props) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [saving, setSaving] = useState(false);

  const save = async (published: boolean) => {
    if (!token) return;
    setSaving(true);
    try {
      const productPayload = {
        title: data.content.title,
        description: data.content.description,
        type: data.type,
        category_id: data.categoryId,
        base_price: data.pricing.basePrice,
        discount_pct: data.pricing.discountPercent,
        published,
      };

      let productId: string;
      if (editId) {
        await api.put<{ id: string }>(`/api/products/${editId}`, productPayload, token);
        productId = editId;
      } else {
        const created = await api.post<{ id: string }>('/api/products', productPayload, token);
        productId = created.id;
      }

      // Post variants
      for (const variant of data.variants) {
        if (variant.quantity > 0) {
          await api.post('/api/products/' + productId + '/variants', {
            color: variant.color,
            size: variant.size,
            quantity: variant.quantity,
            sku: variant.sku,
          }, token);
        }
      }

      // Post images. display_order 0-9 = AI-generated, 10-19 = uploaded
      // originals. Storefront sorts ascending so generated shots lead.
      for (let i = 0; i < data.images.length; i++) {
        const img = data.images[i];
        const base = img.aiGenerated ? 0 : 10;
        await api.post('/api/products/' + productId + '/images', {
          color: img.color,
          url: img.imageUrl,
          is_primary: i === 0,
          display_order: base + i,
        }, token);
      }

      // Post coupon if any
      if (data.pricing.hasCoupon && data.pricing.couponCode) {
        await api.post('/api/coupons', {
          code: data.pricing.couponCode,
          discount_percent: data.pricing.couponDiscount,
          product_id: productId,
        }, token);
      }

      toast.success(published ? 'Product published!' : 'Saved as draft');
      router.push('/dashboard/products');
    } catch (err: unknown) {
      toast.error('Failed to save product', err instanceof Error ? err.message : '');
    } finally {
      setSaving(false);
    }
  };

  const finalPrice = discountedPrice(data.pricing.basePrice, data.pricing.discountPercent);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Product Info */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Product Info</h4>
          <p className="font-medium text-gray-900">{data.content.title || <em className="text-gray-400">No title</em>}</p>
          <p className="text-sm text-gray-500 capitalize">Type: {data.type}</p>
          <p className="text-sm text-gray-500">Category ID: {data.categoryId || '—'}</p>
        </div>

        {/* Pricing */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Pricing</h4>
          <p className="text-sm text-gray-500">Base: {formatPrice(data.pricing.basePrice)}</p>
          <p className="text-sm text-gray-500">Discount: {data.pricing.discountPercent}%</p>
          <p className="font-bold text-amber-700">Final: {formatPrice(finalPrice)}</p>
          {data.pricing.hasCoupon && (
            <p className="text-sm text-purple-600">Coupon: {data.pricing.couponCode} ({data.pricing.couponDiscount}% off)</p>
          )}
        </div>

        {/* Images */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
            Images ({data.images.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.images.map((img, i) => (
              <div key={i} className="relative">
                <Image
                  src={img.imageUrl}
                  alt={img.color}
                  width={48}
                  height={48}
                  className="rounded-lg object-contain"
                />
                <span className="absolute -bottom-1 left-0 right-0 text-center text-xs text-gray-600 leading-none">
                  {img.color.slice(0, 5)}
                </span>
              </div>
            ))}
            {data.images.length === 0 && <p className="text-sm text-gray-400">No images</p>}
          </div>
        </div>

        {/* Variants */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
            Variants ({data.variants.filter((v) => v.quantity > 0).length} in stock)
          </h4>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {data.variants.filter((v) => v.quantity > 0).map((v, i) => (
              <div key={i} className="flex justify-between text-xs text-gray-600">
                <span>{v.color} / {v.size}</span>
                <span className="font-medium">Qty: {v.quantity}</span>
              </div>
            ))}
            {data.variants.filter((v) => v.quantity > 0).length === 0 && (
              <p className="text-sm text-red-500">No variants with stock</p>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {data.content.description && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-2">Description</h4>
          <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-4">{data.content.description}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => save(false)}
          disabled={saving}
          className="flex-1"
        >
          {saving ? 'Saving...' : 'Save as Draft'}
        </Button>
        <Button
          onClick={() => save(true)}
          disabled={saving}
          className="flex-1"
        >
          {saving ? 'Publishing...' : 'Publish Now'}
        </Button>
      </div>
    </div>
  );
}
