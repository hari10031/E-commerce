'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  clampCrop,
  normToDisplay,
  type ContainLayout,
  type NormCrop,
} from '@/lib/heroImageCrop';

const HANDLE = 14;
const MIN_SPAN = 0.08;

type HandleId = 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | 'move';

function adjustCropFromDrag(
  start: NormCrop,
  handle: HandleId,
  dx: number,
  dy: number,
  layout: ContainLayout
): NormCrop {
  const dnx = dx / layout.width;
  const dny = dy / layout.height;
  let { left, top, right, bottom } = start;
  switch (handle) {
    case 'tl':
      left += dnx;
      top += dny;
      break;
    case 'tr':
      right += dnx;
      top += dny;
      break;
    case 'bl':
      left += dnx;
      bottom += dny;
      break;
    case 'br':
      right += dnx;
      bottom += dny;
      break;
    case 't':
      top += dny;
      break;
    case 'b':
      bottom += dny;
      break;
    case 'l':
      left += dnx;
      break;
    case 'r':
      right += dnx;
      break;
    case 'move':
      left += dnx;
      top += dny;
      right += dnx;
      bottom += dny;
      break;
    default:
      break;
  }
  return clampCrop({ left, top, right, bottom }, MIN_SPAN);
}

interface FreeCropOverlayProps {
  layout: ContainLayout;
  crop: NormCrop;
  onCropChange: (crop: NormCrop) => void;
}

export function FreeCropOverlay({ layout, crop, onCropChange }: FreeCropOverlayProps) {
  const dragRef = useRef<{
    handle: HandleId;
    startCrop: NormCrop;
    startX: number;
    startY: number;
  } | null>(null);
  const onCropChangeRef = useRef(onCropChange);
  onCropChangeRef.current = onCropChange;

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      const d = dragRef.current;
      if (!d) return;
      e.preventDefault();
      const point = 'touches' in e ? e.touches[0] : e;
      onCropChangeRef.current(
        adjustCropFromDrag(
          d.startCrop,
          d.handle,
          point.clientX - d.startX,
          point.clientY - d.startY,
          layout
        )
      );
    };

    const onUp = () => {
      dragRef.current = null;
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
    document.addEventListener('touchcancel', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
      document.removeEventListener('touchcancel', onUp);
    };
  }, [layout]);

  const beginDrag = useCallback(
    (handle: HandleId, startCrop: NormCrop) => (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const point = 'touches' in e ? e.touches[0] : e;
      dragRef.current = {
        handle,
        startCrop,
        startX: point.clientX,
        startY: point.clientY,
      };
    },
    []
  );

  if (!layout.width) return null;

  const box = normToDisplay(crop, layout);
  const { x, y, width: cw, height: ch } = layout;

  const handles: Array<{ id: HandleId; left: number; top: number }> = [
    { id: 'tl', left: box.left - HANDLE / 2, top: box.top - HANDLE / 2 },
    { id: 'tr', left: box.left + box.width - HANDLE / 2, top: box.top - HANDLE / 2 },
    { id: 'bl', left: box.left - HANDLE / 2, top: box.top + box.height - HANDLE / 2 },
    { id: 'br', left: box.left + box.width - HANDLE / 2, top: box.top + box.height - HANDLE / 2 },
    { id: 't', left: box.left + box.width / 2 - HANDLE / 2, top: box.top - HANDLE / 2 },
    { id: 'b', left: box.left + box.width / 2 - HANDLE / 2, top: box.top + box.height - HANDLE / 2 },
    { id: 'l', left: box.left - HANDLE / 2, top: box.top + box.height / 2 - HANDLE / 2 },
    { id: 'r', left: box.left + box.width - HANDLE / 2, top: box.top + box.height / 2 - HANDLE / 2 },
  ];

  const shade = (l: number, t: number, w: number, h: number, key: string) => (
    <div
      key={key}
      className="absolute pointer-events-none bg-black/45"
      style={{ left: l, top: t, width: Math.max(0, w), height: Math.max(0, h) }}
    />
  );

  return (
    <div className="absolute inset-0 z-10 touch-none">
      {shade(x, y, box.left - x, ch, 'l')}
      {shade(box.left, y, box.width, box.top - y, 't')}
      {shade(box.left, box.top + box.height, box.width, y + ch - (box.top + box.height), 'b')}
      {shade(box.left + box.width, y, x + cw - (box.left + box.width), ch, 'r')}

      <div
        role="presentation"
        onMouseDown={beginDrag('move', crop)}
        onTouchStart={beginDrag('move', crop)}
        className="absolute border-2 border-white cursor-move z-[15]"
        style={{
          left: box.left,
          top: box.top,
          width: box.width,
          height: box.height,
        }}
      />

      {handles.map((h) => (
        <div
          key={h.id}
          role="presentation"
          onMouseDown={beginDrag(h.id, crop)}
          onTouchStart={beginDrag(h.id, crop)}
          className="absolute rounded-full bg-white border-2 border-amber-700 cursor-pointer z-20"
          style={{
            left: h.left,
            top: h.top,
            width: HANDLE,
            height: HANDLE,
          }}
        />
      ))}
    </div>
  );
}
