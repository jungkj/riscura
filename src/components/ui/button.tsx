import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles
  `inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background 
   transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring 
   focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50`,
  {
    variants: {
      variant: {
        // Primary variant - main brand color
        primary: `
          bg-blue-600 text-white shadow hover:bg-blue-700 active:bg-blue-800
          border-transparent focus:ring-blue-500
          disabled:bg-blue-300 disabled:text-white
        `,
        
        // Secondary variant - subtle background
        secondary: `
          bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-200 active:bg-slate-300
          border border-slate-200 focus:ring-slate-500
          disabled:bg-slate-50 disabled:text-slate-400
        `,
        
        // Success variant - green theme
        success: `
          bg-green-600 text-white shadow hover:bg-green-700 active:bg-green-800
          border-transparent focus:ring-green-500
          disabled:bg-green-300 disabled:text-white
        `,
        
        // Danger variant - red theme
        danger: `
          bg-red-600 text-white shadow hover:bg-red-700 active:bg-red-800
          border-transparent focus:ring-red-500
          disabled:bg-red-300 disabled:text-white
        `,
        
        // Outline variant - border only
        outline: `
          border border-slate-300 bg-transparent text-slate-700 shadow-sm 
          hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100
          focus:ring-slate-500
          disabled:border-slate-200 disabled:text-slate-400
        `,
        
        // Ghost variant - minimal styling
        ghost: `
          bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900
          active:bg-slate-200 focus:ring-slate-500
          disabled:text-slate-400
        `,
        
        // Link variant - looks like a link
        link: `
          text-blue-600 underline-offset-4 hover:underline hover:text-blue-700
          active:text-blue-800 focus:ring-blue-500
          disabled:text-blue-300
        `,
        
        // Default variant - alias for primary
        default: `
          bg-blue-600 text-white shadow hover:bg-blue-700 active:bg-blue-800
          border-transparent focus:ring-blue-500
          disabled:bg-blue-300 disabled:text-white
        `,
        
        // Tertiary variant - subtle styling
        tertiary: `
          bg-slate-50 text-slate-600 shadow-sm hover:bg-slate-100 active:bg-slate-200
          border border-slate-200 focus:ring-slate-500
          disabled:bg-slate-25 disabled:text-slate-400
        `,
        
        // Destructive variant - alias for danger
        destructive: `
          bg-red-600 text-white shadow hover:bg-red-700 active:bg-red-800
          border-transparent focus:ring-red-500
          disabled:bg-red-300 disabled:text-white
        `,
      },
      size: {
        xs: "h-7 px-2 text-xs",
        sm: "h-8 px-3 text-sm",
        md: "h-9 px-4 text-sm",
        lg: "h-10 px-6 text-base",
        xl: "h-11 px-8 text-base",
        icon: "h-9 w-9 p-0",
        default: "h-9 px-4 text-sm", // alias for md
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false, 
    loadingText = 'Loading...', 
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : 'button';
    
    const isDisabled = disabled || loading;
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {loadingText}
          </>
        ) : (
          <>
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
