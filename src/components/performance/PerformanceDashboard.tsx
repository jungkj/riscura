'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Database, 
  Memory, 
  Zap, 
  Wifi, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings
} from 'lucide-react';

interface PerformanceMetrics {
  database: {
    connectionPoolUtilization: number;
    averageQueryTime: number;
    cacheHitRate: number;
    activeConnections: number;
    slowQueries: number;
  };
  memory: {
    usedJSHeapSize: number;
    memoryUsagePercent: number;
    resourceCount: {
      eventListeners: number;
      intervals: number;
      timeouts: number;
      webSockets: number;
      fileHandles: number;
    };
  };
  webVitals: {
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
    ttfb: number;
  };
  tasks: {
    totalTasks: number;
    queueLength: number;
    workerUtilization: number;
    throughput: number;
  };
  webSockets: {
    activeConnections: number;
    averageLatency: number;
    errorRate: number;
    bandwidthUsage: number;
  };
  fileUploads: {
    activeUploads: number;
    averageUploadSpeed: number;
    failureRate: number;
  };
  system: {
    overallScore: number;
    alertsActive: number;
    optimizationsApplied: number;
    lastOptimization: Date;
  };
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  category: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  resolved: boolean;
}

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Mock data for demonstration
  const mockMetrics: PerformanceMetrics = {
    database: {
      connectionPoolUtilization: 65,
      averageQueryTime: 150,
      cacheHitRate: 85,
      activeConnections: 32,
      slowQueries: 2
    },
    memory: {
      usedJSHeapSize: 45678912,
      memoryUsagePercent: 68,
      resourceCount: {
        eventListeners: 156,
        intervals: 12,
        timeouts: 8,
        webSockets: 5,
        fileHandles: 23
      }
    },
    webVitals: {
      lcp: 1800,
      fid: 45,
      cls: 0.05,
      fcp: 1200,
      ttfb: 250
    },
    tasks: {
      totalTasks: 1245,
      queueLength: 8,
      workerUtilization: 75,
      throughput: 12.5
    },
    webSockets: {
      activeConnections: 23,
      averageLatency: 25,
      errorRate: 0.01,
      bandwidthUsage: 1024768
    },
    fileUploads: {
      activeUploads: 3,
      averageUploadSpeed: 2.5,
      failureRate: 0.02
    },
    system: {
      overallScore: 92,
      alertsActive: 1,
      optimizationsApplied: 15,
      lastOptimization: new Date(Date.now() - 300000)
    }
  };

  const mockAlerts: PerformanceAlert[] = [
    {
      id: 'alert-1',
      type: 'warning',
      category: 'database',
      message: 'Connection pool utilization approaching limit',
      value: 75,
      threshold: 80,
      timestamp: new Date(Date.now() - 120000),
      resolved: false
    }
  ];

  useEffect(() => {
    // Simulate loading performance data
    const loadData = async () => {
      setIsLoading(true);
      // In real implementation, this would fetch from masterPerformanceSystem
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMetrics(mockMetrics);
      setAlerts(mockAlerts);
      setLastUpdated(new Date());
      setIsLoading(false);
    };

    loadData();

    // Auto-refresh every 30 seconds
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadData, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const refreshData = () => {
    setMetrics(mockMetrics);
    setAlerts(mockAlerts);
    setLastUpdated(new Date());
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 75) return 'secondary';
    if (score >= 60) return 'outline';
    return 'destructive';
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading performance metrics...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <p>Failed to load performance metrics</p>
        <Button onClick={refreshData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time system performance monitoring and optimization
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button onClick={refreshData} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(metrics.system.overallScore)}`}>
                  {metrics.system.overallScore}
                </p>
              </div>
              <Badge variant={getScoreBadgeVariant(metrics.system.overallScore)}>
                {metrics.system.overallScore >= 90 ? 'Excellent' :
                 metrics.system.overallScore >= 75 ? 'Good' :
                 metrics.system.overallScore >= 60 ? 'Warning' : 'Critical'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold">{metrics.system.alertsActive}</p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${metrics.system.alertsActive > 0 ? 'text-yellow-500' : 'text-gray-300'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Optimizations</p>
                <p className="text-2xl font-bold">{metrics.system.optimizationsApplied}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Optimization</p>
                <p className="text-sm font-bold">
                  {Math.floor((Date.now() - metrics.system.lastOptimization.getTime()) / 60000)}m ago
                </p>
              </div>
              <Settings className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={alert.type === 'critical' ? 'destructive' : 
                                  alert.type === 'error' ? 'destructive' : 'secondary'}>
                      {alert.type}
                    </Badge>
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-muted-foreground">
                        {alert.category} • {alert.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Metrics */}
      <Tabs defaultValue="database" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="webvitals">Web Vitals</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="websockets">WebSockets</TabsTrigger>
          <TabsTrigger value="uploads">File Uploads</TabsTrigger>
        </TabsList>

        <TabsContent value="database">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connection Pool Utilization</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.database.connectionPoolUtilization}%</div>
                <Progress value={metrics.database.connectionPoolUtilization} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics.database.activeConnections} active connections
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Query Time</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.database.averageQueryTime}ms</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics.database.slowQueries} slow queries detected
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.database.cacheHitRate}%</div>
                <Progress value={metrics.database.cacheHitRate} className="mt-2" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="memory">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <Memory className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.memory.memoryUsagePercent}%</div>
                <Progress value={metrics.memory.memoryUsagePercent} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {formatBytes(metrics.memory.usedJSHeapSize)} used
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Event Listeners</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.memory.resourceCount.eventListeners}</div>
                <p className="text-xs text-muted-foreground mt-2">Active event listeners</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Timers & Intervals</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.memory.resourceCount.intervals + metrics.memory.resourceCount.timeouts}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics.memory.resourceCount.intervals} intervals, {metrics.memory.resourceCount.timeouts} timeouts
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="webvitals">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Largest Contentful Paint</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${metrics.webVitals.lcp <= 2500 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatTime(metrics.webVitals.lcp)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Target: ≤2.5s {metrics.webVitals.lcp <= 2500 ? '✓' : '✗'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">First Input Delay</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${metrics.webVitals.fid <= 100 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatTime(metrics.webVitals.fid)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Target: ≤100ms {metrics.webVitals.fid <= 100 ? '✓' : '✗'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cumulative Layout Shift</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${metrics.webVitals.cls <= 0.1 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.webVitals.cls.toFixed(3)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Target: ≤0.1 {metrics.webVitals.cls <= 0.1 ? '✓' : '✗'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Queue Length</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.tasks.queueLength}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics.tasks.totalTasks} total tasks processed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Worker Utilization</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.tasks.workerUtilization}%</div>
                <Progress value={metrics.tasks.workerUtilization} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Throughput</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.tasks.throughput}/s</div>
                <p className="text-xs text-muted-foreground mt-2">Tasks per second</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="websockets">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                <Wifi className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.webSockets.activeConnections}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatBytes(metrics.webSockets.bandwidthUsage)} bandwidth used
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Latency</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.webSockets.averageLatency}ms</div>
                <p className="text-xs text-muted-foreground mt-2">Round-trip time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${metrics.webSockets.errorRate < 0.05 ? 'text-green-600' : 'text-red-600'}`}>
                  {(metrics.webSockets.errorRate * 100).toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground mt-2">Connection error rate</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="uploads">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Uploads</CardTitle>
                <Upload className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.fileUploads.activeUploads}</div>
                <p className="text-xs text-muted-foreground mt-2">Currently uploading</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Speed</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.fileUploads.averageUploadSpeed} MB/s</div>
                <p className="text-xs text-muted-foreground mt-2">Upload speed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failure Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${metrics.fileUploads.failureRate < 0.05 ? 'text-green-600' : 'text-red-600'}`}>
                  {(metrics.fileUploads.failureRate * 100).toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground mt-2">Upload failure rate</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 