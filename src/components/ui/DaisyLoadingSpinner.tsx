import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'loading-sm',
  md: 'loading-md',
  lg: 'loading-lg',
};

export const DaisyLoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text,
}) => {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <span className={cn('loading loading-spinner', sizeClasses[size])} />
      {Boolean(text) && <span className="ml-2 text-sm text-base-content/70">{text}</span>}
    </div>
  );
};

export const LoadingSpinner = DaisyLoadingSpinner;

export const PageLoadingSpinner: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <DaisyLoadingSpinner size="lg" text={text} >
    </div>
);

export const InlineLoadingSpinner: React.FC<{ text?: string }> = ({ text }) => (
  <DaisyLoadingSpinner size="sm" text={text} className="py-2" >
  );
