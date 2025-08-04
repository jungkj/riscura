import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  bordered?: boolean;
  ghost?: boolean;
  selectSize?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';
}

export const DaisySelect = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, error, bordered = true, ghost, selectSize = 'md', color, children, ...props },
    ref
  ) => {
    const sizeClasses = {
      xs: 'select-xs',
      sm: 'select-sm',
      md: 'select-md',
      lg: 'select-lg',
    }

    const colorClasses = {
      primary: 'select-primary',
      secondary: 'select-secondary',
      accent: 'select-accent',
      info: 'select-info',
      success: 'select-success',
      warning: 'select-warning',
      error: 'select-error',
    }

    return (
      <select
        ref={ref}
        className={cn(
          'select w-full',
          bordered && 'select-bordered',
          ghost && 'select-ghost',
          error && 'select-error',
          sizeClasses[selectSize],
          color && colorClasses[color],
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

DaisySelect.displayName = 'DaisySelect';

// Sub-components for compatibility
export const DaisySelectTrigger = forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, ...props }, ref) => {
    return <>{children}</>
  }
);

DaisySelectTrigger.displayName = 'DaisySelectTrigger';

export const DaisySelectValue = () => null;

export const DaisySelectContent = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
}

export const DaisySelectItem = ({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) => {
  return <option value={value}>{children}</option>;
}
