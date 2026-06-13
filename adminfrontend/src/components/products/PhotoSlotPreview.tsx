'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface PhotoSlotPreviewProps {
  src: string;
  alt: string;
  className?: string;
}

/** Reliable slot preview — avoids Next/Image remote optimizer blank tiles. */
export function PhotoSlotPreview({ src, alt, className }: PhotoSlotPreviewProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center bg-[#fef7f0] text-xs text-amber-800 px-2 text-center',
          className
        )}
      >
        Preview unavailable
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn('absolute inset-0 w-full h-full object-cover', className)}
      onError={() => setFailed(true)}
    />
  );
}
