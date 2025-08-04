'use client';

import React, { lazy, Suspense, memo, useMemo, ComponentType, ReactNode } from 'react';

// ============================================================================
// LAZY LOADING UTILITIES
// ============================================================================

/**
 * Create a lazy-loaded component with fallback
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFunc)

  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <div className="animate-pulse bg-gray-200 h-32 rounded" />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  }
}

/**
 * Preload a lazy component
 */
export function preloadComponent(importFunc: () => Promise<any>) {
  const componentImport = importFunc();
  return componentImport;
}

/**
 * Enhanced memo with deep comparison for complex props
 */
export function createMemoComponent<T extends ComponentType<any>>(
  Component: T,
  propsAreEqual?: (
    prevProps: Readonly<React.ComponentProps<T>>,
    nextProps: Readonly<React.ComponentProps<T>>
  ) => boolean
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
      // console.warn(`Timer '${label}' was not started`)
      return 0;
    }

    const _duration = performance.now() - startTime;
    this.timers.delete(label);

    if (duration > 100) {
      // console.warn(`Slow operation detected: ${label} took ${duration.toFixed(2)}ms`)
    }

    return duration;
  }

  async measureAsync<T>(
    label: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    this.start(label);
    const _result = await fn();
    const _duration = this.end(label);
    return { result, duration }
  }
}

export const performanceTimer = new PerformanceTimer();
