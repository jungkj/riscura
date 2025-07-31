import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  checkboxSize?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';
}

export const DaisyCheckbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, error, checkboxSize = 'md', color = 'primary', ...props }, ref) => {
    const sizeClasses = {
      xs: 'checkbox-xs',
      sm: 'checkbox-sm',
      md: 'checkbox-md',
      lg: 'checkbox-lg',
    };

    const colorClasses = {
      primary: 'checkbox-primary',
      secondary: 'checkbox-secondary',
      accent: 'checkbox-accent',
      info: 'checkbox-info',
      success: 'checkbox-success',
      warning: 'checkbox-warning',
      error: 'checkbox-error',
    };

    return (
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          'checkbox',
          sizeClasses[checkboxSize],
          colorClasses[color],
          error && 'checkbox-error',
          className
        )}
        {...props}
      />
    );
  }
);

DaisyCheckbox.displayName = 'DaisyCheckbox';
