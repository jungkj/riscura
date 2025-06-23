import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles with proper Tailwind classes
  `inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 
   disabled:pointer-events-none disabled:cursor-not-allowed select-none
   border border-solid`,
  {
    variants: {
      variant: {
        // Primary variant - main brand color
        primary: `
          bg-[#199BEC] text-white border-[#199BEC]
          shadow-sm hover:bg-[#1785d1] hover:border-[#1785d1]
          hover:shadow-md active:bg-[#146bb8] active:border-[#146bb8]
          active:scale-[0.98] focus-visible:ring-blue-500/50
          disabled:bg-gray-300 disabled:border-gray-300 disabled:text-gray-500
        `,
        
        // Secondary variant - outlined style
        secondary: `
          bg-white text-gray-900 border-gray-300
          shadow-sm hover:bg-gray-50 hover:border-gray-300
          hover:shadow-md active:bg-gray-100 active:scale-[0.98]
          focus-visible:ring-blue-500/50
          disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400
        `,
        
        // Outline variant - transparent with border
        outline: `
          bg-transparent text-[#199BEC] border-[#199BEC]
          hover:bg-blue-50 hover:border-[#1785d1] hover:text-[#1785d1]
          active:bg-blue-100 active:border-[#146bb8] active:text-[#146bb8]
          active:scale-[0.98] focus-visible:ring-blue-500/50
          disabled:bg-transparent disabled:border-gray-300 disabled:text-gray-400
        `,
        
        // Ghost variant - minimal styling
        ghost: `
          bg-transparent text-gray-700 border-transparent
          hover:bg-gray-100 hover:text-gray-900
          active:bg-gray-200 active:scale-[0.98]
          focus-visible:ring-blue-500/50
          disabled:bg-transparent disabled:text-gray-400
        `,
        
        // Danger variant - destructive actions
        danger: `
          bg-red-600 text-white border-red-600
          shadow-sm hover:bg-red-700 hover:border-red-700
          hover:shadow-md active:bg-red-800 active:border-red-800
          active:scale-[0.98] focus-visible:ring-red-500/50
          disabled:bg-gray-300 disabled:border-gray-300 disabled:text-gray-500
        `,
        
        // Success variant - positive actions
        success: `
          bg-green-600 text-white border-green-600
          shadow-sm hover:bg-green-700 hover:border-green-700
          hover:shadow-md active:bg-green-800 active:border-green-800
          active:scale-[0.98] focus-visible:ring-green-500/50
          disabled:bg-gray-300 disabled:border-gray-300 disabled:text-gray-500
        `,
        
        // Link variant - text-only styling
        link: `
          bg-transparent text-[#199BEC] border-transparent
          underline-offset-4 hover:underline hover:text-[#1785d1]
          focus-visible:ring-blue-500/50 disabled:text-gray-400
          p-0 h-auto font-medium
        `,
      },
      size: {
        // Extra small
        xs: `h-7 px-2 text-xs rounded-md`,
        
        // Small
        sm: `h-8 px-3 text-sm rounded-md`,
        
        // Medium (default)
        md: `h-10 px-4 text-sm rounded-md`,
        
        // Large
        lg: `h-11 px-6 text-base rounded-md`,
        
        // Extra large
        xl: `h-12 px-8 text-lg rounded-md`,
        
        // Icon only - square aspect ratio
        icon: `h-10 w-10 p-0 rounded-md`,
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
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
