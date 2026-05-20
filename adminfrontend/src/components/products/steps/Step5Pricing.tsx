'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { formatPrice, discountedPrice } from '@/lib/utils';

interface Step5Data {
  basePrice: number;
  discountPercent: number;
  couponCode: string;
  couponDiscount: number;
  hasCoupon: boolean;
}

interface Step5Props {
  data: Step5Data;
  onChange: (data: Partial<Step5Data>) => void;
}

export function Step5Pricing({ data, onChange }: Step5Props) {
  const finalPrice = discountedPrice(data.basePrice, data.discountPercent);

  return (
    <div className="space-y-6">
      {/* Base Price */}
      <div className="space-y-1.5">
        <Label htmlFor="base-price">Base Price (INR)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
          <Input
            id="base-price"
            type="number"
            min={0}
            step={1}
            placeholder="0"
            value={data.basePrice || ''}
            onChange={(e) => onChange({ basePrice: parseInt(e.target.value) || 0 })}
            className="pl-7"
          />
        </div>
      </div>

      {/* Discount Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Discount Percentage</Label>
          <span className="text-sm font-semibold text-amber-600">{data.discountPercent}%</span>
        </div>
        <Slider
          min={0}
          max={80}
          step={1}
          value={[data.discountPercent]}
          onValueChange={([val]) => onChange({ discountPercent: val })}
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>0%</span>
          <span>40%</span>
          <span>80%</span>
        </div>
      </div>

      {/* Price preview */}
      <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Base Price</p>
          <p className="text-sm font-medium text-gray-700">{formatPrice(data.basePrice)}</p>
        </div>
        <div className="text-gray-300 text-xl">→</div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Final Price</p>
          <p className="text-lg font-bold text-amber-700">{formatPrice(finalPrice)}</p>
        </div>
        {data.discountPercent > 0 && (
          <div className="ml-auto">
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              Save {data.discountPercent}%
            </span>
          </div>
        )}
      </div>

      {/* Special Coupon */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Add Special Coupon</p>
            <p className="text-xs text-gray-400">Create a coupon for this product</p>
          </div>
          <Switch
            checked={data.hasCoupon}
            onCheckedChange={(checked) => onChange({ hasCoupon: checked })}
          />
        </div>

        {data.hasCoupon && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="space-y-1.5">
              <Label htmlFor="coupon-code">Coupon Code</Label>
              <Input
                id="coupon-code"
                placeholder="e.g., SAVE20"
                value={data.couponCode}
                onChange={(e) => onChange({ couponCode: e.target.value.toUpperCase() })}
                className="uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coupon-discount">Coupon Discount %</Label>
              <Input
                id="coupon-discount"
                type="number"
                min={1}
                max={50}
                placeholder="10"
                value={data.couponDiscount || ''}
                onChange={(e) => onChange({ couponDiscount: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
