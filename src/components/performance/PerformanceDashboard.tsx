'use client';

import React, { useState, useEffect, useRef } from 'react';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { toast } from 'sonner';
import {
  Activity,
  AlertTriangle,
  Clock,
  Database,
  Globe,
  Monitor,
  RefreshCw,
  Server,
  Wifi,
  Zap,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  
  // Application Performance
  pageLoadTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  
  // Network Performance
  connectionType: string;
  downlink: number;
  rtt: number;
  
  // User Experience
  bounceRate: number;
  sessionDuration: number;
  pageViews: number;
  
  // Error Tracking
  errorRate: number;
  crashRate: number;
  
  timestamp: string;
}

interface PerformanceAlert {
  id: string;
  type: 'WARNING' | 'CRITICAL' | 'INFO';
  metric: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: string;
}

interface ResourceTiming {
  name: string;
  duration: number;
  size: number;
  type: 'script' | 'stylesheet' | 'image' | 'fetch' | 'other';
}

// ============================================================================
// PERFORMANCE MONITORING UTILITIES
// ============================================================================

class PerformanceMonitor {
  private observers: PerformanceObserver[] = [];
  private metrics: Partial<PerformanceMetrics> = {};
  private listeners: ((metrics: PerformanceMetrics) => void)[] = [];

  constructor() {
    this.initializeObservers();
    this.startMonitoring();
  }

  private initializeObservers() {
    // Core Web Vitals Observer
    if ('PerformanceObserver' in window) {
      // LCP Observer
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
        this.notifyListeners();
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // FID Observer
      const fidObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries() as any[]) {
          this.metrics.fid = entry.processingStart - entry.startTime;
          this.notifyListeners();
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // CLS Observer
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.cls = clsValue;
            this.notifyListeners();
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

      // Navigation Timing
      const navObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const navEntry = entry as PerformanceNavigationTiming;
          this.metrics.fcp = navEntry.responseStart - navEntry.fetchStart;
          this.metrics.ttfb = navEntry.responseStart - navEntry.requestStart;
          this.metrics.pageLoadTime = navEntry.loadEventEnd - navEntry.fetchStart;
          this.notifyListeners();
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);
    }
  }

  private startMonitoring() {
    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = (performance as any).memory;
        this.metrics.memoryUsage = (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100;
        this.notifyListeners();
      }, 5000);
    }

    // Monitor network information
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.metrics.connectionType = connection.effectiveType;
      this.metrics.downlink = connection.downlink;
      this.metrics.rtt = connection.rtt;
      
      connection.addEventListener('change', () => {
        this.metrics.connectionType = connection.effectiveType;
        this.metrics.downlink = connection.downlink;
        this.metrics.rtt = connection.rtt;
        this.notifyListeners();
      });
    }

    // Simulate CPU usage monitoring (in real app, this would be more sophisticated)
    setInterval(() => {
      this.metrics.cpuUsage = Math.random() * 30 + 10; // Mock CPU usage
      this.notifyListeners();
    }, 3000);
  }

  private notifyListeners() {
    const completeMetrics: PerformanceMetrics = {
      lcp: this.metrics.lcp || 0,
      fid: this.metrics.fid || 0,
      cls: this.metrics.cls || 0,
      fcp: this.metrics.fcp || 0,
      ttfb: this.metrics.ttfb || 0,
      pageLoadTime: this.metrics.pageLoadTime || 0,
      apiResponseTime: this.metrics.apiResponseTime || 0,
      memoryUsage: this.metrics.memoryUsage || 0,
      cpuUsage: this.metrics.cpuUsage || 0,
      connectionType: this.metrics.connectionType || 'unknown',
      downlink: this.metrics.downlink || 0,
      rtt: this.metrics.rtt || 0,
      bounceRate: this.metrics.bounceRate || 0,
      sessionDuration: this.metrics.sessionDuration || 0,
      pageViews: this.metrics.pageViews || 0,
      errorRate: this.metrics.errorRate || 0,
      crashRate: this.metrics.crashRate || 0,
      timestamp: new Date().toISOString(),
    };

    this.listeners.forEach(listener => listener(completeMetrics));
  }

  public subscribe(listener: (metrics: PerformanceMetrics) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public getResourceTimings(): ResourceTiming[] {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return resources.map(resource => ({
      name: resource.name.split('/').pop() || resource.name,
      duration: resource.duration,
      size: resource.transferSize || 0,
      type: this.getResourceType(resource.name),
    }));
  }

  private getResourceType(url: string): ResourceTiming['type'] {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.svg')) return 'image';
    if (url.includes('/api/')) return 'fetch';
    return 'other';
  }

  public destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.listeners = [];
  }
}

// ============================================================================
// PERFORMANCE DASHBOARD COMPONENT
// ============================================================================

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [historicalData, setHistoricalData] = useState<PerformanceMetrics[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [resourceTimings, setResourceTimings] = useState<ResourceTiming[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const monitorRef = useRef<PerformanceMonitor | null>(null);

  // Performance thresholds
  const thresholds = {
    lcp: 2500, // 2.5s
    fid: 100, // 100ms
    cls: 0.1, // 0.1
    fcp: 1800, // 1.8s
    ttfb: 600, // 600ms
    pageLoadTime: 3000, // 3s
    memoryUsage: 80, // 80%
    cpuUsage: 70, // 70%
    errorRate: 5, // 5%
  };

  // Start performance monitoring
  const startMonitoring = () => {
    if (!monitorRef.current) {
      monitorRef.current = new PerformanceMonitor();
      
      const unsubscribe = monitorRef.current.subscribe((newMetrics) => {
        setMetrics(newMetrics);
        setHistoricalData(prev => [...prev.slice(-29), newMetrics]); // Keep last 30 entries
        
        // Check for alerts
        checkForAlerts(newMetrics);
      });

      // Get initial resource timings
      setResourceTimings(monitorRef.current.getResourceTimings());
      
      setIsMonitoring(true);
      toast.success('Performance monitoring started');
      
      return unsubscribe;
    }
  };

  // Stop performance monitoring
  const stopMonitoring = () => {
    if (monitorRef.current) {
      monitorRef.current.destroy();
      monitorRef.current = null;
      setIsMonitoring(false);
              toast('Performance monitoring stopped');
    }
  };

  // Check for performance alerts
  const checkForAlerts = (currentMetrics: PerformanceMetrics) => {
    const newAlerts: PerformanceAlert[] = [];

    // Check each threshold
    Object.entries(thresholds).forEach(([metric, threshold]) => {
      const value = currentMetrics[metric as keyof PerformanceMetrics] as number;
      if (value > threshold) {
        newAlerts.push({
          id: `${metric}-${Date.now()}`,
          type: value > threshold * 1.5 ? 'CRITICAL' : 'WARNING',
          metric,
          message: `${metric.toUpperCase()} is ${value > threshold * 1.5 ? 'critically' : 'moderately'} high`,
          value,
          threshold,
          timestamp: new Date().toISOString(),
        });
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev.slice(0, 9)]); // Keep last 10 alerts
    }
  };

  // Clear alerts
  const clearAlerts = () => {
    setAlerts([]);
    toast.success('Alerts cleared');
  };

  // Get performance score
  const getPerformanceScore = (metrics: PerformanceMetrics): number => {
    if (!metrics) return 0;
    
    const scores = {
      lcp: Math.max(0, 100 - (metrics.lcp / 4000) * 100),
      fid: Math.max(0, 100 - (metrics.fid / 300) * 100),
      cls: Math.max(0, 100 - (metrics.cls / 0.25) * 100),
      fcp: Math.max(0, 100 - (metrics.fcp / 3000) * 100),
      ttfb: Math.max(0, 100 - (metrics.ttfb / 1500) * 100),
    };
    
    return Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length);
  };

  // Format metric values
  const formatMetric = (_value: number, unit: string): string => {
    if (unit === 'ms') {
      return `${Math.round(value)}ms`;
    }
    if (unit === '%') {
      return `${Math.round(value)}%`;
    }
    if (unit === 'score') {
      return value.toFixed(3);
    }
    return value.toString();
  };

  useEffect(() => {
    const unsubscribe = startMonitoring();
    
    return () => {
      if (unsubscribe) unsubscribe();
      stopMonitoring();
    };
  }, []);

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Monitor className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <p>Initializing performance monitoring...</p>
        </div>
      </div>
    );
  }

  const performanceScore = getPerformanceScore(metrics);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Real-time application performance monitoring and optimization insights
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <DaisyButton
            variant="outline"
            size="sm"
            onClick={isMonitoring ? stopMonitoring : startMonitoring}>
          {isMonitoring ? (

        </DaisyButton>
              <>
                <Activity className="h-4 w-4 mr-2 text-green-500" />
                Monitoring
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Start Monitoring
              </>
            )}
          </DaisyButton>
        </div>
      </div>

      {/* Performance Score */}
      <DaisyCard >
  <DaisyCardBody >
</DaisyCard>
          <DaisyCardTitle className="flex items-center gap-2" >
  <Zap className="h-5 w-5" />
</DaisyCardTitle>
            Overall Performance Score
          </DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="flex items-center gap-4">
</DaisyCardBody>
            <div className="text-4xl font-bold text-blue-600">
              {performanceScore}
            </div>
            <div className="flex-1">
              <DaisyProgress value={performanceScore} className="h-2" />
<p className="text-sm text-gray-600 mt-1">
                {performanceScore >= 90 ? 'Excellent' : 
                 performanceScore >= 70 ? 'Good' : 
                 performanceScore >= 50 ? 'Needs Improvement' : 'Poor'}
              </p>
            </div>
          </div>
        </DaisyProgress>
      </DaisyCard>

      {/* Alerts */}
      {alerts.length > 0 && (
        <DaisyCard >
  <DaisyCardBody className="flex flex-row items-center justify-between" >
</DaisyCard>
            <DaisyCardTitle className="flex items-center gap-2" >
  <DaisyAlertTriangle className="h-5 w-5 text-yellow-500" >
  </DaisyCardTitle>
</DaisyAlert>
              Performance Alerts ({alerts.length})
            </DaisyCardTitle>
            <DaisyButton variant="outline" size="sm" onClick={clearAlerts}>
          Clear All

        </DaisyButton>
            </DaisyButton>
          
          <DaisyCardBody >
  <div className="space-y-2">
</DaisyCardBody>
              {alerts.slice(0, 3).map((alert) => (
                <DaisyAlert key={alert.id} variant={alert.type === 'CRITICAL' ? 'destructive' : 'default'} >
  <DaisyAlertTriangle className="h-4 w-4" />
</DaisyAlert>
                  <DaisyAlertTitle>{alert.metric.toUpperCase()}</DaisyAlertTitle>
                  <DaisyAlertDescription >
  {alert.message} - Current: {formatMetric(alert.value, 'ms')}, 
                </DaisyAlertDescription>
</DaisyAlert>
                    Threshold: {formatMetric(alert.threshold, 'ms')}
                </DaisyAlertDescription>
              </DaisyAlert>
              ))}
            </div>
          </DaisyCardBody>
        </DaisyCard>
      )}

      {/* Main Metrics */}
      <DaisyTabs defaultValue="vitals" className="space-y-4" >
          <DaisyTabsList className="grid w-full grid-cols-4" >
            <DaisyTabsTrigger value="vitals">Core Web Vitals</DaisyTabs>
          <DaisyTabsTrigger value="performance">Performance</DaisyTabsTrigger>
          <DaisyTabsTrigger value="resources">Resources</DaisyTabsTrigger>
          <DaisyTabsTrigger value="trends">Trends</DaisyTabsTrigger>
        </DaisyTabsList>

        <DaisyTabsContent value="vitals" className="space-y-4" >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* LCP */}
            <DaisyCard >
  <DaisyCardBody className="pb-2" >
</DaisyTabsContent>
                <DaisyCardTitle className="text-sm font-medium">Largest Contentful Paint</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="text-2xl font-bold">
</DaisyCardBody>
                  {formatMetric(metrics.lcp, 'ms')}
                </div>
                <DaisyBadge variant={metrics.lcp <= 2500 ? 'default' : metrics.lcp <= 4000 ? 'secondary' : 'destructive'} >
  {metrics.lcp 
</DaisyBadge><= 2500 ? 'Good' : metrics.lcp <= 4000 ? 'Needs Improvement' : 'Poor'}
                </DaisyBadge>
              </DaisyCardBody>
            </DaisyCard>

            {/* FID */}
            <DaisyCard >
  <DaisyCardBody className="pb-2" >
</DaisyCard>
                <DaisyCardTitle className="text-sm font-medium">First Input Delay</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="text-2xl font-bold">
</DaisyCardBody>
                  {formatMetric(metrics.fid, 'ms')}
                </div>
                <DaisyBadge variant={metrics.fid <= 100 ? 'default' : metrics.fid <= 300 ? 'secondary' : 'destructive'} >
  {metrics.fid 
</DaisyBadge><= 100 ? 'Good' : metrics.fid <= 300 ? 'Needs Improvement' : 'Poor'}
                </DaisyBadge>
              </DaisyCardBody>
            </DaisyCard>

            {/* CLS */}
            <DaisyCard >
  <DaisyCardBody className="pb-2" >
</DaisyCard>
                <DaisyCardTitle className="text-sm font-medium">Cumulative Layout Shift</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="text-2xl font-bold">
</DaisyCardBody>
                  {formatMetric(metrics.cls, 'score')}
                </div>
                <DaisyBadge variant={metrics.cls <= 0.1 ? 'default' : metrics.cls <= 0.25 ? 'secondary' : 'destructive'} >
  {metrics.cls 
</DaisyBadge><= 0.1 ? 'Good' : metrics.cls <= 0.25 ? 'Needs Improvement' : 'Poor'}
                </DaisyBadge>
              </DaisyCardBody>
            </DaisyCard>
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="performance" className="space-y-4" >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DaisyCard >
  <DaisyCardBody className="flex flex-row items-center justify-between space-y-0 pb-2" >
</DaisyTabsContent>
                <DaisyCardTitle className="text-sm font-medium">Page Load Time</DaisyCardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              
              <DaisyCardBody >
  <div className="text-2xl font-bold">
</DaisyCardBody>{formatMetric(metrics.pageLoadTime, 'ms')}</div>
              </DaisyCardBody>
            </DaisyCard>

            <DaisyCard >
  <DaisyCardBody className="flex flex-row items-center justify-between space-y-0 pb-2" >
</DaisyCard>
                <DaisyCardTitle className="text-sm font-medium">Memory Usage</DaisyCardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              
              <DaisyCardBody >
  <div className="text-2xl font-bold">
</DaisyCardBody>{formatMetric(metrics.memoryUsage, '%')}</div>
                <DaisyProgress value={metrics.memoryUsage} className="mt-2" / / /> </DaisyCard>

            <DaisyCard >
  <DaisyCardBody className="flex flex-row items-center justify-between space-y-0 pb-2" >
</DaisyCard>
                <DaisyCardTitle className="text-sm font-medium">CPU Usage</DaisyCardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              
              <DaisyCardBody >
  <div className="text-2xl font-bold">
</DaisyCardBody>{formatMetric(metrics.cpuUsage, '%')}</div>
                <DaisyProgress value={metrics.cpuUsage} className="mt-2" / / /> </DaisyCard>

            <DaisyCard >
  <DaisyCardBody className="flex flex-row items-center justify-between space-y-0 pb-2" >
</DaisyCard>
                <DaisyCardTitle className="text-sm font-medium">Connection</DaisyCardTitle>
                <Wifi className="h-4 w-4 text-muted-foreground" />
              
              <DaisyCardBody >
  <div className="text-lg font-bold">
</DaisyCardBody>{metrics.connectionType}</div>
                <div className="text-sm text-gray-600">
                  {metrics.downlink}Mbps, {metrics.rtt}ms RTT
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="resources" className="space-y-4" >
            <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
              <DaisyCardTitle>Resource Loading Performance</DaisyCardTitle>
              <DaisyCardDescription >
  Loading times for different resource types
</DaisyCardDescription>
              </p>
            
            <DaisyCardBody >
  <ResponsiveContainer width="100%" height={300}>
</DaisyCardBody>
                <BarChart data={resourceTimings.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <DaisyTooltip>
                    <Bar dataKey="duration" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </DaisyTooltip>
          </DaisyCard>
        </DaisyTabsContent>

        <DaisyTabsContent value="trends" className="space-y-4" >
            <DaisyCard >
  <DaisyCardBody >
</DaisyTabsContent>
              <DaisyCardTitle>Performance Trends</DaisyCardTitle>
              <DaisyCardDescription >
  Historical performance metrics over time
</DaisyCardDescription>
              </p>
            
            <DaisyCardBody >
  <ResponsiveContainer width="100%" height={300}>
</DaisyCardBody>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
                  <YAxis />
                  <DaisyTooltip labelFormatter={(value) => new Date(value).toLocaleString()} />
                  <Legend />
                  <Line type="monotone" dataKey="lcp" stroke="#8884d8" name="LCP (ms)" />
                  <Line type="monotone" dataKey="fid" stroke="#82ca9d" name="FID (ms)" />
                  <Line type="monotone" dataKey="pageLoadTime" stroke="#ffc658" name="Page Load (ms)" />
                </LineChart>
              </ResponsiveContainer>
            </DaisyTooltip>
          </DaisyCard>
        </DaisyTabsContent>
      </DaisyTabs>
    </div>
  );
};

export default PerformanceDashboard; 