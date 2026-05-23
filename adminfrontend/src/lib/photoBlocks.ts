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
