import * as React from 'react';

import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // Base styles with minimal borders and white background
        'flex min-h-[80px] w-full rounded-lg border border-gray-200 bg-white px-4 py-3',
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
        // Shadow for depth
        'shadow-sm hover:shadow-md focus:shadow-md',
        // Resize behavior
        'resize-none',
        className
      )}
      ref={ref}
      {...props}
    />
  )
});
Textarea.displayName = 'Textarea';

export { Textarea }
