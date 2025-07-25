'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export const DaisySheet: React.FC<SheetProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/50 animate-in fade-in-0" 
        onClick={() => onOpenChange?.(false)}
      />
      {children}
    </>
  );
};

export const Sheet = DaisySheet;

export const DaisySheetTrigger: React.FC<{ children: React.ReactNode; asChild?: boolean }> = ({ children }) => {
  return <>{children}</>;
};

export const SheetTrigger = DaisySheetTrigger;

interface SheetContentProps {
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export const DaisySheetContent: React.FC<SheetContentProps> = ({ 
  children, 
  className,
  side = 'right' 
}) => {
  const sideClasses = {
    top: 'inset-x-0 top-0 animate-in slide-in-from-top',
    bottom: 'inset-x-0 bottom-0 animate-in slide-in-from-bottom',
    left: 'inset-y-0 left-0 h-full w-3/4 sm:max-w-sm animate-in slide-in-from-left',
    right: 'inset-y-0 right-0 h-full w-3/4 sm:max-w-sm animate-in slide-in-from-right',
  };

  return (
    <div className={cn(
      'fixed z-50 bg-base-100 shadow-xl',
      'p-6',
      sideClasses[side],
      className
    )}>
      {children}
    </div>
  );
};

export const SheetContent = DaisySheetContent;

export const DaisySheetHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <div className={cn('mb-4 pb-4 border-b border-base-200', className)}>
      {children}
    </div>
  );
};

export const SheetHeader = DaisySheetHeader;

export const DaisySheetTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <h3 className={cn('text-xl font-semibold', className)}>
      {children}
    </h3>
  );
};

export const SheetTitle = DaisySheetTitle;

export const DaisySheetDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <p className={cn('text-sm text-base-content/70 mt-2', className)}>
      {children}
    </p>
  );
};

export const SheetDescription = DaisySheetDescription;

export const DaisySheetFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <div className={cn('mt-6 pt-6 border-t border-base-200 flex justify-end space-x-2', className)}>
      {children}
    </div>
  );
};

export const SheetFooter = DaisySheetFooter;

export const DaisySheetClose: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => {
  return (
    <button
      className={cn(
        'absolute right-4 top-4',
        'btn btn-sm btn-circle btn-ghost',
        className
      )}
      {...props}
    >
      <X className="h-4 w-4" />
    </button>
  );
};

export const SheetClose = DaisySheetClose;

// Export Portal and Overlay for compatibility
export const SheetPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const DaisySheetPortal = SheetPortal;

export const SheetOverlay = () => null;
export const DaisySheetOverlay = SheetOverlay;