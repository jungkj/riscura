import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal' | 'both';
}

export const DaisyScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, orientation = 'vertical', ...props }, ref) => {
    const scrollClasses = {
      vertical: 'overflow-y-auto overflow-x-hidden',
      horizontal: 'overflow-x-auto overflow-y-hidden',
      both: 'overflow-auto'
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative',
          scrollClasses[orientation],
          'scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-base-100',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DaisyScrollArea.displayName = 'DaisyScrollArea';