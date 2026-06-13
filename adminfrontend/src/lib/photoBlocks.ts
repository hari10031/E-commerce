import type { ProductType } from '@/types';

export const PHOTO_BLOCKS: Record<ProductType, string[]> = {
  saree: [
    'Saree image',
    'Texture',
    'Border',
    'Pallu',
    'Blouse Piece',
    'Fabric Closeup',
    'Draping Style',
  ],
  jewellery: ['Full Piece', 'Front Detail', 'Stone Setting', 'Hallmark'],
};

export const JEWELLERY_PSEUDO_COLOR = 'Jewellery';

export function photoBlocksFor(type: ProductType): string[] {
  return PHOTO_BLOCKS[type] ?? PHOTO_BLOCKS.saree;
}

/** Hero slot — free crop in UI; output auto-fits 3:4 listing frame. */
export const HERO_PHOTO_SLOT: Partial<Record<ProductType, string>> = {
  saree: 'Saree image',
  jewellery: 'Full Piece',
};

export function isHeroPhotoSlot(type: ProductType, slot: string): boolean {
  return HERO_PHOTO_SLOT[type] === slot;
}
