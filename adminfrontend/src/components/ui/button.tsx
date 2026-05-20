import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-amber-500 text-white shadow hover:bg-amber-600 active:bg-amber-700',
        destructive:
          'bg-red-500 text-white shadow hover:bg-red-600 active:bg-red-700',
        outline:
          'border border-gray-200 bg-white text-gray-900 shadow-sm hover:bg-gray-50 active:bg-gray-100',
        secondary:
          'bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200 active:bg-gray-300',
        ghost:
          'text-gray-700 hover:bg-gray-100 active:bg-gray-200',
        link:
          'text-amber-600 underline-offset-4 hover:underline',
        success:
          'bg-green-500 text-white shadow hover:bg-green-600 active:bg-green-700',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-lg px-6',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
