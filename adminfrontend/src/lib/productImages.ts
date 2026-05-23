import type { ProductImage, ProductType } from '@/types';
import { JEWELLERY_PSEUDO_COLOR, photoBlocksFor } from './photoBlocks';

export interface ColorImagePair {
  color: string;
  slot: string;
  /** Preview URL — prefers AI shot when present. */
  imageUrl: string;
  uploadedUrl?: string;
  generatedUrl?: string;
  aiGenerated?: boolean;
}

export function slotKey(color: string, slot: string) {
  return `${color}::${slot}`;
}

/** Map DB product_images rows back into wizard slots (matches mobile edit flow). */
export function mapProductImagesFromDb(
  images: ProductImage[],
  type: ProductType,
  colors: string[]
): ColorImagePair[] {
  const blocks = photoBlocksFor(type);
  const hasNewScheme = images.some((i) => (Number(i.display_order) ?? 0) >= 10);
  const slotMap = new Map<string, ColorImagePair>();

  for (const img of images) {
    const order = Number(img.display_order) ?? 0;
    const labelIdx = order % 10;
    const isGen = hasNewScheme && order < 10;
    const color =
      type === 'jewellery'
        ? JEWELLERY_PSEUDO_COLOR
        : img.color || colors[0] || 'Default';
    const slot = blocks[labelIdx] || img.alt_text || `Photo ${labelIdx + 1}`;
    const key = slotKey(color, slot);

    const existing = slotMap.get(key) ?? {
      color,
      slot,
      imageUrl: '',
      uploadedUrl: undefined as string | undefined,
      generatedUrl: undefined as string | undefined,
    };

    if (isGen) {
      existing.generatedUrl = img.url;
      existing.aiGenerated = true;
      existing.imageUrl = img.url;
    } else {
      existing.uploadedUrl = img.url;
      if (!existing.generatedUrl) existing.imageUrl = img.url;
    }
    slotMap.set(key, existing);
  }

  return [...slotMap.values()].filter(
    (s) => s.imageUrl || s.uploadedUrl || s.generatedUrl
  );
}

export function deriveColorsFromProduct(
  type: ProductType,
  variants: { color?: string }[],
  images: ProductImage[]
): string[] {
  if (type === 'jewellery') return [JEWELLERY_PSEUDO_COLOR];

  const colorSet = new Set<string>();
  for (const v of variants) {
    if (v.color?.trim()) colorSet.add(v.color.trim());
  }
  for (const img of images) {
    if (img.color?.trim()) colorSet.add(img.color.trim());
  }
  return [...colorSet];
}

export function buildImageUploadPayloads(
  type: ProductType,
  colors: string[],
  images: ColorImagePair[]
): Array<{
  url: string;
  color: string;
  alt_text: string;
  is_primary: boolean;
  display_order: number;
}> {
  const blocks = photoBlocksFor(type);
  const uploads: Array<{
    url: string;
    color: string;
    alt_text: string;
    is_primary: boolean;
    display_order: number;
  }> = [];
  let primarySet = false;

  for (const color of colors) {
    const persistedColor = type === 'jewellery' ? '' : color;

    for (let idx = 0; idx < blocks.length; idx++) {
      const slot = blocks[idx];
      const img = images.find((i) => i.color === color && i.slot === slot);
      if (!img?.generatedUrl) continue;
      uploads.push({
        url: img.generatedUrl,
        color: persistedColor,
        alt_text: slot,
        is_primary: !primarySet,
        display_order: idx,
      });
      primarySet = true;
    }

    for (let idx = 0; idx < blocks.length; idx++) {
      const slot = blocks[idx];
      const img = images.find((i) => i.color === color && i.slot === slot);
      if (!img?.uploadedUrl) continue;
      uploads.push({
        url: img.uploadedUrl,
        color: persistedColor,
        alt_text: slot,
        is_primary: !primarySet,
        display_order: 10 + idx,
      });
      primarySet = true;
    }
  }

  return uploads;
}
