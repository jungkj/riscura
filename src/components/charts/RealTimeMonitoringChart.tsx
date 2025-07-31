'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisySwitch } from '@/components/ui/DaisySwitch';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Brush
} from 'recharts';
import {
  Activity,
  Wifi,
  WifiOff,
  Play,
  Pause,
  RotateCcw,
  Download,
  Settings,
  Maximize2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface MonitoringDataPoint {
  timestamp: number;
  time: string;
  riskScore: number;
  activeIncidents: number;
  controlFailures: number;
  systemLoad: number;
  responseTime: number;
  complianceScore: number;
  threatLevel: number;
  userActivity: number;
  networkTraffic: number;
  errorRate: number;
}

interface AlertThreshold {
  metric: keyof MonitoringDataPoint;
  threshold: number;
  condition: 'above' | 'below';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

interface RealTimeMonitoringChartProps {
  height?: number;
  updateInterval?: number; // milliseconds
  maxDataPoints?: number;
  showAlerts?: boolean;
  className?: string;
  onAlert?: (alert: { metric: string; value: number; threshold: number; severity: string }) => void;
  onExport?: (data: any) => void;
}

// Default alert thresholds
const defaultThresholds: AlertThreshold[] = [
  { metric: 'riskScore', threshold: 8.5, condition: 'above', severity: 'high', enabled: true },
  { metric: 'activeIncidents', threshold: 5, condition: 'above', severity: 'medium', enabled: true },
  { metric: 'controlFailures', threshold: 3, condition: 'above', severity: 'high', enabled: true },
  { metric: 'systemLoad', threshold: 80, condition: 'above', severity: 'medium', enabled: true },
  { metric: 'responseTime', threshold: 2000, condition: 'above', severity: 'low', enabled: true },
  { metric: 'complianceScore', threshold: 75, condition: 'below', severity: 'high', enabled: true },
  { metric: 'threatLevel', threshold: 7, condition: 'above', severity: 'critical', enabled: true },
  { metric: 'errorRate', threshold: 5, condition: 'above', severity: 'medium', enabled: true }
];

// Simulate real-time data generation
const generateDataPoint = (previousData?: MonitoringDataPoint): MonitoringDataPoint => {
  const now = Date.now();
  const baseValues = {
    riskScore: 6.5,
    activeIncidents: 2,
    controlFailures: 1,
    systemLoad: 45,
    responseTime: 800,
    complianceScore: 85,
    threatLevel: 3,
    userActivity: 150,
    networkTraffic: 75,
    errorRate: 2
  };
  
  // Add some variance and trends
  const variance = (base: number, range: number) => {
    const change = (Math.random() - 0.5) * range;
    const previous = previousData ? (previousData as any)[Object.keys(baseValues).find(k => (baseValues as any)[k] === base) || ''] || base : base;
    return Math.max(0, previous + change);
  };
  
  return {
    timestamp: now,
    time: format(new Date(now), 'HH:mm:ss'),
    riskScore: Math.round(variance(baseValues.riskScore, 1) * 10) / 10,
    activeIncidents: Math.floor(variance(baseValues.activeIncidents, 2)),
    controlFailures: Math.floor(variance(baseValues.controlFailures, 1.5)),
    systemLoad: Math.round(variance(baseValues.systemLoad, 15)),
    responseTime: Math.round(variance(baseValues.responseTime, 300)),
    complianceScore: Math.round(variance(baseValues.complianceScore, 5)),
    threatLevel: Math.round(variance(baseValues.threatLevel, 2)),
    userActivity: Math.round(variance(baseValues.userActivity, 30)),
    networkTraffic: Math.round(variance(baseValues.networkTraffic, 20)),
    errorRate: Math.round(variance(baseValues.errorRate, 1.5) * 10) / 10
  };
};

export default function RealTimeMonitoringChart({
  height = 400,
  updateInterval = 5000, // 5 seconds
  maxDataPoints = 50,
  showAlerts = true,
  className = '',
  onAlert,
  onExport
}: RealTimeMonitoringChartProps) {
  const { toast } = useToast();
  
  // State management
  const [data, setData] = useState<MonitoringDataPoint[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<(keyof MonitoringDataPoint)[]>([
    'riskScore', 'activeIncidents', 'systemLoad', 'complianceScore'
  ]);
  const [thresholds, setThresholds] = useState<DaisyAlertThreshold[]>(defaultThresholds);
  const [alerts, setAlerts] = useState<Array<{ id: string; metric: string; value: number; threshold: number; severity: string; timestamp: number }>>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('monitoring');
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<MonitoringDataPoint | undefined>();
  
  // Metric configurations
  const metricConfigs = {
    riskScore: { label: 'Risk Score', color: '#ef4444', unit: '', format: (v: any) => typeof v === 'number' ? v.toFixed(1) : v.toString() },
    activeIncidents: { label: 'Active Incidents', color: '#f97316', unit: '', format: (v: any) => v.toString() },
    controlFailures: { label: 'Control Failures', color: '#dc2626', unit: '', format: (v: any) => v.toString() },
    systemLoad: { label: 'System Load', color: '#3b82f6', unit: '%', format: (v: any) => `${v}%` },
    responseTime: { label: 'Response Time', color: '#8b5cf6', unit: 'ms', format: (v: any) => `${v}ms` },
    complianceScore: { label: 'Compliance Score', color: '#22c55e', unit: '%', format: (v: any) => `${v}%` },
    threatLevel: { label: 'Threat Level', color: '#f59e0b', unit: '', format: (v: any) => v.toString() },
    userActivity: { label: 'User Activity', color: '#06b6d4', unit: '', format: (v: any) => v.toString() },
    networkTraffic: { label: 'Network Traffic', color: '#84cc16', unit: 'MB/s', format: (v: any) => `${v}MB/s` },
    errorRate: { label: 'Error Rate', color: '#ec4899', unit: '%', format: (v: any) => `${v}%` },
    timestamp: { label: 'Timestamp', color: '#6b7280', unit: '', format: (v: any) => v.toString() },
    time: { label: 'Time', color: '#6b7280', unit: '', format: (v: any) => v.toString() }
  };
  
  // Start monitoring
  const startMonitoring = () => {
    if (intervalRef.current) return;
    
    setIsConnected(true);
    setIsPaused(false);
    
    // Add initial data point
    const initialData = generateDataPoint();
    setData([initialData]);
    lastDataRef.current = initialData;
    
    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        const newPoint = generateDataPoint(lastDataRef.current);
        lastDataRef.current = newPoint;
        
        setData(prev => {
          const updated = [...prev, newPoint];
          return updated.slice(-maxDataPoints);
        });
        
        // Check thresholds
        checkThresholds(newPoint);
      }
    }, updateInterval);
  };
  
  // Stop monitoring
  const stopMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsConnected(false);
    setIsPaused(false);
  };
  
  // Pause/resume monitoring
  const togglePause = () => {
    setIsPaused(!isPaused);
  };
  
  // Reset data
  const resetData = () => {
    setData([]);
    setAlerts([]);
    lastDataRef.current = undefined;
  };
  
  // Check alert thresholds
  const checkThresholds = (dataPoint: MonitoringDataPoint) => {
    thresholds.forEach(threshold => {
      if (!threshold.enabled) return;
      
      const value = dataPoint[threshold.metric] as number;
      const triggered = threshold.condition === 'above' ? value > threshold.threshold : value < threshold.threshold;
      
      if (triggered) {
        const alertId = `${threshold.metric}-${Date.now()}`;
        const alert = {
          id: alertId,
          metric: threshold.metric as string,
          value,
          threshold: threshold.threshold,
          severity: threshold.severity,
          timestamp: dataPoint.timestamp
        };
        
        setAlerts(prev => [...prev.slice(-9), alert]); // Keep last 10 alerts
        
        onAlert?.(alert);
        
        // Show toast notification
        toast({
          title: `Alert: ${metricConfigs[threshold.metric].label}`,
          description: `Value ${metricConfigs[threshold.metric].format(value)} is ${threshold.condition} threshold ${metricConfigs[threshold.metric].format(threshold.threshold)}`,
          variant: threshold.severity === 'critical' || threshold.severity === 'high' ? 'destructive' : 'default',
        });
      }
    });
  };
  
  // Update threshold
  const updateThreshold = (index: number, updates: Partial<DaisyAlertThreshold>) => {
    setThresholds(prev => prev.map((threshold, i) => 
      i === index ? { ...threshold, ...updates } : threshold
    ));
  };
  
  // Export functionality
  const handleExport = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      dataPoints: data.length,
      timeRange: data.length > 0 ? {
        start: new Date(data[0].timestamp).toISOString(),
        end: new Date(data[data.length - 1].timestamp).toISOString()
      } : null,
      data,
      alerts,
      thresholds,
      metrics: selectedMetrics,
      settings: {
        updateInterval,
        maxDataPoints,
        showAlerts
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monitoring-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    onExport?.(exportData);
    
    toast({
      title: 'Export Complete',
      description: 'Monitoring data has been exported successfully.',
    });
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Calculate current status
  const currentStatus = useMemo(() => {
    if (data.length === 0) return null;
    
    const latest = data[data.length - 1];
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && Date.now() - a.timestamp < 300000); // 5 minutes
    const highAlerts = alerts.filter(a => a.severity === 'high' && Date.now() - a.timestamp < 300000);
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalAlerts.length > 0) status = 'critical';
    else if (highAlerts.length > 0 || latest.riskScore > 8) status = 'warning';
    
    return {
      status,
      latest,
      activeAlerts: criticalAlerts.length + highAlerts.length,
      lastUpdate: latest.time
    };
  }, [data, alerts]);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white p-3 border rounded-lg shadow-lg">
        <div className="font-medium text-sm mb-2">{label}</div>
        <div className="space-y-1 text-xs">
          {payload.map((entry: any, index: number) => {
            const config = metricConfigs[entry.dataKey as keyof typeof metricConfigs];
            return (
              <div key={index} className="flex items-center justify-between">
                <span style={{ color: entry.color }}>{config.label}:</span>
                <span className="font-medium ml-2">
                  {config.format(entry.value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  return (
    <DaisyCard className={`${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <DaisyCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <DaisyCardTitle className="text-lg">Real-Time Monitoring</DaisyCardTitle>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-1">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-600" />
              )}
              <DaisyBadge 
                variant={isConnected ? 'default' : 'secondary'}
                className="text-xs"
              >
                {isConnected ? (isPaused ? 'Paused' : 'Live') : 'Disconnected'}
              </DaisyBadge>
            </div>
            
            {/* Current Status */}
            {currentStatus && (
              <DaisyBadge 
                variant={
                  currentStatus.status === 'healthy' ? 'default' :
                  currentStatus.status === 'warning' ? 'secondary' : 'destructive'
                }
                className="text-xs"
              >
                {currentStatus.status === 'healthy' && <CheckCircle className="w-3 h-3 mr-1" />}
                {currentStatus.status === 'warning' && <DaisyAlertTriangle className="w-3 h-3 mr-1" />}
                {currentStatus.status === 'critical' && <Zap className="w-3 h-3 mr-1" />}
                {currentStatus.status}
              </DaisyBadge>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {/* Control Buttons */}
            {!isConnected ? (
              <DaisyButton
                variant="primary"
                size="sm"
                onClick={startMonitoring}
                className="p-2"
              >
                <Play className="w-4 h-4" />
              </DaisyButton>
            ) : (
              <>
                <DaisyButton
                  variant="ghost"
                  size="sm"
                  onClick={togglePause}
                  className="p-2"
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </DaisyButton>
                
                <DaisyButton
                  variant="ghost"
                  size="sm"
                  onClick={stopMonitoring}
                  className="p-2"
                >
                  <WifiOff className="w-4 h-4" />
                </DaisyButton>
              </>
            )}
            
            <DaisyButton
              variant="ghost"
              size="sm"
              onClick={resetData}
              className="p-2"
            >
              <RotateCcw className="w-4 h-4" />
            </DaisyButton>
            
            <DaisyButton
              variant="ghost"
              size="sm"
              onClick={handleExport}
              className="p-2"
            >
              <Download className="w-4 h-4" />
            </DaisyButton>
            
            <DaisyButton
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2"
            >
              <Maximize2 className="w-4 h-4" />
            </DaisyButton>
          </div>
        </div>
        
        {/* Metrics Selection */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-sm text-gray-600">Metrics:</span>
          {Object.keys(metricConfigs).filter(key => !['timestamp', 'time'].includes(key)).map(metric => (
            <DaisyButton
              key={metric}
              variant={selectedMetrics.includes(metric as keyof MonitoringDataPoint) ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                const metricKey = metric as keyof MonitoringDataPoint;
                setSelectedMetrics(prev => 
                  prev.includes(metricKey) 
                    ? prev.filter(m => m !== metricKey)
                    : [...prev, metricKey]
                );
              }}
              className="text-xs h-7"
            >
              {metricConfigs[metric as keyof typeof metricConfigs].label}
            </DaisyButton>
          ))}
        </div>
      

      <DaisyCardContent>
        <DaisyTabs value={selectedTab} onValueChange={setSelectedTab}>
          <DaisyTabsList className="grid w-full grid-cols-3">
            <DaisyTabsTrigger value="monitoring">Live Data</DaisyTabsTrigger>
            <DaisyTabsTrigger value="alerts">Alerts</DaisyTabsTrigger>
            <DaisyTabsTrigger value="settings">Settings</DaisyTabsTrigger>
          </DaisyTabsList>
          
          <DaisyTabsContent value="monitoring" className="space-y-4">
            {/* Current Values */}
            {currentStatus && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Risk Score</div>
                  <div className="text-lg font-bold text-red-600">
                    {currentStatus.latest.riskScore.toFixed(1)}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Active Incidents</div>
                  <div className="text-lg font-bold text-orange-600">
                    {currentStatus.latest.activeIncidents}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">System Load</div>
                  <div className="text-lg font-bold text-blue-600">
                    {currentStatus.latest.systemLoad}%
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Last Update</div>
                  <div className="text-lg font-bold text-gray-600">
                    {currentStatus.lastUpdate}
                  </div>
                </div>
              </div>
            )}
            
            {/* Live Chart */}
            <ResponsiveContainer width="100%" height={height}>
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <DaisyTooltip content={<CustomTooltip />} />
                <Legend />
                
                {selectedMetrics.map(metric => {
                  if (metric === 'timestamp' || metric === 'time') return null;
                  const config = metricConfigs[metric];
                  return (
                    <Line
                      key={metric}
                      type="monotone"
                      dataKey={metric}
                      stroke={config.color}
                      strokeWidth={2}
                      dot={false}
                      name={config.label}
                    />
                  );
                })}
                
                {/* Alert Thresholds */}
                {selectedMetrics.map(metric => {
                  if (metric === 'timestamp' || metric === 'time') return null;
                  const threshold = thresholds.find(t => t.metric === metric && t.enabled);
                  if (!threshold) return null;
                  
                  return (
                    <ReferenceLine
                      key={`threshold-${metric}`}
                      y={threshold.threshold}
                      stroke={threshold.severity === 'critical' ? '#ef4444' : '#f97316'}
                      strokeDasharray="5 5"
                      strokeWidth={1}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </DaisyTabsContent>
          
          <DaisyTabsContent value="alerts" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Recent Alerts</h4>
              <DaisyBadge variant="secondary" className="text-xs">
                {alerts.length} total
              </DaisyBadge>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>No alerts detected</p>
                </div>
              ) : (
                alerts.slice().reverse().map(alert => (
                  <div key={alert.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <DaisyBadge 
                          variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {alert.severity}
                        </DaisyBadge>
                        <span className="font-medium text-sm">
                          {metricConfigs[alert.metric as keyof typeof metricConfigs].label}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(alert.timestamp), 'HH:mm:ss')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Value: {metricConfigs[alert.metric as keyof typeof metricConfigs].format(alert.value)} | 
                      Threshold: {metricConfigs[alert.metric as keyof typeof metricConfigs].format(alert.threshold)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </DaisyTabsContent>
          
          <DaisyTabsContent value="settings" className="space-y-4">
            <h4 className="font-medium mb-4">Alert Thresholds</h4>
            
            <div className="space-y-4">
              {thresholds.map((threshold, index) => (
                <div key={threshold.metric} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">
                      {metricConfigs[threshold.metric].label}
                    </span>
                    <DaisySwitch
                      checked={threshold.enabled}
                      onCheckedChange={(enabled) => updateThreshold(index, { enabled })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <DaisyLabel className="text-xs">Condition</DaisyLabel>
                      <DaisySelect 
                        value={threshold.condition} 
                        onValueChange={(condition: 'above' | 'below') => updateThreshold(index, { condition })}
                      >
                        <DaisySelectTrigger className="h-8">
                          <DaisySelectValue />
                        </DaisySelectTrigger>
                        <DaisySelectContent>
                          <DaisySelectItem value="above">Above</SelectItem>
                          <DaisySelectItem value="below">Below</SelectItem>
                        </SelectContent>
                      </DaisySelect>
                    </div>
                    
                    <div>
                      <DaisyLabel className="text-xs">Threshold</DaisyLabel>
                      <input
                        type="number"
                        value={threshold.threshold}
                        onChange={(e) => updateThreshold(index, { threshold: Number(e.target.value) })}
                        className="w-full h-8 px-2 border rounded text-sm"
                      />
                    </div>
                    
                    <div>
                      <DaisyLabel className="text-xs">Severity</DaisyLabel>
                      <DaisySelect 
                        value={threshold.severity} 
                        onValueChange={(severity: 'low' | 'medium' | 'high' | 'critical') => updateThreshold(index, { severity })}
                      >
                        <DaisySelectTrigger className="h-8">
                          <DaisySelectValue />
                        </DaisySelectTrigger>
                        <DaisySelectContent>
                          <DaisySelectItem value="low">Low</SelectItem>
                          <DaisySelectItem value="medium">Medium</SelectItem>
                          <DaisySelectItem value="high">High</SelectItem>
                          <DaisySelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </DaisySelect>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DaisyTabsContent>
        </DaisyTabs>
      </DaisyCardContent>
    </DaisyCard>
  );
} 