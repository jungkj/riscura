import React from 'react';
import { Button, ButtonProps } from './button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  children,
  loading = false,
  loadingText,
  icon,
  iconPosition = 'left',
  disabled,
  className,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <Button
      disabled={isDisabled}
      className={cn(
        'relative',
        loading && 'cursor-not-allowed',
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || 'Loading...'}
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="mr-2">{icon}</span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className="ml-2">{icon}</span>
          )}
        </>
      )}
    </Button>
  );
};

// Specific button variants for common actions
export const SaveButton: React.FC<Omit<EnhancedButtonProps, 'children'>> = (props) => (
  <EnhancedButton {...props}>
    Save
  </EnhancedButton>
);

export const CancelButton: React.FC<Omit<EnhancedButtonProps, 'children'>> = (props) => (
  <EnhancedButton variant="outline" {...props}>
    Cancel
  </EnhancedButton>
);

export const DeleteButton: React.FC<Omit<EnhancedButtonProps, 'children'>> = (props) => (
  <EnhancedButton variant="destructive" {...props}>
    Delete
  </EnhancedButton>
);

export const SubmitButton: React.FC<Omit<EnhancedButtonProps, 'children'>> = (props) => (
  <EnhancedButton type="submit" {...props}>
    Submit
  </EnhancedButton>
); 