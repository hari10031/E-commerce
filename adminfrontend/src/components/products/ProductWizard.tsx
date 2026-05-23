'use client';

import { useState } from 'react';
import { Step1TypeCategory } from './steps/Step1TypeCategory';
import { Step2ImageUpload } from './steps/Step2ImageUpload';
import type { ColorImagePair } from '@/lib/productImages';
import { JEWELLERY_PSEUDO_COLOR } from '@/lib/photoBlocks';
import { Step3Variants, getSizes, type VariantCell } from './steps/Step3Variants';
import { Step4AIContent } from './steps/Step4AIContent';
import { Step5Pricing } from './steps/Step5Pricing';
import { Step6Review } from './steps/Step6Review';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ProductImage, ProductType } from '@/types';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

export interface WizardData {
  type: ProductType;
  categoryId: string;
  colors: string[];
  images: ColorImagePair[];
  variants: VariantCell[];
  content: { title: string; description: string };
  pricing: {
    basePrice: number;
    discountPercent: number;
    couponCode: string;
    couponDiscount: number;
    hasCoupon: boolean;
  };
}

const STEPS = [
  { label: 'Type & Category' },
  { label: 'Images' },
  { label: 'Variants' },
  { label: 'Content' },
  { label: 'Pricing' },
  { label: 'Review' },
];

interface ProductWizardProps {
  editId?: string;
  initialData?: Partial<WizardData>;
  existingImages?: ProductImage[];
}

export function ProductWizard({ editId, initialData, existingImages = [] }: ProductWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<WizardData>({
    type: 'saree',
    categoryId: '',
    colors: [],
    images: [],
    variants: [],
    content: { title: '', description: '' },
    pricing: {
      basePrice: 0,
      discountPercent: 0,
      couponCode: '',
      couponDiscount: 0,
      hasCoupon: false,
    },
    ...initialData,
  });

  const update = <K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const canAdvance = () => {
    switch (currentStep) {
      case 0: return !!data.type && !!data.categoryId;
      case 1:
        return data.colors.length > 0;
      case 2: return data.variants.some((v) => v.quantity > 0);
      case 3: return !!data.content.title.trim();
      case 4: return data.pricing.basePrice > 0;
      default: return true;
    }
  };

  const colors =
    data.type === 'jewellery' && data.colors.length === 0
      ? [JEWELLERY_PSEUDO_COLOR]
      : data.colors;
  const sizes = getSizes(data.type);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step progress */}
      <div className="flex items-center mb-8 overflow-x-auto pb-2">
        {STEPS.map((step, i) => (
          <div key={i} className="flex items-center flex-shrink-0">
            <div
              className={cn(
                'flex items-center gap-2 cursor-pointer',
                i <= currentStep ? 'opacity-100' : 'opacity-50'
              )}
              onClick={() => i < currentStep && setCurrentStep(i)}
            >
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                  i < currentStep
                    ? 'bg-green-500 text-white'
                    : i === currentStep
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-500'
                )}
              >
                {i < currentStep ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  'text-xs font-medium whitespace-nowrap',
                  i === currentStep ? 'text-amber-700' : i < currentStep ? 'text-green-700' : 'text-gray-400'
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('w-8 h-px mx-2', i < currentStep ? 'bg-green-300' : 'bg-gray-200')} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 min-h-[400px]">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">
          Step {currentStep + 1}: {STEPS[currentStep].label}
        </h2>

        {currentStep === 0 && (
          <Step1TypeCategory
            data={{ type: data.type, categoryId: data.categoryId }}
            onChange={(d) =>
              setData((prev) => {
                const next = { ...prev, ...d };
                if (d.type && d.type !== prev.type) {
                  next.colors = d.type === 'jewellery' ? [JEWELLERY_PSEUDO_COLOR] : [];
                  next.images = [];
                  next.variants = [];
                }
                return next;
              })
            }
          />
        )}
        {currentStep === 1 && (
          <Step2ImageUpload
            productType={data.type}
            colors={colors}
            onColorsChange={(nextColors) => update('colors', nextColors)}
            data={data.images}
            onChange={(images) => update('images', images)}
          />
        )}
        {currentStep === 2 && (
          <Step3Variants
            productType={data.type}
            colors={colors}
            variants={data.variants}
            onChange={(variants) => update('variants', variants)}
          />
        )}
        {currentStep === 3 && (
          <Step4AIContent
            data={data.content}
            onChange={(content) => update('content', { ...data.content, ...content })}
            productType={data.type}
            categoryId={data.categoryId}
            colors={colors}
            sizes={sizes}
          />
        )}
        {currentStep === 4 && (
          <Step5Pricing
            data={data.pricing}
            onChange={(pricing) => update('pricing', { ...data.pricing, ...pricing })}
          />
        )}
        {currentStep === 5 && (
          <Step6Review data={{ ...data, colors }} editId={editId} existingImages={existingImages} />
        )}
      </div>

      {/* Navigation */}
      {currentStep < 5 && (
        <div className="flex justify-between mt-5">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
            disabled={!canAdvance()}
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
