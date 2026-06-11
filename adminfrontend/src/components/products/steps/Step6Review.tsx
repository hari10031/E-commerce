'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { formatPrice, discountedPrice } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import { buildImageUploadPayloads } from '@/lib/productImages';
import type { WizardData } from '../ProductWizard';
import type { ProductImage } from '@/types';
import { resolveColorHex } from '@/lib/colors';

interface Step6Props {
  data: WizardData;
  editId?: string;
  existingImages?: ProductImage[];
}

export function Step6Review({ data, editId, existingImages = [] }: Step6Props) {
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
      };

      let productId: string;
      if (editId) {
        await api.patch<{ id: string }>(`/api/products/${editId}`, productPayload, token);
        productId = editId;
      } else {
        const created = await api.post<{ id: string }>('/api/products', productPayload, token);
        productId = created.id;
      }

      if (editId && existingImages.length > 0) {
        await Promise.all(
          existingImages
            .filter((img) => img.id)
            .map((img) =>
              api.delete(`/api/products/${productId}/images/${img.id}`, token).catch(() => {})
            )
        );
      }

      const variants = data.variants
        .filter((v) => v.quantity > 0)
        .map((v) => ({
          color: data.type === 'jewellery' ? '' : v.color,
          size: v.size,
          quantity: v.quantity,
          sku: v.sku,
        }));

      if (variants.length > 0) {
        await api.put(`/api/variants/product/${productId}/bulk`, { variants }, token);
      }

      const imagePayloads = buildImageUploadPayloads(data.type, data.colors, data.images);
      if (imagePayloads.length > 0) {
        await Promise.all(
          imagePayloads.map((payload) =>
            api.post(`/api/products/${productId}/images`, payload, token)
          )
        );
      }

      if (data.pricing.hasCoupon && data.pricing.couponCode) {
        await api.post(
          '/api/coupons',
          {
            code: data.pricing.couponCode,
            discount_percent: data.pricing.couponDiscount,
            product_id: productId,
          },
          token
        );
      }

      if (published) {
        await api.post(`/api/products/${productId}/publish`, {}, token);
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
  const filledImages = data.images.filter((i) => i.imageUrl);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Product Info</h4>
          <p className="font-medium text-gray-900">{data.content.title || <em className="text-gray-400">No title</em>}</p>
          <p className="text-sm text-gray-500 capitalize">Type: {data.type}</p>
          <div className="flex flex-wrap gap-2">
            {data.colors.length === 0 ? (
              <p className="text-sm text-gray-500">Colours: —</p>
            ) : (
              data.colors.map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                  <span
                    className="h-3.5 w-3.5 rounded-full ring-1 ring-inset ring-black/10"
                    style={{ backgroundColor: resolveColorHex(c) }}
                  />
                  {c}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Pricing</h4>
          <p className="text-sm text-gray-500">Base: {formatPrice(data.pricing.basePrice)}</p>
          <p className="text-sm text-gray-500">Discount: {data.pricing.discountPercent}%</p>
          <p className="font-bold text-amber-700">Final: {formatPrice(finalPrice)}</p>
          {data.pricing.hasCoupon && (
            <p className="text-sm text-purple-600">
              Coupon: {data.pricing.couponCode} ({data.pricing.couponDiscount}% off)
            </p>
          )}
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
            Images ({filledImages.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {filledImages.map((img, i) => (
              <div key={i} className="relative w-12 aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={img.imageUrl}
                  alt={img.slot}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
                <span className="absolute -bottom-1 left-0 right-0 text-center text-[10px] text-gray-600 leading-none truncate">
                  {img.slot.slice(0, 8)}
                </span>
              </div>
            ))}
            {filledImages.length === 0 && <p className="text-sm text-gray-400">No images</p>}
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
            Variants ({data.variants.filter((v) => v.quantity > 0).length} in stock)
          </h4>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {data.variants
              .filter((v) => v.quantity > 0)
              .map((v, i) => (
                <div key={i} className="flex justify-between items-center text-xs text-gray-600 gap-2">
                  <span className="inline-flex items-center gap-1.5 min-w-0">
                    {v.color && (
                      <span
                        className="h-3 w-3 rounded-full shrink-0 ring-1 ring-inset ring-black/10"
                        style={{ backgroundColor: resolveColorHex(v.color) }}
                      />
                    )}
                    <span className="truncate">
                      {v.color || '—'} / {v.size || 'STD'}
                    </span>
                  </span>
                  <span className="font-medium">Qty: {v.quantity}</span>
                </div>
              ))}
            {data.variants.filter((v) => v.quantity > 0).length === 0 && (
              <p className="text-sm text-red-500">No variants with stock</p>
            )}
          </div>
        </div>
      </div>

      {data.content.description && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-2">Description</h4>
          <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-4">{data.content.description}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={() => save(false)} disabled={saving} className="flex-1">
          {saving ? 'Saving...' : 'Save as Draft'}
        </Button>
        <Button onClick={() => save(true)} disabled={saving} className="flex-1">
          {saving ? 'Publishing...' : 'Publish Now'}
        </Button>
      </div>
    </div>
  );
}
