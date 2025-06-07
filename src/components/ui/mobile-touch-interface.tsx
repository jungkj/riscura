'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

// Touch target size constants (WCAG 2.1 AA compliance)
const TOUCH_TARGET_SIZE = {
  minimum: 44, // px - WCAG minimum
  comfortable: 48, // px - recommended
  large: 56 // px - for primary actions
};

// Gesture thresholds
const GESTURE_THRESHOLDS = {
  swipe: 50, // px minimum distance
  velocity: 500, // px/s minimum velocity
  tap: 150, // ms maximum duration
  longPress: 500, // ms minimum duration
  doubleTap: 300 // ms maximum time between taps
};

export interface TouchTargetProps {
  size?: 'minimum' | 'comfortable' | 'large';
  children: React.ReactNode;
  className?: string;
  onTap?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  disabled?: boolean;
  hapticFeedback?: boolean;
}

export interface SwipeableProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

export interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

export interface TouchSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
  showValue?: boolean;
}

export interface TouchMenuProps {
  items: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    action: () => void;
    disabled?: boolean;
  }>;
  trigger: React.ReactNode;
  className?: string;
}

// Enhanced touch target component
export const TouchTarget: React.FC<TouchTargetProps> = ({
  size = 'comfortable',
  children,
  className,
  onTap,
  onLongPress,
  onDoubleTap,
  disabled = false,
  hapticFeedback = true,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const pressTimer = useRef<NodeJS.Timeout>();
  const tapCount = useRef(0);

  const targetSize = TOUCH_TARGET_SIZE[size];

  const triggerHaptic = useCallback(() => {
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10); // Short vibration
    }
  }, [hapticFeedback]);

  const handleTouchStart = useCallback(() => {
    if (disabled) return;
    
    setIsPressed(true);
    triggerHaptic();

    // Start long press timer
    if (onLongPress) {
      pressTimer.current = setTimeout(() => {
        onLongPress();
        triggerHaptic();
      }, GESTURE_THRESHOLDS.longPress);
    }
  }, [disabled, onLongPress, triggerHaptic]);

  const handleTouchEnd = useCallback(() => {
    if (disabled) return;
    
    setIsPressed(false);
    
    // Clear long press timer
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }

    // Handle tap and double tap
    const now = Date.now();
    tapCount.current += 1;

    if (tapCount.current === 1) {
      setTimeout(() => {
        if (tapCount.current === 1) {
          onTap?.();
        } else if (tapCount.current === 2 && onDoubleTap) {
          onDoubleTap();
          triggerHaptic();
        }
        tapCount.current = 0;
      }, GESTURE_THRESHOLDS.doubleTap);
    }

    setLastTap(now);
  }, [disabled, onTap, onDoubleTap, triggerHaptic]);

  return (
    <motion.div
      className={cn(
        'relative inline-flex items-center justify-center',
        'select-none touch-manipulation',
        'transition-colors duration-150',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      style={{
        minWidth: targetSize,
        minHeight: targetSize,
        WebkitTapHighlightColor: 'transparent'
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      whileTap={{ scale: 0.95 }}
      animate={{
        scale: isPressed ? 0.95 : 1,
        backgroundColor: isPressed ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Swipeable container component
export const Swipeable: React.FC<SwipeableProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = GESTURE_THRESHOLDS.swipe,
  className,
  disabled = false
}) => {
  const handlePanEnd = useCallback(
    (event: any, info: PanInfo) => {
      if (disabled) return;

      const { offset, velocity } = info;
      const { x, y } = offset;

      // Check if gesture meets threshold requirements
      const meetsDistanceThreshold = Math.abs(x) > threshold || Math.abs(y) > threshold;
      const meetsVelocityThreshold = Math.abs(velocity.x) > GESTURE_THRESHOLDS.velocity || 
                                   Math.abs(velocity.y) > GESTURE_THRESHOLDS.velocity;

      if (!meetsDistanceThreshold && !meetsVelocityThreshold) return;

      // Determine swipe direction
      if (Math.abs(x) > Math.abs(y)) {
        // Horizontal swipe
        if (x > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (x < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (y > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (y < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    },
    [disabled, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]
  );

  return (
    <motion.div
      className={cn('touch-manipulation', className)}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.1}
      onPanEnd={handlePanEnd}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {children}
    </motion.div>
  );
};

// Pull to refresh component
export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  threshold = 80,
  className,
  disabled = false
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, threshold], [0, 1]);
  const scale = useTransform(y, [0, threshold], [0.8, 1]);

  const handlePan = useCallback(
    (event: any, info: PanInfo) => {
      if (disabled || isRefreshing) return;

      const { offset } = info;
      const distance = Math.max(0, offset.y);
      
      setPullDistance(distance);
      y.set(distance);
    },
    [disabled, isRefreshing, y]
  );

  const handlePanEnd = useCallback(
    async (event: any, info: PanInfo) => {
      if (disabled || isRefreshing) return;

      const { offset } = info;
      
      if (offset.y >= threshold) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      
      setPullDistance(0);
      y.set(0);
    },
    [disabled, isRefreshing, threshold, onRefresh, y]
  );

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center h-16 bg-blue-50"
        style={{
          opacity,
          scale,
          y: useTransform(y, [0, threshold], [-64, 0])
        }}
      >
        <motion.div
          className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"
          animate={isRefreshing ? { rotate: 360 } : {}}
          transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
        />
        <span className="ml-2 text-sm text-blue-600">
          {isRefreshing ? 'Refreshing...' : pullDistance >= threshold ? 'Release to refresh' : 'Pull to refresh'}
        </span>
      </motion.div>

      {/* Content */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        style={{ y }}
      >
        {children}
      </motion.div>
    </div>
  );
};

// Touch-optimized slider
export const TouchSlider: React.FC<TouchSliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className,
  disabled = false,
  showValue = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;

  const handlePan = useCallback(
    (event: any, info: PanInfo) => {
      if (disabled || !sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const x = info.point.x - rect.left;
      const newPercentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const newValue = min + (newPercentage / 100) * (max - min);
      const steppedValue = Math.round(newValue / step) * step;

      onChange(Math.max(min, Math.min(max, steppedValue)));
    },
    [disabled, min, max, step, onChange]
  );

  return (
    <div className={cn('relative py-4', className)}>
      {/* Track */}
      <div
        ref={sliderRef}
        className="relative h-2 bg-gray-200 rounded-full touch-manipulation"
        style={{ minHeight: TOUCH_TARGET_SIZE.minimum }}
      >
        {/* Progress */}
        <div
          className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
          style={{ width: `${percentage}%` }}
        />

        {/* Thumb */}
        <motion.div
          className={cn(
            'absolute top-1/2 w-6 h-6 bg-white border-2 border-blue-500 rounded-full shadow-md',
            'transform -translate-y-1/2 cursor-pointer',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{
            left: `${percentage}%`,
            marginLeft: '-12px',
            minWidth: TOUCH_TARGET_SIZE.minimum,
            minHeight: TOUCH_TARGET_SIZE.minimum
          }}
          drag="x"
          dragConstraints={sliderRef}
          dragElastic={0}
          onPan={handlePan}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          whileDrag={{ scale: 1.2 }}
          animate={{ scale: isDragging ? 1.2 : 1 }}
        />
      </div>

      {/* Value display */}
      {showValue && (
        <div className="mt-2 text-center text-sm text-gray-600">
          {value}
        </div>
      )}
    </div>
  );
};

// Touch-optimized context menu
export const TouchMenu: React.FC<TouchMenuProps> = ({
  items,
  trigger,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLongPress = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    event.preventDefault();
    
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setIsOpen(true);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, []);

  const handleItemSelect = useCallback((action: () => void) => {
    action();
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <TouchTarget onLongPress={handleLongPress} className={className}>
        {trigger}
      </TouchTarget>

      {isOpen && (
        <motion.div
          ref={menuRef}
          className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-48"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translateX(-50%) translateY(-100%)'
          }}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {items.map((item) => (
            <TouchTarget
              key={item.id}
              size="large"
              onTap={() => handleItemSelect(item.action)}
              disabled={item.disabled}
              className={cn(
                'flex items-center px-4 py-3 text-left w-full',
                'hover:bg-gray-50 active:bg-gray-100',
                item.disabled && 'opacity-50'
              )}
            >
              {item.icon && (
                <span className="mr-3 text-gray-500">{item.icon}</span>
              )}
              <span className="text-gray-900">{item.label}</span>
            </TouchTarget>
          ))}
        </motion.div>
      )}
    </>
  );
};

// Mobile navigation drawer
export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: 'left' | 'right' | 'bottom';
  className?: string;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  children,
  position = 'left',
  className
}) => {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-300, 0], [0, 0.5]);

  const handlePanEnd = useCallback(
    (event: any, info: PanInfo) => {
      const { offset, velocity } = info;
      
      if (position === 'left') {
        if (offset.x < -100 || velocity.x < -500) {
          onClose();
        }
      } else if (position === 'right') {
        if (offset.x > 100 || velocity.x > 500) {
          onClose();
        }
      } else if (position === 'bottom') {
        if (offset.y > 100 || velocity.y > 500) {
          onClose();
        }
      }
    },
    [position, onClose]
  );

  const getInitialPosition = () => {
    switch (position) {
      case 'left': return { x: '-100%' };
      case 'right': return { x: '100%' };
      case 'bottom': return { y: '100%' };
      default: return { x: '-100%' };
    }
  };

  const getAnimatePosition = () => {
    switch (position) {
      case 'left': return { x: 0 };
      case 'right': return { x: 0 };
      case 'bottom': return { y: 0 };
      default: return { x: 0 };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black"
        style={{ opacity }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        onTap={onClose}
      />

      {/* Drawer */}
      <motion.div
        className={cn(
          'absolute bg-white shadow-xl',
          position === 'left' && 'left-0 top-0 bottom-0 w-80 max-w-[80vw]',
          position === 'right' && 'right-0 top-0 bottom-0 w-80 max-w-[80vw]',
          position === 'bottom' && 'left-0 right-0 bottom-0 max-h-[80vh]',
          className
        )}
        drag={position === 'bottom' ? 'y' : 'x'}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.1}
        onPanEnd={handlePanEnd}
        initial={getInitialPosition()}
        animate={getAnimatePosition()}
        exit={getInitialPosition()}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ x: position !== 'bottom' ? x : undefined }}
      >
        {children}
      </motion.div>
    </div>
  );
};

// Export all components
export default {
  TouchTarget,
  Swipeable,
  PullToRefresh,
  TouchSlider,
  TouchMenu,
  MobileDrawer,
  TOUCH_TARGET_SIZE,
  GESTURE_THRESHOLDS
}; 