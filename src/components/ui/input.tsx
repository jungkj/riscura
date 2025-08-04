import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles with minimal borders and white background
          'flex h-10 w-full rounded-lg border border-gray-200 bg-white px-4 py-2',
          // Typography - Inter font
          'text-sm font-medium text-[#191919] placeholder:text-gray-500 placeholder:font-normal font-inter',
          // Focus states - blue accent
          'focus:outline-none focus:ring-2 focus:ring-[#199BEC]/20 focus:border-[#199BEC]',
          // Transitions for smooth interactions
          'transition-all duration-200 ease-in-out',
          // Hover state
          'hover:border-gray-300',
          // Disabled state
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
          // File input styling
          'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#191919]',
          // Shadow for depth
          'shadow-sm hover:shadow-md focus:shadow-md',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
);
Input.displayName = 'Input';

export { Input }
