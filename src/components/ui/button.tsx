import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-2',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground border-primary shadow hover:bg-primary/90 hover:border-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground border-destructive shadow-sm hover:bg-destructive/90 hover:border-destructive/90',
        outline:
          'border-primary bg-background text-foreground shadow-sm hover:bg-primary hover:text-primary-foreground',
        secondary:
          'bg-secondary text-secondary-foreground border-secondary shadow-sm hover:bg-secondary/80 hover:border-secondary/80',
        ghost: 'border-transparent hover:bg-accent hover:text-accent-foreground hover:border-accent',
        link: 'text-primary underline-offset-4 hover:underline border-transparent',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-md px-8 text-base',
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
