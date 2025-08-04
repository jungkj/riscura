'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
// import { initializePerformance, getPerformanceMetrics, isPerformanceInitialized } from '@/lib/performance/init';

interface PerformanceContextType {
  isInitialized: boolean;
  metrics: any;
  refreshMetrics: () => void;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export const PerformanceProvider = ({ children }: { children: React.ReactNode }) => {
  const [isInitialized, setIsInitialized] = useState(true); // Set to true to avoid initialization
  const [metrics, setMetrics] = useState({});

  const refreshMetrics = () => {
    // Disabled to prevent console errors
    // setMetrics(getPerformanceMetrics());
    console.log('Performance metrics refresh disabled for clean development');
  };

  useEffect(() => {
    const init = async () => {
      try {
        // Performance monitoring disabled to prevent console errors
        console.log('Performance monitoring disabled for clean development experience');
        setIsInitialized(true);
        // await initializePerformance();
        // setIsInitialized(isPerformanceInitialized());
        // refreshMetrics();
      } catch (error) {
        console.error('Failed to initialize performance optimizations:', error);
      }
    };

    init();

    // Disabled metrics refresh to prevent console errors
    // const interval = setInterval(refreshMetrics, 60000);
    // return () => clearInterval(interval);
  }, []);

  return (
    <PerformanceContext.Provider value={{ isInitialized, metrics, refreshMetrics }}>
      {children}
    </PerformanceContext.Provider>
  );
};

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}
