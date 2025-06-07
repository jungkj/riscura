'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializePerformance, getPerformanceMetrics, isPerformanceInitialized } from '@/lib/performance/init';

interface PerformanceContextType {
  isInitialized: boolean;
  metrics: any;
  refreshMetrics: () => void;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [metrics, setMetrics] = useState({});

  const refreshMetrics = () => {
    setMetrics(getPerformanceMetrics());
  };

  useEffect(() => {
    const init = async () => {
      try {
        await initializePerformance();
        setIsInitialized(isPerformanceInitialized());
        refreshMetrics();
      } catch (error) {
        console.error('Failed to initialize performance optimizations:', error);
      }
    };

    init();

    // Refresh metrics every minute
    const interval = setInterval(refreshMetrics, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <PerformanceContext.Provider value={{ isInitialized, metrics, refreshMetrics }}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
} 