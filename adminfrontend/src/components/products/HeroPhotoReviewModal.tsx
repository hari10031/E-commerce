'use client';

import { useCallback, useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cropImageFile } from '@/lib/cropImage';

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
  const [mode, setMode] = useState<'review' | 'crop'>('review');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

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
    if (open) {
      setMode('review');
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedArea(null);
    }
  }, [open, file]);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedArea(pixels);
  }, []);

  const handleUseOriginal = async () => {
    if (!file) return;
    setBusy(true);
    try {
      onConfirm(file);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const handleApplyCrop = async () => {
    if (!file || !croppedArea) return;
    setBusy(true);
    try {
      const cropped = await cropImageFile(file, croppedArea);
      onConfirm(cropped);
      onClose();
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{slotLabel}</DialogTitle>
          <DialogDescription>
            {mode === 'review'
              ? 'Use the full photo or optionally crop to a 3:4 listing frame.'
              : 'Drag and zoom to frame your main product shot.'}
          </DialogDescription>
        </DialogHeader>

        {previewUrl && mode === 'review' && (
          <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-[#fef7f0] border border-amber-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
          </div>
        )}

        {previewUrl && mode === 'crop' && (
          <div className="relative w-full h-72 rounded-xl overflow-hidden bg-neutral-900">
            <Cropper
              image={previewUrl}
              crop={crop}
              zoom={zoom}
              aspect={3 / 4}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
        )}

        {mode === 'crop' && (
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-amber-600"
            aria-label="Zoom"
          />
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {mode === 'review' ? (
            <>
              <Button variant="outline" onClick={onClose} disabled={busy}>
                Cancel
              </Button>
              <Button variant="outline" onClick={() => setMode('crop')} disabled={busy}>
                Adjust crop (3:4)
              </Button>
              <Button onClick={handleUseOriginal} disabled={busy}>
                Use photo
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setMode('review')} disabled={busy}>
                Back
              </Button>
              <Button onClick={handleApplyCrop} disabled={busy || !croppedArea}>
                Apply crop
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
