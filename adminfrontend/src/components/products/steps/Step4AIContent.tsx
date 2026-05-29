'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import type { ColorImagePair } from '@/lib/productImages';
import type { ProductType } from '@/types';

function primaryPhotoForContent(images: ColorImagePair[]): { url: string; color?: string } | null {
  const withUpload = images.find((i) => i.uploadedUrl);
  if (withUpload?.uploadedUrl) {
    return { url: withUpload.uploadedUrl, color: withUpload.color };
  }
  const withPreview = images.find((i) => i.imageUrl);
  if (withPreview?.imageUrl) {
    return { url: withPreview.imageUrl, color: withPreview.color };
  }
  return null;
}

interface Step4Data {
  title: string;
  description: string;
}

interface Step4Props {
  data: Step4Data;
  onChange: (data: Partial<Step4Data>) => void;
  productType: ProductType;
  categoryId: string;
  images: ColorImagePair[];
}

export function Step4AIContent({
  data,
  onChange,
  productType,
  categoryId,
  images,
}: Step4Props) {
  const token = useAuthStore((s) => s.token);
  const [generating, setGenerating] = useState(false);
  const MAX_TITLE = 80;

  const handleGenerate = async () => {
    if (!token) return;
    const photo = primaryPhotoForContent(images);
    if (!photo) {
      toast.error('Upload a product photo in Step 2 first');
      return;
    }
    setGenerating(true);
    try {
      const res = await api.post<{ title: string; description: string }>(
        '/api/ai/generate-content',
        {
          imageUrl: photo.url,
          productType,
          category: categoryId,
          color: photo.color,
        },
        token
      );
      onChange({ title: res.title?.slice(0, MAX_TITLE) ?? data.title, description: res.description ?? data.description });
      toast.success('AI content generated');
    } catch (err: unknown) {
      toast.error('Generation failed', err instanceof Error ? err.message : '');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={handleGenerate}
          disabled={generating}
          className="text-purple-600 border-purple-200 hover:bg-purple-50"
        >
          <Sparkles className="w-4 h-4" />
          {generating ? 'Generating...' : 'Generate with AI'}
        </Button>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="product-title">Product Title</Label>
          <span className={`text-xs ${data.title.length > MAX_TITLE - 10 ? 'text-red-500' : 'text-gray-400'}`}>
            {data.title.length}/{MAX_TITLE}
          </span>
        </div>
        <Input
          id="product-title"
          placeholder="Enter a descriptive product title..."
          value={data.title}
          maxLength={MAX_TITLE}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="product-description">Product Description</Label>
        <textarea
          id="product-description"
          placeholder="Describe the product in detail..."
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={6}
          className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
      </div>
    </div>
  );
}
