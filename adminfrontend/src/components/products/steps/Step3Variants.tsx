'use client';

import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { generateSKU } from '@/lib/utils';
import { resolveColorHex } from '@/lib/colors';
import type { ProductType } from '@/types';

export interface VariantCell {
  color: string;
  size: string;
  quantity: number;
  sku: string;
}

interface Step3Props {
  productType: ProductType;
  colors: string[];
  variants: VariantCell[];
  onChange: (variants: VariantCell[]) => void;
}

// Saree has no sizes (colour-only); jewellery uses gram weights.
export function getSizes(type: ProductType): string[] {
  if (type === 'jewellery') return ['1g', '2g', '5g', '10g'];
  return [];
}

export function Step3Variants({ productType, colors, variants, onChange }: Step3Props) {
  const sizes = getSizes(productType);
  const hasSizes = sizes.length > 0;
  const gridSizes = hasSizes ? sizes : [''];

  // Build the color × size variant grid.
  const grid = useMemo(() => {
    const map: Record<string, Record<string, VariantCell>> = {};
    for (const color of colors) {
      map[color] = {};
      for (const size of gridSizes) {
        const existing = variants.find((v) => v.color === color && v.size === size);
        map[color][size] = existing ?? {
          color,
          size,
          quantity: 0,
          sku: generateSKU(productType, color, size || 'STD'),
        };
      }
    }
    return map;
  }, [colors, gridSizes, productType, variants]);

  const updateQty = (color: string, size: string, qty: number) => {
    const updated = colors.flatMap((c) =>
      gridSizes.map((s) => {
        if (c === color && s === size) {
          return { ...grid[c][s], quantity: Math.max(0, qty) };
        }
        return grid[c][s];
      })
    );
    onChange(updated);
  };

  const allVariants = colors.flatMap((c) => gridSizes.map((s) => grid[c]?.[s])).filter(Boolean);
  const hasAtLeastOne = allVariants.some((v) => v.quantity > 0);

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500">
        {hasSizes
          ? 'Enter stock quantity for each color/size combination. '
          : 'Enter stock quantity for each color. '}
        At least one variant must have quantity &gt; 0.
      </div>

      {colors.length === 0 ? (
        <p className="text-center py-8 text-gray-400">No colors added. Go back to Step 2 and add color images.</p>
      ) : hasSizes ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3 font-medium text-gray-600 w-32 bg-gray-50 rounded-tl-lg">Color</th>
                {sizes.map((size) => (
                  <th key={size} className="p-3 font-medium text-gray-600 text-center bg-gray-50 min-w-[80px]">
                    {size}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {colors.map((color) => (
                <tr key={color} className="border-t border-gray-100">
                  <td className="p-3 font-medium text-gray-800">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-4 w-4 rounded-full ring-1 ring-inset ring-black/10 shrink-0"
                        style={{ backgroundColor: resolveColorHex(color) }}
                      />
                      {color}
                    </span>
                  </td>
                  {sizes.map((size) => {
                    const cell = grid[color]?.[size];
                    return (
                      <td key={size} className="p-2">
                        <div className="space-y-1">
                          <Input
                            type="number"
                            min={0}
                            value={cell?.quantity ?? 0}
                            onChange={(e) => updateQty(color, size, parseInt(e.target.value) || 0)}
                            className="text-center h-8 text-sm"
                          />
                          <p className="text-xs text-gray-400 text-center font-mono truncate" title={cell?.sku}>
                            {cell?.sku?.slice(0, 10)}
                          </p>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-2">
          {colors.map((color) => {
            const cell = grid[color]?.[''];
            return (
              <div key={color} className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg">
                <span className="inline-flex items-center gap-2 font-medium text-gray-800 w-32 min-w-0">
                  <span
                    className="h-4 w-4 rounded-full ring-1 ring-inset ring-black/10 shrink-0"
                    style={{ backgroundColor: resolveColorHex(color) }}
                  />
                  <span className="truncate">{color}</span>
                </span>
                <div className="space-y-1">
                  <Input
                    type="number"
                    min={0}
                    value={cell?.quantity ?? 0}
                    onChange={(e) => updateQty(color, '', parseInt(e.target.value) || 0)}
                    className="text-center h-8 text-sm w-28"
                  />
                </div>
                <span className="text-xs text-gray-400 font-mono truncate" title={cell?.sku}>
                  {cell?.sku}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {!hasAtLeastOne && colors.length > 0 && (
        <p className="text-xs text-red-500 mt-2">At least one variant must have a quantity greater than 0.</p>
      )}
    </div>
  );
}
