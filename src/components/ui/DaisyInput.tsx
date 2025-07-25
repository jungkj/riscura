import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  bordered?: boolean;
  ghost?: boolean;
  inputSize?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';
}

export const DaisyInput = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, bordered = true, ghost, inputSize = 'md', color, ...props }, ref) => {
    const sizeClasses = {
      xs: 'input-xs',
      sm: 'input-sm',
      md: 'input-md',
      lg: 'input-lg',
    };

    const colorClasses = {
      primary: 'input-primary',
      secondary: 'input-secondary',
      accent: 'input-accent',
      info: 'input-info',
      success: 'input-success',
      warning: 'input-warning',
      error: 'input-error',
    };

    return (
      <input
        ref={ref}
        className={cn(
          'input w-full',
          bordered && 'input-bordered',
          ghost && 'input-ghost',
          error && 'input-error',
          sizeClasses[inputSize],
          color && colorClasses[color],
          className
        )}
        {...props}
      />
    );
  }
);

DaisyInput.displayName = 'DaisyInput';