import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium font-inter transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-[#199BEC] text-white border border-[#199BEC] shadow-sm hover:bg-[#0f7dc7] hover:shadow-md focus-visible:ring-[#199BEC]/20 active:scale-[0.98]',
        secondary:
          'border border-[#199BEC] bg-white text-[#199BEC] shadow-sm hover:bg-[#199BEC] hover:text-white hover:shadow-md focus-visible:ring-[#199BEC]/20 active:scale-[0.98]',
        tertiary:
          'bg-white text-[#191919] border border-gray-200 shadow-sm hover:bg-[#FAFAFA] hover:border-gray-300 hover:shadow-md focus-visible:ring-gray-200 active:scale-[0.98]',
        ghost: 
          'bg-transparent text-[#191919] border-transparent hover:bg-[#FAFAFA] hover:text-[#191919] focus-visible:ring-gray-200 active:scale-[0.98]',
        destructive:
          'bg-red-600 text-white border border-red-600 shadow-sm hover:bg-red-700 hover:shadow-md focus-visible:ring-red-600/20 active:scale-[0.98]',
        link: 
          'text-[#199BEC] underline-offset-4 hover:underline border-transparent bg-transparent p-0 h-auto font-medium',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-lg px-8 text-base',
        icon: 'h-10 w-10',
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
