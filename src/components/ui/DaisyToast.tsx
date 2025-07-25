'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return {
    toast: context.addToast,
    toasts: context.toasts,
    dismiss: context.removeToast,
  };
};

const ToastViewport: React.FC = () => {
  const context = React.useContext(ToastContext);
  if (!context) return null;

  return (
    <div className="toast toast-end">
      {context.toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'alert shadow-lg',
            toast.variant === 'destructive' ? 'alert-error' : 'alert-info'
          )}
        >
          <div>
            {toast.title && <div className="font-bold">{toast.title}</div>}
            {toast.description && <div className="text-sm">{toast.description}</div>}
          </div>
          <div className="flex gap-2">
            {toast.action}
            <button
              onClick={() => context.removeToast(toast.id)}
              className="btn btn-sm btn-ghost btn-circle"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Compatibility exports
export const ToastAction: React.FC<React.HTMLAttributes<HTMLButtonElement>> = ({ 
  children, 
  className,
  ...props 
}) => (
  <button className={cn('btn btn-sm', className)} {...props}>
    {children}
  </button>
);

export const ToastClose: React.FC<React.HTMLAttributes<HTMLButtonElement>> = ({ 
  className,
  ...props 
}) => (
  <button className={cn('btn btn-sm btn-circle btn-ghost', className)} {...props}>
    <X className="h-4 w-4" />
  </button>
);

export const ToastTitle: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className,
  ...props 
}) => <div className={cn('font-bold', className)} {...props} />;

export const ToastDescription: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className,
  ...props 
}) => <div className={cn('text-sm', className)} {...props} />;

export const Toast = ({ children }: { children: React.ReactNode }) => children;
export const Toaster = ToastViewport;