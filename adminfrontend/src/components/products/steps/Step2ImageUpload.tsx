'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Trash2, Sparkles, Plus, X } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { quotaUserMessage } from '@/lib/quotaError';
import { HeroPhotoReviewModal } from '@/components/products/HeroPhotoReviewModal';
import { PhotoSlotPreview } from '@/components/products/PhotoSlotPreview';
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

function revokePreview(url: string | undefined, registry: Set<string>) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
    registry.delete(url);
  }
}

function trackPreview(url: string | undefined, registry: Set<string>) {
  if (url?.startsWith('blob:')) registry.add(url);
}

export function Step2ImageUpload({
  productType,
  colors,
  onColorsChange,
  data,
  onChange,
}: Step2Props) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const blobUrlsRef = useRef<Set<string>>(new Set());
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

  const photoHint =
    'Main product shot: drag crop handles freely — we frame it for the shop. Detail slots keep your full photo.';

  useEffect(() => {
    if (isJewellery && colors.length === 0) {
      onColorsChange([JEWELLERY_PSEUDO_COLOR]);
    }
  }, [isJewellery, colors.length, onColorsChange]);

  useEffect(() => {
    const registry = blobUrlsRef.current;
    return () => {
      registry.forEach((url) => URL.revokeObjectURL(url));
      registry.clear();
    };
  }, []);

  const imageFor = (color: string, slot: string) =>
    data.find((i) => i.color === color && i.slot === slot);

  const upsertSlot = (color: string, slot: string, patch: Partial<ColorImagePair>) => {
    const existing = imageFor(color, slot);
    if (existing) {
      if (patch.previewUrl && existing.previewUrl && patch.previewUrl !== existing.previewUrl) {
        revokePreview(existing.previewUrl, blobUrlsRef.current);
      }
      if (patch.previewUrl) trackPreview(patch.previewUrl, blobUrlsRef.current);
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
        imageUrl: patch.imageUrl ?? patch.previewUrl ?? '',
        previewUrl: patch.previewUrl,
        uploadedUrl: patch.uploadedUrl,
        generatedUrl: patch.generatedUrl,
        aiGenerated: patch.aiGenerated,
      },
    ]);
    if (patch.previewUrl) trackPreview(patch.previewUrl, blobUrlsRef.current);
  };

  const removeSlot = (color: string, slot: string) => {
    const existing = imageFor(color, slot);
    revokePreview(existing?.previewUrl, blobUrlsRef.current);
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
    data.filter((i) => i.color === color).forEach((img) => revokePreview(img.previewUrl, blobUrlsRef.current));
    onColorsChange(colors.filter((c) => c !== color));
    onChange(data.filter((i) => i.color !== color));
  };

  const uploadFile = async (
    color: string,
    slot: string,
    file: File,
    localPreview?: string
  ) => {
    if (!token) {
      toast.error('Session expired', 'Please log in again.');
      if (localPreview) revokePreview(localPreview, blobUrlsRef.current);
      return;
    }
    const key = slotKey(color, slot);
    const hero = isHeroPhotoSlot(productType, slot);
    const frame = hero ? 'hero' : 'detail';
    const preframed = hero;
    setUploadingKey(key);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('frame', frame);
      formData.append('preframed', preframed ? 'true' : 'false');
      const res = await api.uploadForm<{ url: string }>('/api/upload/image', formData, token);
      upsertSlot(color, slot, {
        uploadedUrl: res.url,
        imageUrl: res.url,
        previewUrl: undefined,
        aiGenerated: false,
      });
      if (localPreview) revokePreview(localPreview, blobUrlsRef.current);
    } catch (err: unknown) {
      if (localPreview) {
        upsertSlot(color, slot, {
          imageUrl: localPreview,
          previewUrl: localPreview,
          uploadedUrl: undefined,
        });
      }
      toast.error('Upload failed', err instanceof Error ? err.message : '');
    } finally {
      setUploadingKey('');
    }
  };

  const beginUpload = async (color: string, slot: string, file: File) => {
    const localPreview = URL.createObjectURL(file);
    trackPreview(localPreview, blobUrlsRef.current);
    upsertSlot(color, slot, {
      imageUrl: localPreview,
      previewUrl: localPreview,
      uploadedUrl: undefined,
      generatedUrl: undefined,
      aiGenerated: false,
    });
    await uploadFile(color, slot, file, localPreview);
  };

  const handleFile = async (color: string, slot: string, file: File) => {
    if (isHeroPhotoSlot(productType, slot)) {
      setHeroReview({ color, slot, file });
      return;
    }
    await beginUpload(color, slot, file);
  };

  const generateImage = async (color: string, slot: string) => {
    const img = imageFor(color, slot);
    const sourceUrl = img?.uploadedUrl || img?.imageUrl;
    if (!sourceUrl || sourceUrl.startsWith('blob:') || !token) {
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
      const quotaMsg = quotaUserMessage(err, user?.role === 'admin');
      if (quotaMsg) {
        toast.error('AI quota exhausted', quotaMsg);
      } else {
        toast.error('AI generation failed', err instanceof Error ? err.message : '');
      }
    } finally {
      setGeneratingKey('');
    }
  };

  const slotPreviewSrc = (img: ColorImagePair) =>
    img.previewUrl || img.imageUrl || img.uploadedUrl || img.generatedUrl || '';

  const renderSlot = (color: string, slot: string) => {
    const key = slotKey(color, slot);
    const img = imageFor(color, slot);
    const isUp = uploadingKey === key;
    const isGen = generatingKey === key;
    const previewSrc = img ? slotPreviewSrc(img) : '';

    return (
      <div key={key} className="w-[48%] mb-3">
        <div
          className="relative rounded-xl border overflow-hidden aspect-[3/4] bg-[#fef7f0] cursor-pointer hover:border-amber-400 transition-colors"
          style={{ borderColor: img ? '#f59e0b' : '#e5e7eb' }}
          onClick={() => !isUp && fileRefs.current[key]?.click()}
        >
          {previewSrc ? (
            <>
              <PhotoSlotPreview src={previewSrc} alt={slot} />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 z-[1]">
                <p className="text-[10px] text-white font-medium truncate">{slot}</p>
              </div>
              {img?.aiGenerated && (
                <span className="absolute top-1.5 right-1.5 text-[10px] font-bold text-white bg-violet-600 rounded-full px-1.5 py-0.5 z-[1]">
                  ✨ AI
                </span>
              )}
              {isUp && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-[2]">
                  <span className="text-xs text-white font-medium">Uploading…</span>
                </div>
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
            e.target.value = '';
          }}
        />
        {img && (
          <div className="flex gap-1 mt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 flex-1 text-[11px] text-indigo-600 px-1"
              disabled={isGen || isUp || !!img.previewUrl && !img.uploadedUrl}
              onClick={() => generateImage(color, slot)}
            >
              <Sparkles className="w-3 h-3" />
              {isGen ? '…' : 'AI'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 text-red-500 px-0"
              disabled={isUp}
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
          setHeroReview(null);
        }}
        onConfirm={async (file) => {
          if (!heroReview) return;
          const { color, slot } = heroReview;
          setHeroReview(null);
          await beginUpload(color, slot, file);
        }}
      />
      <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
        {isJewellery
          ? `Up to ${blocks.length} optional photo slots. Upload any angles you have, then use AI for a clean studio shot.`
          : `Add each colour, then up to ${blocks.length} optional photos per colour — fill only the slots you have.`}
      </p>
      <p className="text-xs text-gray-500">{photoHint}</p>

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
