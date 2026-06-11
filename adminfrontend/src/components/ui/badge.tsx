import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-amber-100 text-amber-800',
        secondary: 'bg-gray-100 text-gray-800',
        success: 'bg-green-100 text-green-800',
        destructive: 'bg-red-100 text-red-800',
        warning: 'bg-yellow-100 text-yellow-800',
        info: 'bg-blue-100 text-blue-800',
        outline: 'border border-gray-200 text-gray-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

const statusBadgeConfig: Record<OrderStatus, { label: string; className: string }> = {
  placed: { label: 'Placed', className: 'badge-placed' },
  confirmed: { label: 'Confirmed', className: 'badge-confirmed' },
  processing: { label: 'Processing', className: 'badge-processing' },
  shipped: { label: 'Shipped', className: 'badge-shipped' },
  delivered: { label: 'Delivered', className: 'badge-delivered' },
  cancelled: { label: 'Cancelled', className: 'badge-cancelled' },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusBadgeConfig[status] ?? { label: status, className: '' };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', config.className)}>
      {config.label}
    </span>
  );
}

export { Badge, badgeVariants };
