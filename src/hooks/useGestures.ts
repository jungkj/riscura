'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useGesture } from '@use-gesture/react';

interface GestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onPullToRefresh?: () => void;
  swipeThreshold?: number;
  velocityThreshold?: number;
  longPressDelay?: number;
  doubleTapDelay?: number;
  pinchEnabled?: boolean;
  pullToRefreshEnabled?: boolean;
  preventScroll?: boolean;
  disabled?: boolean;
}

interface GestureState {
  isActive: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
  velocity: number;
  scale: number;
  isPulling: boolean;
  pullDistance: number;
}

export function useGestures(_config: GestureConfig = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onTap,
    onDoubleTap,
    onLongPress,
    onPullToRefresh,
    swipeThreshold = 50,
    velocityThreshold = 0.5,
    longPressDelay = 500,
    doubleTapDelay = 300,
    pinchEnabled = false,
    pullToRefreshEnabled = false,
    preventScroll = false,
    disabled = false,
  } = config;

  const gestureState = useRef<GestureState>({
    isActive: false,
    direction: null,
    distance: 0,
    velocity: 0,
    scale: 1,
    isPulling: false,
    pullDistance: 0,
  });

  const tapCount = useRef(0);
  const tapTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const lastTouchTime = useRef(0);

  // Clear timers
  const clearTimers = useCallback(() => {
    if (tapTimer.current) {
      clearTimeout(tapTimer.current)
      tapTimer.current = null;
    }
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Handle tap gestures
  const handleTap = useCallback(() => {
    if (disabled) return

    const now = Date.now();
    tapCount.current += 1;

    if (tapCount.current === 1) {
      tapTimer.current = setTimeout(() => {
        if (tapCount.current === 1) {
          onTap?.();
        }
        tapCount.current = 0;
      }, doubleTapDelay);
    } else if (tapCount.current === 2) {
      clearTimers();
      onDoubleTap?.();
      tapCount.current = 0;
    }

    lastTouchTime.current = now;
  }, [disabled, onTap, onDoubleTap, doubleTapDelay, clearTimers]);

  // Handle long press
  const startLongPress = useCallback(() => {
    if (disabled || !onLongPress) return

    longPressTimer.current = setTimeout(() => {
      onLongPress();
    }, longPressDelay);
  }, [disabled, onLongPress, longPressDelay]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Gesture handlers
  const bind = useGesture(
    {
      onDrag: ({
        movement: [mx, my],
        velocity: [vx, vy],
        direction: [dx, dy],
        cancel,
        first,
        last,
      }) => {
        if (disabled) return

        const distance = Math.sqrt(mx * mx + my * my);
        const velocityMagnitude = Math.sqrt(vx * vx + vy * vy);

        gestureState.current = {
          ...gestureState.current,
          isActive: !last,
          distance,
          velocity: velocityMagnitude,
        }

        if (first) {
          startLongPress();
        }

        if (distance > 10) {
          cancelLongPress();
        }

        // Pull to refresh
        if (pullToRefreshEnabled && onPullToRefresh && dy > 0 && my > 0) {
          gestureState.current.isPulling = true
          gestureState.current.pullDistance = my;

          if (my > 80 && vy > velocityThreshold) {
            onPullToRefresh();
            cancel();
          }
        }

        // Swipe detection
        if (last && distance > swipeThreshold && velocityMagnitude > velocityThreshold) {
          const absX = Math.abs(mx)
          const absY = Math.abs(my);

          if (absX > absY) {
            // Horizontal swipe
            if (mx > 0) {
              gestureState.current.direction = 'right'
              onSwipeRight?.();
            } else {
              gestureState.current.direction = 'left';
              onSwipeLeft?.();
            }
          } else {
            // Vertical swipe
            if (my > 0) {
              gestureState.current.direction = 'down'
              onSwipeDown?.();
            } else {
              gestureState.current.direction = 'up';
              onSwipeUp?.();
            }
          }
        }

        if (last) {
          cancelLongPress();
          gestureState.current.isPulling = false;
          gestureState.current.pullDistance = 0;
        }
      },

      onPinch: ({ offset: [scale], cancel }) => {
        if (disabled || !pinchEnabled) return;

        gestureState.current.scale = scale;
        onPinch?.(scale);
      },

      onPointerDown: () => {
        if (disabled) return;
        startLongPress();
      },

      onPointerUp: () => {
        if (disabled) return;
        cancelLongPress();

        // Only trigger tap if not dragging
        if (gestureState.current.distance < 10) {
          handleTap()
        }
      },
    },
    {
      drag: {
        threshold: 10,
        preventScroll: preventScroll,
      },
      pinch: {
        enabled: pinchEnabled,
      },
    }
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [clearTimers]);

  return {
    bind,
    gestureState: gestureState.current,
    clearTimers,
  }
}

// Hook for pull-to-refresh functionality
export function usePullToRefresh(onRefresh: () => void | Promise<void>, enabled = true) {
  const isRefreshing = useRef(false)
  const refreshThreshold = 80;

  const bind = useGesture({
    onDrag: async ({ movement: [, my], velocity: [, vy], direction: [, dy], cancel, active }) => {
      if (!enabled || isRefreshing.current) return;

      // Only trigger on downward pull from top
      if (dy > 0 && my > refreshThreshold && vy > 0.5 && window.scrollY === 0) {
        isRefreshing.current = true

        try {
          await onRefresh();
        } catch (error) {
          // console.error('Pull to refresh failed:', error)
        } finally {
          isRefreshing.current = false;
        }

        cancel();
      }
    },
  });

  return {
    bind,
    isRefreshing: isRefreshing.current,
  }
}

// Hook for swipe navigation
export function useSwipeNavigation(
  onNext?: () => void,
  onPrevious?: () => void,
  options: { threshold?: number; velocity?: number } = {}
) {
  const { threshold = 50, velocity = 0.5 } = options;

  const bind = useGesture({
    onDrag: ({ movement: [mx], velocity: [vx], last }) => {
      if (!last) return;

      const distance = Math.abs(mx);
      const velocityMagnitude = Math.abs(vx);

      if (distance > threshold && velocityMagnitude > velocity) {
        if (mx > 0) {
          onPrevious?.();
        } else {
          onNext?.();
        }
      }
    },
  });

  return bind;
}

// Hook for pinch-to-zoom
export function usePinchZoom(
  onZoom: (scale: number) => void,
  options: { minScale?: number; maxScale?: number } = {}
) {
  const { minScale = 0.5, maxScale = 3 } = options;

  const bind = useGesture({
    onPinch: ({ offset: [scale] }) => {
      const clampedScale = Math.max(minScale, Math.min(maxScale, scale));
      onZoom(clampedScale);
    },
  });

  return bind;
}

// Hook for long press with feedback
export function useLongPress(
  onLongPress: () => void,
  options: { delay?: number; hapticFeedback?: boolean } = {}
) {
  const { delay = 500, hapticFeedback = true } = options;
  const timer = useRef<NodeJS.Timeout | null>(null);
  const isPressed = useRef(false);

  const start = useCallback(() => {
    isPressed.current = true;
    timer.current = setTimeout(() => {
      if (isPressed.current) {
        if (hapticFeedback && 'vibrate' in navigator) {
          navigator.vibrate(50);
        }
        onLongPress();
      }
    }, delay);
  }, [onLongPress, delay, hapticFeedback]);

  const cancel = useCallback(() => {
    isPressed.current = false;
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => {
    return cancel;
  }, [cancel]);

  return {
    onPointerDown: start,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
  }
}

export default useGestures;
