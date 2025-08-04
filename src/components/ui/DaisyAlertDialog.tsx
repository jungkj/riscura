'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { DaisyButton } from './DaisyButton';

interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export const DaisyAlertDialog: React.FC<AlertDialogProps> = ({ open, onOpenChange, children }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  const handleClose = () => {
    onOpenChange?.(false);
  }

  if (!open) return null;

  return (
    <dialog ref={dialogRef} className="modal" onClose={handleClose}>
      <div className="modal-box">{children}</div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}

export const AlertDialog = DaisyAlertDialog;

export const DaisyAlertDialogTrigger: React.FC<{
  children: React.ReactNode;
  asChild?: boolean;
}> = ({ children }) => {
  return <>{children}</>;
}

export const AlertDialogTrigger = DaisyAlertDialogTrigger;

export const DaisyAlertDialogContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return <div className={cn('relative', className)}>{children}</div>;
}

export const AlertDialogContent = DaisyAlertDialogContent;

export const DaisyAlertDialogHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

export const AlertDialogHeader = DaisyAlertDialogHeader;

export const DaisyAlertDialogTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return <h3 className={cn('font-bold text-lg', className)}>{children}</h3>;
}

export const AlertDialogTitle = DaisyAlertDialogTitle;

export const DaisyAlertDialogDescription: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return <p className={cn('text-sm opacity-70 mt-2', className)}>{children}</p>;
}

export const AlertDialogDescription = DaisyAlertDialogDescription;

export const DaisyAlertDialogFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return <div className={cn('modal-action', className)}>{children}</div>;
}

export const AlertDialogFooter = DaisyAlertDialogFooter;

export const DaisyAlertDialogAction: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <DaisyButton className={cn('btn-primary', className)} {...props}>
      {children}
    </DaisyButton>
  );
}

export const AlertDialogAction = DaisyAlertDialogAction;

export const DaisyAlertDialogCancel: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <DaisyButton variant="outline" className={className} {...props}>
      {children}
    </DaisyButton>
  );
}

export const AlertDialogCancel = DaisyAlertDialogCancel;

// Export Portal for compatibility
export const AlertDialogPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>
export const DaisyAlertDialogPortal = AlertDialogPortal;

// Export Overlay for compatibility
export const AlertDialogOverlay = () => null
export const DaisyAlertDialogOverlay = AlertDialogOverlay;
