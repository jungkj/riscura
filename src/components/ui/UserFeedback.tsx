// Comprehensive User Feedback System
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
  X,
  AlertTriangle,
  MessageSquare,
  Star,
  Send,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Textarea } from './textarea';
import { Input } from './input';
import { Label } from './label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog';

// Toast Types
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  persistent?: boolean;
}

// Toast Context
interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast Provider
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      id,
      duration: toast.persistent ? undefined : (toast.duration ?? 5000),
      dismissible: true,
      ...toast,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-remove toast after duration
    if (newToast.duration && !newToast.persistent) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts((prev) => prev.map((toast) => (toast.id === id ? { ...toast, ...updates } : toast)));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts, updateToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

// Toast Hook
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { addToast, removeToast, updateToast } = context;

  // Convenience methods
  const toast = {
    success: (message: string, options?: Partial<Toast>) =>
      addToast({ type: 'success', message, ...options }),

    error: (message: string, options?: Partial<Toast>) =>
      addToast({ type: 'error', message, ...options }),

    warning: (message: string, options?: Partial<Toast>) =>
      addToast({ type: 'warning', message, ...options }),

    info: (message: string, options?: Partial<Toast>) =>
      addToast({ type: 'info', message, ...options }),

    loading: (message: string, options?: Partial<Toast>) =>
      addToast({ type: 'loading', message, persistent: true, dismissible: false, ...options }),

    promise: async <T,>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string | ((_data: T) => string);
        error: string | ((_error: any) => string);
      }
    ) => {
      const loadingId = addToast({
        type: 'loading',
        message: messages.loading,
        persistent: true,
        dismissible: false,
      });

      try {
        const result = await promise;
        removeToast(loadingId);
        addToast({
          type: 'success',
          message:
            typeof messages.success === 'function' ? messages.success(result) : messages.success,
        });
        return result;
      } catch (error) {
        removeToast(loadingId);
        addToast({
          type: 'error',
          message: typeof messages.error === 'function' ? messages.error(error) : messages.error,
        });
        throw error;
      }
    },
  };

  return { ...context, toast };
};

// Toast Component
const ToastComponent: React.FC<{ toast: Toast }> = ({ toast }) => {
  const { removeToast } = useToast();

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <DaisyAlertTriangle className="w-5 h-5 text-yellow-500">;</DaisyAlertTriangle>;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'loading':
        return <Loader2 className="w-5 h-5 animate-spin text-primary" />;
    }
  };

  const getBackgroundClass = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800';
      case 'loading':
        return 'bg-background border-border';
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all duration-300',
        'animate-in slide-in-from-right-full',
        getBackgroundClass()
      )}
    >
      {getIcon()}

      <div className="flex-1 min-w-0">
        {toast.title && <p className="font-medium text-sm mb-1">{toast.title}</p>}
        <p className="text-sm text-muted-foreground">{toast.message}</p>

        {toast.action && (
          <DaisyButton
            variant="link"
            size="sm"
            className="h-auto p-0 mt-2 text-xs"
            onClick={toast.action.onClick}>
          {toast.action.label}
          
        </DaisyButton>
        )}
      </div>

      {toast.dismissible && (
        <DaisyButton
          variant="ghost"
          size="sm"
          className="h-auto p-1 hover:bg-transparent"
          onClick={() => removeToast(toast.id)}
        >
          <X className="w-4 h-4" />
        </DaisyButton>
      )}
    </div>
  );
};

// Toast Container
const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

// Confirmation Dialog Hook
interface ConfirmationOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export const useConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions>({});
  const [resolver, setResolver] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((opts: ConfirmationOptions = {}): Promise<boolean> => {
    setOptions({
      title: 'Are you sure?',
      description: 'This action cannot be undone.',
      confirmText: 'Continue',
      cancelText: 'Cancel',
      variant: 'default',
      ...opts,
    });
    setIsOpen(true);

    return new Promise((resolve) => {
      setResolver({ resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (resolver) {
      resolver.resolve(true);
      setResolver(null);
    }
    setIsOpen(false);
  }, [resolver]);

  const handleCancel = useCallback(() => {
    if (resolver) {
      resolver.resolve(false);
      setResolver(null);
    }
    setIsOpen(false);
  }, [resolver]);

  const ConfirmationDialog = useCallback(
    () => (
      <DaisyAlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <DaisyAlertDialogContent>
          <DaisyAlertDialogHeader>
            <DaisyAlertDialogTitle>{options.title}</DaisyAlertDialogTitle>
            <DaisyAlertDialogDescription>{options.description}</DaisyAlertDialogDescription>
          </DaisyAlertDialogHeader>
          <DaisyAlertDialogFooter>
            <DaisyAlertDialogCancel onClick={handleCancel}>
              {options.cancelText}
            </DaisyAlertDialogCancel>
            <DaisyAlertDialogAction
              onClick={handleConfirm}
              className={
                options.variant === 'destructive' ? 'bg-destructive hover:bg-destructive/90' : ''
              }
            >
              {options.confirmText}
            </DaisyAlertDialogAction>
          </DaisyAlertDialogFooter>
        </DaisyAlertDialogContent>
      </DaisyAlertDialog>
    ),
    [isOpen, options, handleConfirm, handleCancel]
  );

  return { confirm, ConfirmationDialog };
};

// Feedback Form Component
interface FeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: FeedbackData) => Promise<void>;
  title?: string;
  description?: string;
}

interface FeedbackData {
  type: 'bug' | 'feature' | 'improvement' | 'other';
  rating?: number;
  message: string;
  email?: string;
  page?: string;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title = 'Send Feedback',
  description = 'Help us improve by sharing your thoughts',
}) => {
  const [formData, setFormData] = useState<FeedbackData>({
    type: 'improvement',
    rating: 5,
    message: '',
    email: '',
    page: typeof window !== 'undefined' ? window.location.pathname : '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.message.trim()) {
      toast.error('Please provide your feedback message');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      toast.success('Thank you for your feedback!');
      onClose();
      setFormData({
        type: 'improvement',
        rating: 5,
        message: '',
        email: '',
        page: typeof window !== 'undefined' ? window.location.pathname : '',
      });
    } catch (error) {
      toast.error('Failed to send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, rating: star }))}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={cn(
                'w-5 h-5',
                star <= (formData.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              )} />
          </button>
        ))}
      </div>
    );
  };

  return (
    <DaisyDialog open={isOpen} onOpenChange={onClose}>
      <DaisyDialogContent className="sm:max-w-md">
        <DaisyDialogHeader>
          <DaisyDialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {title}
          </DaisyDialogTitle>
          <DaisyDialogDescription>{description}</DaisyDialogDescription>
        </DaisyDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Feedback Type */}
          <div className="space-y-2">
            <DaisyLabel>What type of feedback is this?</DaisyLabel>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'bug', label: 'Bug Report' },
                { value: 'feature', label: 'Feature Request' },
                { value: 'improvement', label: 'Improvement' },
                { value: 'other', label: 'Other' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: value as any }))}
                  className={cn(
                    'px-3 py-1 text-sm rounded-full border transition-colors',
                    formData.type === value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <DaisyLabel>How would you rate your overall experience?</DaisyLabel>
            {renderStars()}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <DaisyLabel htmlFor="message">Your feedback *</DaisyLabel>
            <DaisyTextarea
              id="message"
              placeholder="Please describe your feedback in detail..."
              value={formData.message}
              onChange={(e) = />
setFormData((prev) => ({ ...prev, message: e.target.value }))}
              rows={4}
              required />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <DaisyLabel htmlFor="email">Email (optional)</DaisyLabel>
            <DaisyInput
              id="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) = />
setFormData((prev) => ({ ...prev, email: e.target.value }))} />
            <p className="text-xs text-muted-foreground">
              We'll only use this to follow up on your feedback
            </p>
          </div>

          <DaisyDialogFooter>
            <DaisyButton type="button" variant="outline" onClick={onClose}>
          Cancel
            
        </DaisyButton>
            <DaisyButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Feedback
                </>
              )}
            </DaisyButton>
          </DaisyDialogFooter>
        </form>
      </DaisyDialogContent>
    </DaisyDialog>
  );
};

// Feedback Hook
export const useFeedback = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openFeedback = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeFeedback = useCallback(() => {
    setIsOpen(false);
  }, []);

  const submitFeedback = useCallback(async (feedback: FeedbackData) => {
    // Submit feedback to API
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...feedback,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        url: window.location.href,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit feedback');
    }
  }, []);

  return {
    isOpen,
    openFeedback,
    closeFeedback,
    submitFeedback,
    FeedbackForm: () => (
      <FeedbackForm isOpen={isOpen} onClose={closeFeedback} onSubmit={submitFeedback} />
    ),
  };
};

// Status Banner Component
interface StatusBannerProps {
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  type,
  message,
  action,
  dismissible = true,
  onDismiss,
  className,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <DaisyAlertTriangle className="w-5 h-5 text-yellow-600">;</DaisyAlertTriangle>;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBackgroundClass = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200';
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 border rounded-lg',
        getBackgroundClass(),
        className
      )}
    >
      {getIcon()}

      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>

      <div className="flex items-center gap-2">
        {action && (
          <DaisyButton
            variant="link"
            size="sm"
            className="h-auto p-0 text-current hover:text-current/80"
            onClick={action.onClick}>
          {action.label}
          
        </DaisyButton>
        )}

        {dismissible && (
          <DaisyButton
            variant="ghost"
            size="sm"
            className="h-auto p-1 hover:bg-current/10 text-current"
            onClick={onDismiss}
          >
            <X className="w-4 h-4" />
          </DaisyButton>
        )}
      </div>
    </div>
  );
};

// All components and hooks are exported as named exports above
