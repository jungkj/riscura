'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface ModernButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'shimmer' | 'outline' | 'gradient' | 'brutal';
  size?: 'sm' | 'default' | 'lg';
  children: React.ReactNode;
}

export const ModernButton = React.forwardRef<HTMLButtonElement, ModernButtonProps>(
  ({ className, variant = 'default', size = 'default', children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'px-4 py-2 text-sm',
      default: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    const baseClasses =
      'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    if (variant === 'shimmer') {
      return (
        <motion.button
          ref={ref}
          className={cn(
            baseClasses,
            sizeClasses[size],
            'relative overflow-hidden bg-[#199BEC] text-white border border-[#199BEC] hover:bg-[#0f7dc7] focus:ring-[#199BEC]/50',
            className
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          {...props}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
          <span className="relative z-10">{children}</span>
        </motion.button>
      );
    }

    if (variant === 'outline') {
      return (
        <motion.button
          ref={ref}
          className={cn(
            baseClasses,
            sizeClasses[size],
            'bg-transparent border-2 border-[#199BEC] text-[#199BEC] hover:bg-[#199BEC] hover:text-white focus:ring-[#199BEC]/50',
            className
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          {...props}
        >
          {children}
        </motion.button>
      );
    }

    if (variant === 'gradient') {
      return (
        <motion.button
          ref={ref}
          className={cn(
            baseClasses,
            sizeClasses[size],
            'bg-gradient-to-r from-[#199BEC] to-[#0f7dc7] text-white border-0 hover:from-[#0f7dc7] hover:to-[#0a6ab1] focus:ring-[#199BEC]/50 shadow-lg hover:shadow-xl',
            className
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          {...props}
        >
          {children}
        </motion.button>
      );
    }

    if (variant === 'brutal') {
      return (
        <motion.button
          ref={ref}
          className={cn(
            baseClasses,
            sizeClasses[size],
            'bg-[#199BEC] text-white border-4 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] focus:ring-[#199BEC]/50',
            className
          )}
          whileTap={{ scale: 0.95 }}
          {...props}
        >
          {children}
        </motion.button>
      );
    }

    // Default variant
    return (
      <motion.button
        ref={ref}
        className={cn(
          baseClasses,
          sizeClasses[size],
          'bg-[#199BEC] text-white border border-[#199BEC] hover:bg-[#0f7dc7] focus:ring-[#199BEC]/50 shadow-sm hover:shadow-md',
          className
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

ModernButton.displayName = 'ModernButton';
