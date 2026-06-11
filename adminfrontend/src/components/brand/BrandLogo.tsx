'use client';

import Image from 'next/image';
import { BRAND } from '@/lib/brand';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  className?: string;
  showName?: boolean;
  collapsed?: boolean;
  imageClassName?: string;
}

export function BrandLogo({
  className,
  showName = true,
  collapsed = false,
  imageClassName,
}: BrandLogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Image
        src={BRAND.logoPath}
        alt={BRAND.name}
        width={120}
        height={36}
        className={cn(
          'object-contain object-left',
          collapsed ? 'h-8 w-8 object-center' : 'h-9 w-auto',
          imageClassName
        )}
        priority
      />
      {showName && !collapsed && (
        <span className="font-bold text-white text-sm hidden sm:inline">{BRAND.name}</span>
      )}
    </div>
  );
}
