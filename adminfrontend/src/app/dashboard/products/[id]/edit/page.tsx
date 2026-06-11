'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import dynamic from 'next/dynamic';
import type { WizardData } from '@/components/products/ProductWizard';

const ProductWizard = dynamic(
  () => import('@/components/products/ProductWizard').then((m) => m.ProductWizard),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    ),
  }
);
import { Skeleton } from '@/components/ui/skeleton';
import {
  deriveColorsFromProduct,
  mapProductImagesFromDb,
} from '@/lib/productImages';
import type { Product } from '@/types';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const token = useAuthStore((s) => s.token);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !id) return;
    api.get<Product>(`/api/products/${id}`, token)
      .then(setProduct)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!product) {
    return <div className="text-center py-20 text-gray-400">Product not found</div>;
  }

  const colors = deriveColorsFromProduct(
    product.type,
    product.variants ?? [],
    product.images ?? []
  );
  const images = mapProductImagesFromDb(product.images ?? [], product.type, colors);

  const initialData: Partial<WizardData> = {
    type: product.type,
    categoryId: product.category_id,
    colors,
    images,
    variants: (product.variants ?? []).map((v) => ({
      color: v.color,
      size: v.size,
      quantity: v.quantity,
      sku: v.sku,
    })),
    content: {
      title: product.title,
      description: product.description,
    },
    pricing: {
      basePrice: product.base_price,
      discountPercent: product.discount_pct,
      couponCode: '',
      couponDiscount: 0,
      hasCoupon: false,
    },
  };

  return (
    <div>
      <ProductWizard
        editId={id}
        initialData={initialData}
        existingImages={product.images ?? []}
      />
    </div>
  );
}
