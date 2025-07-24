import { cn } from '@/lib/utils';
import { useState } from 'react';

interface TooltipProps {
  children: React.ReactNode;
}

interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export const DaisyTooltip = ({ children }: TooltipProps) => {
  return <>{children}</>;
};

export const DaisyTooltipTrigger = ({ children, asChild }: TooltipTriggerProps) => {
  return <>{children}</>;
};

export const DaisyTooltipContent = ({ 
  children, 
  className, 
  side = 'top',
  ...props 
}: TooltipContentProps) => {
  const positionClasses = {
    top: 'tooltip-top',
    right: 'tooltip-right',
    bottom: 'tooltip-bottom',
    left: 'tooltip-left'
  };

  return (
    <div 
      className={cn('tooltip', positionClasses[side], 'tooltip-open')} 
      data-tip={children}
      {...props}
    >
      <span className={cn('tooltip-text', className)}>{children}</span>
    </div>
  );
};

// Simplified tooltip wrapper for common use cases
export const DaisyTooltipWrapper = ({ 
  children, 
  content, 
  side = 'top',
  className 
}: { 
  children: React.ReactNode; 
  content: string; 
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}) => {
  const positionClasses = {
    top: 'tooltip-top',
    right: 'tooltip-right',
    bottom: 'tooltip-bottom',
    left: 'tooltip-left'
  };

  return (
    <div className={cn('tooltip', positionClasses[side], className)} data-tip={content}>
      {children}
    </div>
  );
};