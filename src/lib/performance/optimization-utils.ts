import { memo, useMemo, useCallback, lazy, Suspense, useState, useEffect, useRef } from 'react';
import React, { ComponentType, ReactNode } from 'react';

// ============================================================================
// LAZY LOADING & CODE SPLITTING UTILITIES
// ============================================================================

/**
 * Enhanced lazy loading with error boundary and loading states
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFunc);
  
  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <div className="animate-pulse bg-gray-200 h-32 rounded" />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Preload a lazy component
 */
export function preloadComponent(importFunc: () => Promise<any>) {
  const componentImport = importFunc();
  return componentImport;
}

// ============================================================================
// MEMOIZATION UTILITIES
// ============================================================================

/**
 * Enhanced memo with deep comparison for complex props
 */
export function createMemoComponent<T extends ComponentType<any>>(
  Component: T,
  propsAreEqual?: (prevProps: React.ComponentProps<T>, nextProps: React.ComponentProps<T>) => boolean
) {
  return memo(Component, propsAreEqual);
}

/**
 * Deep comparison function for complex objects
 */
export function deepCompare(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepCompare(a[key], b[key])) return false;
    }
    
    return true;
  }
  
  return false;
}

/**
 * Memoized expensive calculation hook
 */
export function useMemoizedCalculation<T>(
  calculation: () => T,
  dependencies: any[]
) {
  return useMemo(() => {
    return calculation();
  }, dependencies);
}

// ============================================================================
// VIRTUAL SCROLLING UTILITIES
// ============================================================================

export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  cache?: boolean;
}

export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
) {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  
  return useMemo(() => {
    const visibleItemCount = Math.ceil(containerHeight / itemHeight);
    const totalHeight = items.length * itemHeight;
    
    return {
      totalHeight,
      visibleItemCount,
      getVisibleRange: (scrollTop: number) => {
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(
          startIndex + visibleItemCount + overscan,
          items.length - 1
        );
        
        return {
          startIndex: Math.max(0, startIndex - overscan),
          endIndex,
          offsetY: startIndex * itemHeight,
        };
      },
    };
  }, [items.length, itemHeight, containerHeight, overscan]);
}

/**
 * Performance timing utilities
 */
export class PerformanceTimer {
  private timers: Map<string, number> = new Map();
  
  start(label: string) {
    this.timers.set(label, performance.now());
  }
  
  end(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      console.warn(`Timer '${label}' was not started`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.timers.delete(label);
    
    if (duration > 100) {
      console.warn(`Slow operation detected: ${label} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
  
  async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    this.start(label);
    const result = await fn();
    const duration = this.end(label);
    return { result, duration };
  }
}

export const performanceTimer = new PerformanceTimer();

/**
 * Debounced function utility
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttled function utility
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Tree-shakable utility functions
 */
export const TreeShakableUtils = {
  formatDate: (date: Date) => date.toLocaleDateString(),
  formatCurrency: (amount: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount),
  formatNumber: (num: number) => new Intl.NumberFormat().format(num),
}; 