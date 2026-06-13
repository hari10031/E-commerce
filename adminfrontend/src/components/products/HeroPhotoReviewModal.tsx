'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { FreeCropOverlay } from '@/components/products/FreeCropOverlay';
import {
  FULL_CROP,
  buildCroppedHeroFile,
  containLayout,
  type NormCrop,
} from '@/lib/heroImageCrop';

interface HeroPhotoReviewModalProps {
  open: boolean;
  file: File | null;
  slotLabel: string;
  onClose: () => void;
  onConfirm: (file: File) => void;
}

export function HeroPhotoReviewModal({
  open,
  file,
  slotLabel,
  onClose,
  onConfirm,
}: HeroPhotoReviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState('');
  const [crop, setCrop] = useState<NormCrop>(FULL_CROP);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [busy, setBusy] = useState(false);

  const imageReady = natural.w > 0 && natural.h > 0;

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (open && file) {
      setCrop(FULL_CROP);
      setNatural({ w: 0, h: 0 });
    }
  }, [open, file]);

  const layout =
    imageReady && containerSize.w
      ? containLayout(containerSize.w, containerSize.h, natural.w, natural.h)
      : null;

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setContainerSize({ w: width, h: height });
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [open, previewUrl]);

  const finish = async (useCrop: NormCrop) => {
    if (!file || !previewUrl || !imageReady) return;
    setBusy(true);
    try {
      const framed = await buildCroppedHeroFile(previewUrl, useCrop, file.name);
      onConfirm(framed);
      onClose();
    } catch (err: unknown) {
      toast.error(
        'Could not prepare photo',
        err instanceof Error ? err.message : 'Try another image.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{slotLabel}</DialogTitle>
          <DialogDescription>
            Drag handles to choose what stays in frame. We fit your selection to the shop listing
            shape automatically — no fixed ratio while you crop.
          </DialogDescription>
        </DialogHeader>

        {previewUrl && (
          <div
            ref={containerRef}
            className="relative w-full rounded-xl overflow-hidden bg-[#fef7f0] border border-amber-100"
            style={{ height: 400 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Crop preview"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              onLoad={(e) => {
                const img = e.currentTarget;
                setNatural({ w: img.naturalWidth, h: img.naturalHeight });
              }}
            />
            {!imageReady && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-amber-800">
                Loading photo…
              </div>
            )}
            {layout && imageReady && (
              <FreeCropOverlay layout={layout} crop={crop} onCropChange={setCrop} />
            )}
          </div>
        )}

        <p className="text-xs text-gray-500">
          Tip: frame the main product shot, then choose Use selection or Use full photo. Detail
          slots like border or pallu skip this step.
        </p>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => finish(FULL_CROP)}
            disabled={busy || !file || !imageReady}
          >
            Use full photo
          </Button>
          <Button onClick={() => finish(crop)} disabled={busy || !file || !imageReady}>
            {busy ? 'Saving…' : 'Use selection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
