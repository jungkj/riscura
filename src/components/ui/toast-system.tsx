import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedToast } from './enhanced-interactive';
import { variants } from '@/lib/design-system/micro-interactions';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  autoClose?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 5,
  position = 'top-right',
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast = { ...toast, id };

      setToasts((prev) => {
        const updated = [newToast, ...prev];
        return updated.slice(0, maxToasts);
      });

      // Announce to screen readers
      const announcement = `${toast.type}: ${toast.message}`;
      announceToScreenReader(announcement);
    },
    [maxToasts]
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast, clearToasts }}>
      {children}
      {typeof window !== 'undefined' &&
        createPortal(
          <div
            className={`fixed z-50 ${positionClasses[position]} space-y-3 max-w-sm w-full`}
            role="region"
            aria-label="Notifications"
            aria-live="polite"
          >
            <AnimatePresence mode="popLayout">
              {toasts.map((toast, index) => (
                <motion.div
                  key={toast.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: -50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 100 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 24,
                    layout: { duration: 0.2 },
                  }}
                  style={{ zIndex: toasts.length - index }}
                >
                  <EnhancedToast
                    message={toast.message}
                    type={toast.type}
                    autoClose={toast.autoClose}
                    onClose={() => removeToast(toast.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
};

// Utility function to announce to screen readers
const announceToScreenReader = (message: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'assertive');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Convenience hooks for different toast types
export const useToastHelpers = () => {
  const { addToast } = useToast();

  return {
    success: (message: string, autoClose?: number) =>
      addToast({ message, type: 'success', autoClose }),
    error: (message: string, autoClose?: number) => addToast({ message, type: 'error', autoClose }),
    warning: (message: string, autoClose?: number) =>
      addToast({ message, type: 'warning', autoClose }),
    info: (message: string, autoClose?: number) => addToast({ message, type: 'info', autoClose }),
  };
};
