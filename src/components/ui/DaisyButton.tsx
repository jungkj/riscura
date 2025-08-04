import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'ghost'
    | 'link'
    | 'outline'
    | 'error'
    | 'success'
    | 'warning'
    | 'info';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  block?: boolean;
  shape?: 'default' | 'circle' | 'square';
}

export const DaisyButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading,
      block,
      shape = 'default',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      accent: 'btn-accent',
      ghost: 'btn-ghost',
      link: 'btn-link',
      outline: 'btn-outline',
      error: 'btn-error',
      success: 'btn-success',
      warning: 'btn-warning',
      info: 'btn-info',
    };

    const sizeClasses = {
      xs: 'btn-xs',
      sm: 'btn-sm',
      md: '',
      lg: 'btn-lg',
    };

    const shapeClasses = {
      default: '',
      circle: 'btn-circle',
      square: 'btn-square',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'btn',
          variantClasses[variant],
          sizeClasses[size],
          shapeClasses[shape],
          block && 'btn-block',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {Boolean(loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

DaisyButton.displayName = 'DaisyButton';
