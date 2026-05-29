'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Trash2, Sparkles, Plus, X } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { HeroPhotoReviewModal } from '@/components/products/HeroPhotoReviewModal';
import { JEWELLERY_PSEUDO_COLOR, isHeroPhotoSlot, photoBlocksFor } from '@/lib/photoBlocks';
import { slotKey, type ColorImagePair } from '@/lib/productImages';
import type { ProductType } from '@/types';

export type { ColorImagePair };

interface Step2Props {
  productType: ProductType;
  colors: string[];
  onColorsChange: (colors: string[]) => void;
  data: ColorImagePair[];
  onChange: (pairs: ColorImagePair[]) => void;
}

export function Step2ImageUpload({
  productType,
  colors,
  onColorsChange,
  data,
  onChange,
}: Step2Props) {
  const token = useAuthStore((s) => s.token);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [uploadingKey, setUploadingKey] = useState('');
  const [generatingKey, setGeneratingKey] = useState('');
  const [newColor, setNewColor] = useState('');
  const [heroReview, setHeroReview] = useState<{
    color: string;
    slot: string;
    file: File;
  } | null>(null);

  const blocks = photoBlocksFor(productType);
  const isJewellery = productType === 'jewellery';

  useEffect(() => {
    if (isJewellery && colors.length === 0) {
      onColorsChange([JEWELLERY_PSEUDO_COLOR]);
    }
  }, [isJewellery, colors.length, onColorsChange]);

  const imageFor = (color: string, slot: string) =>
    data.find((i) => i.color === color && i.slot === slot);

  const upsertSlot = (color: string, slot: string, patch: Partial<ColorImagePair>) => {
    const existing = imageFor(color, slot);
    if (existing) {
      onChange(
        data.map((i) =>
          i.color === color && i.slot === slot ? { ...i, ...patch } : i
        )
      );
      return;
    }
    onChange([
      ...data,
      {
        color,
        slot,
        imageUrl: patch.imageUrl ?? '',
        uploadedUrl: patch.uploadedUrl,
        generatedUrl: patch.generatedUrl,
        aiGenerated: patch.aiGenerated,
      },
    ]);
  };

  const removeSlot = (color: string, slot: string) => {
    onChange(data.filter((i) => !(i.color === color && i.slot === slot)));
    const ref = fileRefs.current[slotKey(color, slot)];
    if (ref) ref.value = '';
  };

  const addColor = () => {
    const name = newColor.trim();
    if (!name) return;
    if (colors.some((c) => c.toLowerCase() === name.toLowerCase())) {
      toast.error('Color already added');
      return;
    }
    onColorsChange([...colors, name]);
    setNewColor('');
  };

  const removeColor = (color: string) => {
    onColorsChange(colors.filter((c) => c !== color));
    onChange(data.filter((i) => i.color !== color));
  };

  const uploadFile = async (color: string, slot: string, file: File) => {
    if (!token) {
      toast.error('Session expired', 'Please log in again.');
      return;
    }
    const key = slotKey(color, slot);
    setUploadingKey(key);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.uploadForm<{ url: string }>('/api/upload/image', formData, token);
      upsertSlot(color, slot, {
        uploadedUrl: res.url,
        imageUrl: res.url,
        aiGenerated: false,
      });
    } catch (err: unknown) {
      toast.error('Upload failed', err instanceof Error ? err.message : '');
    } finally {
      setUploadingKey('');
    }
  };

  const handleFile = async (color: string, slot: string, file: File) => {
    if (isHeroPhotoSlot(productType, slot)) {
      setHeroReview({ color, slot, file });
      return;
    }
    await uploadFile(color, slot, file);
  };

  const generateImage = async (color: string, slot: string) => {
    const img = imageFor(color, slot);
    const sourceUrl = img?.uploadedUrl || img?.imageUrl;
    if (!sourceUrl || !token) {
      toast.error('Upload a photo first');
      return;
    }
    const key = slotKey(color, slot);
    setGeneratingKey(key);
    try {
      const res = await api.post<{ url: string }>(
        '/api/ai/generate-image',
        { imageUrl: sourceUrl, productType, color },
        token
      );
      upsertSlot(color, slot, {
        generatedUrl: res.url,
        imageUrl: res.url,
        uploadedUrl: img?.uploadedUrl,
        aiGenerated: true,
      });
      toast.success('AI image generated');
    } catch (err: unknown) {
      toast.error('AI generation failed', err instanceof Error ? err.message : '');
    } finally {
      setGeneratingKey('');
    }
  };

  const renderSlot = (color: string, slot: string) => {
    const key = slotKey(color, slot);
    const img = imageFor(color, slot);
    const isUp = uploadingKey === key;
    const isGen = generatingKey === key;

    return (
      <div key={key} className="w-[48%] mb-3">
        <div
          className="relative rounded-xl border overflow-hidden aspect-[3/4] bg-[#fef7f0] cursor-pointer hover:border-amber-400 transition-colors"
          style={{ borderColor: img ? '#f59e0b' : '#e5e7eb' }}
          onClick={() => !isUp && fileRefs.current[key]?.click()}
        >
          {img?.imageUrl ? (
            <>
              <Image src={img.imageUrl} alt={slot} fill className="object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                <p className="text-[10px] text-white font-medium truncate">{slot}</p>
              </div>
              {img.aiGenerated && (
                <span className="absolute top-1.5 right-1.5 text-[10px] font-bold text-white bg-violet-600 rounded-full px-1.5 py-0.5">
                  ✨ AI
                </span>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
              {isUp ? (
                <span className="text-xs text-amber-700">Uploading…</span>
              ) : (
                <>
                  <p className="text-[11px] font-medium text-center text-amber-900 mb-1">{slot}</p>
                  <Upload className="w-4 h-4 text-amber-600" />
                </>
              )}
            </div>
          )}
        </div>
        <input
          ref={(el) => { fileRefs.current[key] = el; }}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(color, slot, file);
          }}
        />
        {img && (
          <div className="flex gap-1 mt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 flex-1 text-[11px] text-indigo-600 px-1"
              disabled={isGen}
              onClick={() => generateImage(color, slot)}
            >
              <Sparkles className="w-3 h-3" />
              {isGen ? '…' : 'AI'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 text-red-500 px-0"
              onClick={() => removeSlot(color, slot)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <HeroPhotoReviewModal
        open={!!heroReview}
        file={heroReview?.file ?? null}
        slotLabel={heroReview?.slot ?? ''}
        onClose={() => {
          if (heroReview) {
            const ref = fileRefs.current[slotKey(heroReview.color, heroReview.slot)];
            if (ref) ref.value = '';
          }
          setHeroReview(null);
        }}
        onConfirm={async (file) => {
          if (!heroReview) return;
          const { color, slot } = heroReview;
          setHeroReview(null);
          await uploadFile(color, slot, file);
        }}
      />
      <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
        {isJewellery
          ? `Up to ${blocks.length} optional photo slots. Upload any angles you have, then use AI for a clean studio shot.`
          : `Add each colour, then up to ${blocks.length} optional photos per colour — fill only the slots you have.`}
      </p>

      {!isJewellery && (
        <div className="flex gap-2">
          <div className="flex-1">
            <Label>Colour name</Label>
            <Input
              placeholder="e.g., Crimson Red"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addColor(); }}
              className="mt-1"
            />
          </div>
          <Button className="mt-6" size="sm" onClick={addColor} disabled={!newColor.trim()}>
            <Plus className="w-4 h-4" />
            Add colour
          </Button>
        </div>
      )}

      {colors.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">
          {isJewellery ? 'Loading…' : 'Add at least one colour to continue.'}
        </p>
      ) : (
        colors.map((color) => (
          <div key={color} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">{color}</h4>
              {!isJewellery && colors.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeColor(color)}
                  className="text-gray-400 hover:text-red-500 p-1"
                  aria-label={`Remove ${color}`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap justify-between">
              {blocks.map((slot) => renderSlot(color, slot))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
