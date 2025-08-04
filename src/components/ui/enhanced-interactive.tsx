import React, { useState, useRef, useEffect } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useDragControls,
} from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  variants,
  interactions,
  feedbackAnimations,
  timings,
  easings,
  animationUtils,
} from '@/lib/design-system/micro-interactions';

// Enhanced Interactive Button with Micro-Interactions
interface EnhancedInteractiveButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  success?: boolean;
  error?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export const EnhancedInteractiveButton: React.FC<EnhancedInteractiveButtonProps> = ({
  children,
  onClick,
  loading = false,
  success = false,
  error = false,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [feedbackState, setFeedbackState] = useState<'idle' | 'success' | 'error'>('idle');

  const handleClick = async () => {
    if (disabled || loading) return;

    setIsPressed(true);
    try {
      if (onClick) {
        await onClick();
        setFeedbackState('success');
        setTimeout(() => setFeedbackState('idle'), 1000);
      }
    } catch (err) {
      setFeedbackState('error');
      setTimeout(() => setFeedbackState('idle'), 1000);
    } finally {
      setIsPressed(false);
    }
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700',
    secondary: 'bg-slate-600 text-white border-slate-600 hover:bg-slate-700',
    outline: 'bg-transparent text-blue-600 border-blue-600 hover:bg-blue-50',
    ghost: 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      className={cn(
        'relative inline-flex items-center justify-center font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      variants={variants.button}
      initial="initial"
      whileHover={!disabled && !loading ? 'hover' : undefined}
      whileTap={!disabled && !loading ? 'tap' : undefined}
      animate={
        loading
          ? 'loading'
          : feedbackState === 'success'
            ? 'success'
            : feedbackState === 'error'
              ? 'error'
              : 'initial'
      }
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {/* Background Ripple Effect */}
      <AnimatePresence>
        {Boolean(isPressed) && (
          <motion.div
            className="absolute inset-0 bg-white rounded-lg"
            initial={{ scale: 0, opacity: 0.3 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Loading Spinner */}
      <AnimatePresence>
        {Boolean(loading) && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button Content */}
      <motion.span
        className={cn('relative flex items-center gap-2', loading && 'opacity-0')}
        layout
      >
        {children}
      </motion.span>
    </motion.button>
  );
};

// Enhanced Draggable Card
interface EnhancedDraggableCardProps {
  children: React.ReactNode;
  onDragEnd?: (info: any) => void;
  dragConstraints?: any;
  className?: string;
  disabled?: boolean;
}

export const EnhancedDraggableCard: React.FC<EnhancedDraggableCardProps> = ({
  children,
  onDragEnd,
  dragConstraints,
  className = '',
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragControls = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  return (
    <motion.div
      className={cn(
        'relative cursor-grab active:cursor-grabbing rounded-xl bg-white border border-slate-200 shadow-sm',
        isDragging && 'shadow-2xl z-50',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      drag={!disabled}
      dragControls={dragControls}
      dragConstraints={dragConstraints}
      dragElastic={0.1}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
      style={{ x, y, rotateX, rotateY }}
      variants={variants.draggable}
      animate={isDragging ? 'drag' : 'initial'}
      whileHover={!disabled && !isDragging ? 'hover' : undefined}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(event, info) => {
        setIsDragging(false);
        onDragEnd?.(info);
      }}
      layout
    >
      {/* Drag Handle Indicator */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-slate-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      {children}
    </motion.div>
  );
};

// Enhanced Loading Skeleton with Shimmer Effect
interface EnhancedSkeletonProps {
  className?: string;
  lines?: number;
  avatar?: boolean;
  height?: string;
  animated?: boolean;
}

export const EnhancedSkeleton: React.FC<EnhancedSkeletonProps> = ({
  className = '',
  lines = 3,
  avatar = false,
  height = 'h-4',
  animated = true,
}) => {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="flex items-start space-x-4">
        {Boolean(avatar) && (
          <div className="w-12 h-12 bg-slate-200 rounded-full relative overflow-hidden">
            {Boolean(animated) && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
          </div>
        )}

        <div className="flex-1 space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                'bg-slate-200 rounded-md relative overflow-hidden',
                height,
                i === lines - 1 && 'w-3/4'
              )}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            >
              {Boolean(animated) && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.1,
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Enhanced Progress Indicator with Smooth Animations
interface EnhancedProgressProps {
  value: number;
  max?: number;
  className?: string;
  showPercentage?: boolean;
  animated?: boolean;
  color?: 'blue' | 'green' | 'red' | 'yellow';
  size?: 'sm' | 'md' | 'lg';
}

export const EnhancedProgress: React.FC<EnhancedProgressProps> = ({
  value,
  max = 100,
  className = '',
  showPercentage = true,
  animated = true,
  color = 'blue',
  size = 'md',
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
  };

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('relative', className)}>
      <div className={cn('w-full bg-slate-200 rounded-full overflow-hidden', sizeClasses[size])}>
        <motion.div
          className={cn('h-full rounded-full relative overflow-hidden', colorClasses[color])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: animated ? timings.moderate : 0,
            ease: easings.smooth,
          }}
        >
          {Boolean(animated) && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </motion.div>
      </div>

      {Boolean(showPercentage) && (
        <motion.div
          className="absolute top-full mt-1 text-xs text-slate-600 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {Math.round(percentage)}%
        </motion.div>
      )}
    </div>
  );
};

// Enhanced Notification Toast
interface EnhancedToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
  autoClose?: number;
  className?: string;
}

export const EnhancedToast: React.FC<EnhancedToastProps> = ({
  message,
  type = 'info',
  onClose,
  autoClose = 5000,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, autoClose);

      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <AnimatePresence>
      {Boolean(isVisible) && (
        <motion.div
          className={cn(
            'flex items-center gap-3 p-4 rounded-lg border shadow-lg',
            typeStyles[type],
            className
          )}
          variants={variants.notification}
          initial="initial"
          animate="animate"
          exit="exit"
          layout
        >
          <motion.div
            className="flex-shrink-0 w-5 h-5 rounded-full bg-current flex items-center justify-center text-white text-xs font-bold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 500 }}
          >
            {icons[type]}
          </motion.div>

          <div className="flex-1 text-sm font-medium">{message}</div>

          {Boolean(onClose) && (
            <motion.button
              className="flex-shrink-0 text-current hover:opacity-70 transition-opacity"
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onClose(), 300);
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ✕
            </motion.button>
          )}

          {/* Progress Bar for Auto-close */}
          {autoClose > 0 && (
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-current rounded-b-lg"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: autoClose / 1000, ease: 'linear' }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Enhanced Hover Card with Smooth Reveal
interface EnhancedHoverCardProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const EnhancedHoverCard: React.FC<EnhancedHoverCardProps> = ({
  trigger,
  content,
  placement = 'top',
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const placementStyles = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {trigger}

      <AnimatePresence>
        {Boolean(isHovered) && (
          <motion.div
            className={cn(
              'absolute z-50 bg-white border border-slate-200 rounded-lg shadow-lg p-3',
              placementStyles[placement],
              className
            )}
            initial={{ opacity: 0, scale: 0.9, y: placement === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: placement === 'top' ? 10 : -10 }}
            transition={{ duration: timings.quick, ease: easings.snappy }}
          >
            {content}

            {/* Arrow */}
            <div
              className={cn(
                'absolute w-2 h-2 bg-white border transform rotate-45',
                placement === 'top' &&
                  'top-full -mt-1 left-1/2 -translate-x-1/2 border-r border-b border-l-0 border-t-0',
                placement === 'bottom' &&
                  'bottom-full -mb-1 left-1/2 -translate-x-1/2 border-l border-t border-r-0 border-b-0',
                placement === 'left' &&
                  'left-full -ml-1 top-1/2 -translate-y-1/2 border-t border-r border-l-0 border-b-0',
                placement === 'right' &&
                  'right-full -mr-1 top-1/2 -translate-y-1/2 border-b border-l border-t-0 border-r-0'
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
