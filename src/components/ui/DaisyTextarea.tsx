import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const DaisyTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn('textarea textarea-bordered w-full', error && 'textarea-error', className)}
        {...props}
      />
    );
  }
);

DaisyTextarea.displayName = 'DaisyTextarea';
