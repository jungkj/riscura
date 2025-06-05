import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles with thick black borders and cream background
          'flex h-10 w-full rounded-md border-2 border-primary bg-card px-4 py-2',
          // Typography - Bold Inter font
          'text-sm font-semibold text-foreground placeholder:text-muted-foreground',
          // Focus states - bold black border
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          // Transitions for smooth interactions
          'transition-all duration-200 ease-in-out',
          // Hover state
          'hover:border-foreground',
          // Disabled state
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
          // File input styling
          'file:border-0 file:bg-transparent file:text-sm file:font-bold file:text-foreground',
          // Shadow for depth
          'shadow-sm hover:shadow-md focus:shadow-lg',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
