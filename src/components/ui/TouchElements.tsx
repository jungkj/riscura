'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyCard, DaisyCardBody } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import {
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  X,
  Check,
  Heart,
  Star,
  Share2,
  Bookmark,
  Flag,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Move,
  GripVertical,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RefreshCw,
  Download,
  Upload,
  Edit,
  Trash2,
  Copy,
  Settings,
  Filter,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

// Types
interface TouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  onLongPress?: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  hapticFeedback?: boolean;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon: React.ReactNode;
    label: string;
    color: string;
  };
  rightAction?: {
    icon: React.ReactNode;
    label: string;
    color: string;
  };
  className?: string;
}

interface DraggableItemProps {
  children: React.ReactNode;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDrop?: (data: any) => void;
  dragData?: any;
  className?: string;
}

interface TouchSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  showValue?: boolean;
  className?: string;
  'aria-label'?: string;
}

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshThreshold?: number;
  className?: string;
}

// Custom Hooks
const useLongPress = (
  callback: () => void,
  ms = 500
) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const start = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callbackRef.current();
    }, ms);
  };

  const stop = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return { onTouchStart: start, onTouchEnd: stop, onMouseDown: start, onMouseUp: stop, onMouseLeave: stop };
};

const useSwipe = (
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  threshold = 50
) => {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }

    touchStart.current = null;
  };

  return { onTouchStart, onTouchEnd };
};

const useHapticFeedback = () => {
  const vibrate = (pattern?: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern || 50);
    }
  };

  return { vibrate };
};

// Touch Button Component
export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  onClick,
  onLongPress,
  variant = 'default',
  size = 'md',
  disabled = false,
  className,
  'aria-label': ariaLabel,
  hapticFeedback = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const { vibrate } = useHapticFeedback();
  
  const longPressProps = useLongPress(() => {
    if (onLongPress && !disabled) {
      if (hapticFeedback) vibrate([50, 50, 50]);
      onLongPress();
    }
  });

  const handleClick = () => {
    if (onClick && !disabled) {
      if (hapticFeedback) vibrate(25);
      onClick();
    }
  };

  const sizeClasses = {
    sm: 'h-9 px-3 text-sm min-w-[36px]',
    md: 'h-11 px-4 text-base min-w-[44px]',
    lg: 'h-14 px-6 text-lg min-w-[56px]',
    xl: 'h-16 px-8 text-xl min-w-[64px]',
  };

  return (
    <DaisyButton
      variant={variant}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        sizeClasses[size],
        'touch-manipulation select-none transition-all duration-150',
        'active:scale-95 active:brightness-90',
        isPressed && 'scale-95 brightness-90',
        className
      )}
      onClick={handleClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      {...longPressProps}
    >
      {children}
    </DaisyButton>
  );
};

// Swipeable Card Component
export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className,
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current || !isDragging) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;

    // Only allow horizontal swipe if it's primarily horizontal
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
      const maxSwipe = 100;
      const clampedOffset = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
      setSwipeOffset(clampedOffset);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    const threshold = 50;
    
    if (swipeOffset > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (swipeOffset < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }

    setSwipeOffset(0);
    setIsDragging(false);
    touchStart.current = null;
  };

  const leftActionOpacity = Math.max(0, swipeOffset / 100);
  const rightActionOpacity = Math.max(0, -swipeOffset / 100);

  return (
    <div className="relative overflow-hidden">
      {/* Left Action Background */}
      {leftAction && (
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex items-center justify-start pl-4 transition-opacity",
            leftAction.color
          )}
          style={{ opacity: leftActionOpacity }}
        >
          <div className="flex items-center space-x-2">
            {leftAction.icon}
            <span className="text-white font-medium">{leftAction.label}</span>
          </div>
        </div>
      )}

      {/* Right Action Background */}
      {rightAction && (
        <div
          className={cn(
            "absolute inset-y-0 right-0 flex items-center justify-end pr-4 transition-opacity",
            rightAction.color
          )}
          style={{ opacity: rightActionOpacity }}
        >
          <div className="flex items-center space-x-2">
            <span className="text-white font-medium">{rightAction.label}</span>
            {rightAction.icon}
          </div>
        </div>
      )}

      {/* Card Content */}
      <DaisyCard
        ref={cardRef}
        className={cn(
          "relative bg-white transition-transform duration-150 ease-out touch-manipulation",
          className
        )}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </DaisyCard>
    </div>
  );
};

// Draggable Item Component
export const DraggableItem: React.FC<DraggableItemProps> = ({
  children,
  onDragStart,
  onDragEnd,
  onDrop,
  dragData,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);
  const initialPosition = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    initialPosition.current = { x: touch.clientX, y: touch.clientY };
    setIsDragging(true);
    onDragStart?.();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !initialPosition.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - initialPosition.current.x;
    const deltaY = touch.clientY - initialPosition.current.y;

    setDragPosition({ x: deltaX, y: deltaY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setDragPosition({ x: 0, y: 0 });
    initialPosition.current = null;
    onDragEnd?.();
  };

  return (
    <div
      ref={dragRef}
      className={cn(
        "relative touch-manipulation transition-transform duration-150",
        isDragging && "z-50 scale-105 shadow-lg",
        className
      )}
      style={{
        transform: isDragging 
          ? `translate(${dragPosition.x}px, ${dragPosition.y}px) scale(1.05)` 
          : 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center space-x-2">
        <div className="touch-manipulation cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-text-secondary" />
        </div>
        {children}
      </div>
    </div>
  );
};

// Touch Slider Component
export const TouchSlider: React.FC<TouchSliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  showValue = true,
  className,
  'aria-label': ariaLabel,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const { vibrate } = useHapticFeedback();

  const handleTouchStart = () => {
    if (!disabled) {
      setIsDragging(true);
      vibrate(25);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled || !sliderRef.current) return;

    const touch = e.touches[0];
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    const newValue = min + (max - min) * percentage;
    const steppedValue = Math.round(newValue / step) * step;
    
    onChange(Math.max(min, Math.min(max, steppedValue)));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      {showValue && (
        <div className="flex justify-between items-center">
          <span className="text-body-sm font-medium" aria-label={ariaLabel}>
            {ariaLabel}
          </span>
          <span className="text-body-sm text-text-secondary">{value}</span>
        </div>
      )}
      
      <div
        ref={sliderRef}
        className={cn(
          "relative h-12 bg-surface-secondary rounded-lg touch-manipulation",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={ariaLabel}
        tabIndex={disabled ? -1 : 0}
      >
        {/* Track */}
        <div className="absolute top-1/2 left-3 right-3 h-2 bg-border rounded-full transform -translate-y-1/2">
          {/* Fill */}
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-150"
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Thumb */}
        <div
          className={cn(
            "absolute top-1/2 w-8 h-8 bg-white border-2 border-blue-600 rounded-full transform -translate-y-1/2 shadow-md transition-all duration-150",
            isDragging && "scale-125 shadow-lg"
          )}
          style={{ left: `calc(${percentage}% - 16px + 12px)` }}
        />
      </div>
    </div>
  );
};

// Pull to Refresh Component
export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  refreshThreshold = 80,
  className,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ y: number; scrollTop: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    
    const touch = e.touches[0];
    const scrollTop = containerRef.current.scrollTop;
    
    if (scrollTop === 0) {
      touchStart.current = { y: touch.clientY, scrollTop };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current || isRefreshing) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStart.current.y;

    if (deltaY > 0 && containerRef.current?.scrollTop === 0) {
      e.preventDefault();
      const distance = Math.min(deltaY * 0.5, 120);
      setPullDistance(distance);
      setCanRefresh(distance >= refreshThreshold);
    }
  };

  const handleTouchEnd = async () => {
    if (canRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
    setCanRefresh(false);
    touchStart.current = null;
  };

  const refreshProgress = Math.min((pullDistance / refreshThreshold) * 100, 100);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Pull to Refresh Indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center bg-surface-secondary border-b border-border transition-all duration-300 ease-out"
        style={{
          height: pullDistance,
          opacity: pullDistance > 0 ? 1 : 0,
        }}
      >
        <div className="flex flex-col items-center space-y-2">
          <div className={cn(
            "transition-all duration-300",
            isRefreshing ? "animate-spin" : canRefresh ? "scale-110" : "scale-100"
          )}>
            <RefreshCw className={cn(
              "h-5 w-5",
              canRefresh ? "text-blue-600" : "text-text-secondary"
            )} />
          </div>
          <span className="text-caption text-text-secondary">
            {isRefreshing ? 'Refreshing...' : canRefresh ? 'Release to refresh' : 'Pull to refresh'}
          </span>
          {pullDistance > 0 && !isRefreshing && (
            <DaisyProgress value={refreshProgress} className="w-16 h-1" />
          )}
        </div>
      </div>

      {/* Content */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto overscroll-y-none"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s ease-out' : 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};

// Touch Action Menu Component
export const TouchActionMenu: React.FC<{
  items: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive';
    disabled?: boolean;
  }>;
  trigger?: React.ReactNode;
  className?: string;
}> = ({ items, trigger, className }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <TouchButton
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="md"
        aria-label="Open action menu"
      >
        {trigger || <MoreHorizontal className="h-4 w-4" />}
      </TouchButton>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-25"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <DaisyCard className="absolute right-0 top-full mt-2 z-50 min-w-48 shadow-lg" >
  <DaisyCardContent className="p-2" >
  </DaisyProgress>
</DaisyCardContent>
              {items.map((item) => (
                <TouchButton
                  key={item.id}
                  variant="ghost"
                  size="md"
                  disabled={item.disabled}
                  className={cn(
                    "w-full justify-start space-x-3 h-12",
                    item.variant === 'destructive' && "text-red-600 hover:text-red-700 hover:bg-red-50"
                  )}
                  onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </TouchButton>
              ))}
            </DaisyCardContent>
          </DaisyCard>
        </>
      )}
    </div>
  );
};

// Touch Chip/Tag Component
export const TouchChip: React.FC<{
  children: React.ReactNode;
  onRemove?: () => void;
  onClick?: () => void;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ 
  children, 
  onRemove, 
  onClick, 
  variant = 'default', 
  size = 'md',
  className 
}) => {
  const sizeClasses = {
    sm: 'h-7 px-2 text-xs',
    md: 'h-9 px-3 text-sm',
    lg: 'h-11 px-4 text-base',
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border transition-all duration-150 touch-manipulation",
        sizeClasses[size],
        variant === 'default' && "bg-blue-100 text-blue-800 border-blue-200",
        variant === 'secondary' && "bg-surface-secondary text-text-primary border-border",
        variant === 'outline' && "bg-transparent text-text-primary border-border",
        onClick && "cursor-pointer hover:shadow-sm active:scale-95",
        className
      )}
      onClick={onClick}
    >
      <span className="truncate">{children}</span>
      {onRemove && (
        <TouchButton
          variant="ghost"
          size="sm"
          className="ml-1 h-5 w-5 p-0 hover:bg-red-100 hover:text-red-600"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove"
        >
          <X className="h-3 w-3" />
        </TouchButton>
      )}
    </div>
  );
};

export default {
  TouchButton,
  SwipeableCard,
  DraggableItem,
  TouchSlider,
  PullToRefresh,
  TouchActionMenu,
  TouchChip,
};