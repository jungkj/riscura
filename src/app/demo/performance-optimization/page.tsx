// Performance Optimization Demo Page
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Activity, 
  Database, 
  Zap, 
  BarChart3, 
  Image as ImageIcon,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Settings,
} from 'lucide-react';

// Import optimized components
import VirtualizedTable from '@/components/optimized/VirtualizedTable';
import LazyDashboard from '@/components/optimized/LazyDashboard';
import OptimizedChart from '@/components/optimized/OptimizedCharts';
import ImageOptimizer from '@/components/optimized/ImageOptimizer';

// Import performance utilities
import { performanceMonitor } from '@/lib/performance/monitoring';
// import { queryCache } from '@/lib/cache/query-cache';
import { apiCache } from '@/lib/cache/api-cache';
import { redisClient } from '@/lib/cache/redis-client';

interface PerformanceMetrics {
  bundleSize: number;
  loadTime: number;
  fcp: number;
  lcp: number;
  cls: number;
  fid: number;
  ttfb: number;
  cacheHitRatio: number;
  apiResponseTime: number;
  memoryUsage: number;
}

interface DemoDataItem {
  id: string;
  name: string;
  category: string;
  value: number;
  status: 'active' | 'inactive' | 'pending';
  lastUpdated: Date;
  riskScore: number;
  complianceStatus: 'compliant' | 'non-compliant' | 'partial';
}

// Generate large dataset for virtualization demo
const generateLargeDataset = (size: number): DemoDataItem[] => {
  const categories = ['Security', 'Compliance', 'Operations', 'Finance', 'HR'];
  const statuses: Array<'active' | 'inactive' | 'pending'> = ['active', 'inactive', 'pending'];
  const complianceStatuses: Array<'compliant' | 'non-compliant' | 'partial'> = ['compliant', 'non-compliant', 'partial'];

  return Array.from({ length: size }, (_, index) => ({
    id: `item-${index + 1}`,
    name: `Demo Item ${index + 1}`,
    category: categories[index % categories.length],
    value: Math.floor(Math.random() * 1000) + 1,
    status: statuses[index % statuses.length],
    lastUpdated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    riskScore: Math.floor(Math.random() * 100),
    complianceStatus: complianceStatuses[index % complianceStatuses.length],
  }));
};

// Generate chart data
const generateChartData = (points: number) => {
  return Array.from({ length: points }, (_, index) => ({
    timestamp: new Date(Date.now() - (points - index) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: Math.floor(Math.random() * 100) + 50,
    risk: Math.floor(Math.random() * 50) + 25,
    compliance: Math.floor(Math.random() * 30) + 70,
    category: `Category ${(index % 5) + 1}`,
  }));
};

export default function PerformanceOptimizationPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Performance Optimization Demo
        </h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">
            Demo Temporarily Disabled
          </h2>
          <p className="text-yellow-700">
            This demo page is temporarily disabled while we fix build issues. 
            It will be re-enabled once all dependencies are properly configured.
          </p>
        </div>
      </div>
    </div>
  );
} 