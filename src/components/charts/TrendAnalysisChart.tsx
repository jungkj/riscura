'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisySwitch } from '@/components/ui/DaisySwitch';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import {
  ResponsiveContainer,
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
  ReferenceLine,
  Brush,
  ComposedChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Download,
  Settings,
  Maximize2,
  Filter,
  AlertTriangle,
  Target,
  BarChart3,
  LineChart as LineChartIcon,
  AreaChart as AreaChartIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, subMonths, subYears, parseISO } from 'date-fns';

interface TrendDataPoint {
  date: string;
  totalRisks: number;
  criticalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  newRisks: number;
  closedRisks: number;
  averageRiskScore: number;
  residualRisk: number;
  mitigationEffectiveness: number;
  complianceScore: number;
  controlEffectiveness: number;
}

interface ForecastPoint {
  date: string;
  predicted: number;
  confidence: number;
  upperBound: number;
  lowerBound: number;
}

interface TrendAnalysisChartProps {
  data: TrendDataPoint[];
  height?: number;
  showForecast?: boolean;
  forecastPeriod?: number; // days
  className?: string;
  onDataPointClick?: (dataPoint: TrendDataPoint) => void;
  onExport?: (data: any) => void;
}

// Generate sample trend data for demonstration
const generateSampleData = (days: number = 90): TrendDataPoint[] => {
  const data: TrendDataPoint[] = [];
  const startDate = subDays(new Date(), days);
  
  for (let i = 0; i < days; i++) {
    const date = format(subDays(new Date(), days - i), 'yyyy-MM-dd');
    const baseRisk = 100 + Math.sin(i / 10) * 20 + Math.random() * 10;
    
    data.push({
      date,
      totalRisks: Math.floor(baseRisk),
      criticalRisks: Math.floor(baseRisk * 0.1 + Math.random() * 5),
      highRisks: Math.floor(baseRisk * 0.2 + Math.random() * 8),
      mediumRisks: Math.floor(baseRisk * 0.4 + Math.random() * 15),
      lowRisks: Math.floor(baseRisk * 0.3 + Math.random() * 10),
      newRisks: Math.floor(Math.random() * 8 + 2),
      closedRisks: Math.floor(Math.random() * 6 + 1),
      averageRiskScore: Math.round((8.5 + Math.sin(i / 15) * 2 + Math.random() * 1) * 10) / 10,
      residualRisk: Math.round((6.2 + Math.sin(i / 12) * 1.5 + Math.random() * 0.8) * 10) / 10,
      mitigationEffectiveness: Math.round((75 + Math.sin(i / 8) * 10 + Math.random() * 5) * 10) / 10,
      complianceScore: Math.round((85 + Math.sin(i / 20) * 8 + Math.random() * 4) * 10) / 10,
      controlEffectiveness: Math.round((78 + Math.sin(i / 14) * 12 + Math.random() * 6) * 10) / 10
    });
  }
  
  return data;
};

// Generate forecast data using simple linear regression
const generateForecast = (data: TrendDataPoint[], metric: keyof TrendDataPoint, days: number): ForecastPoint[] => {
  if (data.length < 2) return [];
  
  const values = data.map((d, i) => ({ x: i, y: Number(d[metric]) }));
  const n = values.length;
  
  // Simple linear regression
  const sumX = values.reduce((sum, v) => sum + v.x, 0);
  const sumY = values.reduce((sum, v) => sum + v.y, 0);
  const sumXY = values.reduce((sum, v) => sum + v.x * v.y, 0);
  const sumXX = values.reduce((sum, v) => sum + v.x * v.x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate standard error for confidence intervals
  const predictions = values.map(v => slope * v.x + intercept);
  const residuals = values.map((v, i) => v.y - predictions[i]);
  const mse = residuals.reduce((sum, r) => sum + r * r, 0) / (n - 2);
  const standardError = Math.sqrt(mse);
  
  const forecast: ForecastPoint[] = [];
  const lastDate = new Date(data[data.length - 1].date);
  
  for (let i = 1; i <= days; i++) {
    const x = n + i - 1;
    const predicted = slope * x + intercept;
    const confidence = Math.max(0, Math.min(100, 95 - (i * 2))); // Decreasing confidence over time
    const margin = standardError * 2 * (1 + i * 0.1); // Increasing uncertainty
    
    forecast.push({
      date: format(subDays(lastDate, -i), 'yyyy-MM-dd'),
      predicted: Math.round(predicted * 10) / 10,
      confidence,
      upperBound: Math.round((predicted + margin) * 10) / 10,
      lowerBound: Math.round((predicted - margin) * 10) / 10
    });
  }
  
  return forecast;
};

export default function TrendAnalysisChart({
  data = generateSampleData(),
  height = 400,
  showForecast = true,
  forecastPeriod = 30,
  className = '',
  onDataPointClick,
  onExport
}: TrendAnalysisChartProps) {
  const { toast } = useToast();
  
  // State management
  const [selectedMetric, setSelectedMetric] = useState<Exclude<keyof TrendDataPoint, 'date'>>('totalRisks');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar' | 'composed'>('line');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [showMovingAverage, setShowMovingAverage] = useState(true);
  const [showTrendLine, setShowTrendLine] = useState(true);
  const [localShowForecast, setShowForecast] = useState(showForecast);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  
  // Filter data based on time range
  const filteredData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    return data.slice(-days);
  }, [data, timeRange]);
  
  // Calculate moving average
  const dataWithMovingAverage = useMemo(() => {
    if (!showMovingAverage) return filteredData;
    
    const windowSize = 7; // 7-day moving average
    return filteredData.map((point, index) => {
      const start = Math.max(0, index - windowSize + 1);
      const window = filteredData.slice(start, index + 1);
      const average = window.reduce((sum, p) => sum + Number(p[selectedMetric]), 0) / window.length;
      
      return {
        ...point,
        movingAverage: Math.round(average * 10) / 10
      };
    });
  }, [filteredData, selectedMetric, showMovingAverage]);
  
  // Generate forecast data
  const forecastData = useMemo(() => {
    if (!localShowForecast) return [];
    return generateForecast(filteredData, selectedMetric, forecastPeriod);
  }, [filteredData, selectedMetric, localShowForecast, forecastPeriod]);
  
  // Combine historical and forecast data for display
  const combinedData = useMemo(() => {
    const historical = dataWithMovingAverage.map(d => ({
      ...d,
      type: 'historical' as const
    }));
    
    const forecast = forecastData.map(f => ({
      date: f.date,
      [selectedMetric]: f.predicted,
      upperBound: f.upperBound,
      lowerBound: f.lowerBound,
      confidence: f.confidence,
      type: 'forecast' as const
    }));
    
    return [...historical, ...forecast];
  }, [dataWithMovingAverage, forecastData, selectedMetric]);
  
  // Calculate trend statistics
  const trendStats = useMemo(() => {
    if (filteredData.length < 2) return null;
    
    const firstValue = Number(filteredData[0][selectedMetric]);
    const lastValue = Number(filteredData[filteredData.length - 1][selectedMetric]);
    const change = lastValue - firstValue;
    const percentChange = (change / firstValue) * 100;
    
    // Calculate trend direction
    const values = filteredData.map(d => Number(d[selectedMetric]));
    const midPoint = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, midPoint);
    const secondHalf = values.slice(midPoint);
    
    const firstHalfAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
    
    const trend = secondHalfAvg > firstHalfAvg ? 'increasing' : 
                  secondHalfAvg < firstHalfAvg ? 'decreasing' : 'stable';
    
    return {
      change: Math.round(change * 10) / 10,
      percentChange: Math.round(percentChange * 10) / 10,
      trend,
      current: lastValue,
      previous: firstValue
    };
  }, [filteredData, selectedMetric]);
  
  // Metric configurations
  const metricConfigs: Record<Exclude<keyof TrendDataPoint, 'date'>, { label: string; color: string; format: (v: number) => string }> = {
    totalRisks: { label: 'Total Risks', color: '#3b82f6', format: (v: number) => v.toString() },
    criticalRisks: { label: 'Critical Risks', color: '#ef4444', format: (v: number) => v.toString() },
    highRisks: { label: 'High Risks', color: '#f97316', format: (v: number) => v.toString() },
    mediumRisks: { label: 'Medium Risks', color: '#eab308', format: (v: number) => v.toString() },
    lowRisks: { label: 'Low Risks', color: '#22c55e', format: (v: number) => v.toString() },
    newRisks: { label: 'New Risks', color: '#8b5cf6', format: (v: number) => v.toString() },
    closedRisks: { label: 'Closed Risks', color: '#06b6d4', format: (v: number) => v.toString() },
    averageRiskScore: { label: 'Avg Risk Score', color: '#f59e0b', format: (v: number) => v.toFixed(1) },
    residualRisk: { label: 'Residual Risk', color: '#dc2626', format: (v: number) => v.toFixed(1) },
    mitigationEffectiveness: { label: 'Mitigation %', color: '#16a34a', format: (v: number) => `${v.toFixed(1)}%` },
    complianceScore: { label: 'Compliance Score', color: '#2563eb', format: (v: number) => `${v.toFixed(1)}%` },
    controlEffectiveness: { label: 'Control Effectiveness', color: '#7c3aed', format: (v: number) => `${v.toFixed(1)}%` }
  };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    const config = metricConfigs[selectedMetric];

  return (
    <div className="bg-white p-3 border rounded-lg shadow-lg">
        <div className="font-medium text-sm mb-2">
          {format(new Date(label), 'MMM dd, yyyy')}
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span>{config.label}:</span>
            <span className="font-medium" style={{ color: config.color }}>
              {config.format(Number(data[selectedMetric]))}
            </span>
          </div>
          
          {data.movingAverage && (
            <div className="flex items-center justify-between">
              <span>7-day Average:</span>
              <span className="font-medium text-gray-600">
                {config.format(data.movingAverage)}
              </span>
            </div>
          )}
          
          {data.type === 'forecast' && (
            <>
              <div className="flex items-center justify-between">
                <span>Confidence:</span>
                <span className="font-medium text-blue-600">
                  {data.confidence}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Range:</span>
                <span className="font-medium text-gray-500">
                  {config.format(data.lowerBound)} - {config.format(data.upperBound)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };
  
  // Export functionality
  const handleExport = () => {
    const exportData = {
      metadata: {
        metric: selectedMetric,
        timeRange,
        chartType,
        exportDate: new Date().toISOString(),
        dataPoints: filteredData.length,
        forecastPoints: forecastData.length
      },
      trendStats,
      historicalData: filteredData,
      forecastData: localShowForecast ? forecastData : [],
              settings: {
          showMovingAverage,
          showTrendLine,
          showForecast: localShowForecast,
          forecastPeriod
        }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trend-analysis-${selectedMetric}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    onExport?.(exportData);
    
    toast({
      title: 'Export Complete',
      description: 'Trend analysis data has been exported successfully.',
    });
  };
  
  // Render chart based on type
  const renderChart = () => {
    const config = metricConfigs[selectedMetric];
    
    const commonProps = {
      data: combinedData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };
    
    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => format(new Date(date), 'MMM dd')}
            />
            <YAxis tickFormatter={config.format} />
            <DaisyTooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={selectedMetric}
              stroke={config.color}
              fill={config.color}
              fillOpacity={0.3}
              strokeWidth={2}
            />
            {showMovingAverage && (
              <Area
                type="monotone"
                dataKey="movingAverage"
                stroke="#6b7280"
                fill="none"
                strokeWidth={1}
                strokeDasharray="5 5"
              />
            )}
            {showForecast && (
              <Area
                type="monotone"
                dataKey={selectedMetric}
                stroke={config.color}
                fill={config.color}
                fillOpacity={0.1}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            )}
          </AreaChart>
        );
        
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => format(new Date(date), 'MMM dd')}
            />
            <YAxis tickFormatter={config.format} />
            <DaisyTooltip content={<CustomTooltip />} />
            <Bar dataKey={selectedMetric} fill={config.color} />
          </BarChart>
        );
        
      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => format(new Date(date), 'MMM dd')}
            />
            <YAxis tickFormatter={config.format} />
            <DaisyTooltip content={<CustomTooltip />} />
            <Bar dataKey={selectedMetric} fill={config.color} fillOpacity={0.6} />
            {showMovingAverage && (
              <Line
                type="monotone"
                dataKey="movingAverage"
                stroke="#6b7280"
                strokeWidth={2}
                dot={false}
              />
            )}
          </ComposedChart>
        );
        
      default: // line
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => format(new Date(date), 'MMM dd')}
            />
            <YAxis tickFormatter={config.format} />
            <DaisyTooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey={selectedMetric}
              stroke={config.color}
              strokeWidth={2}
              dot={{ fill: config.color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            {showMovingAverage && (
              <Line
                type="monotone"
                dataKey="movingAverage"
                stroke="#6b7280"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
              />
            )}
            {showTrendLine && trendStats && (
              <ReferenceLine 
                stroke="#ef4444" 
                strokeDasharray="2 2" 
                strokeWidth={1}
              />
            )}
          </LineChart>
        );
    }
  };
  
  return (
    <DaisyCard className={`${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <DaisyCardHeader className="pb-3" >
  <div className="flex items-center justify-between">
</DaisyTooltip>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <DaisyCardTitle className="text-lg">Trend Analysis</DaisyCardTitle>
            {trendStats && (
              <DaisyBadge 
                variant={trendStats.trend === 'increasing' ? 'destructive' : 
                        trendStats.trend === 'decreasing' ? 'default' : 'secondary'}
                className="text-xs" >
  {trendStats.trend === 'increasing' && 
</DaisyBadge><TrendingUp className="w-3 h-3 mr-1" />}
                {trendStats.trend === 'decreasing' && <TrendingDown className="w-3 h-3 mr-1" />}
                {trendStats.percentChange > 0 ? '+' : ''}{trendStats.percentChange}%
              </DaisyBadge>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <DaisyButton
              variant="ghost"
              size="sm"
              onClick={handleExport}
              className="p-2" >
  <Download className="w-4 h-4" />
</DaisyButton>
            </DaisyButton>
            
            <DaisyButton
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2" />
              <Maximize2 className="w-4 h-4" />
            </DaisyButton>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mt-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <DaisySelect value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)} />
              <DaisySelectTrigger className="w-48" />
                <DaisySelectValue /></DaisySelect>
              <DaisySelectContent />
                {Object.entries(metricConfigs).map(([key, config]) => (
                  <DaisySelectItem key={key} value={key} />
                    {config.label}
                  </DaisySelectContent>
                ))}
              </DaisySelectContent>
            </DaisySelect>
            
            <DaisySelect value={timeRange} onValueChange={(value: any) => setTimeRange(value)} />
              <DaisySelectTrigger className="w-24" />
                <DaisySelectValue /></DaisySelect>
              <DaisySelectContent />
                <DaisySelectItem value="7d">7 days</DaisySelectContent>
                <DaisySelectItem value="30d">30 days</DaisySelectItem>
                <DaisySelectItem value="90d">90 days</DaisySelectItem>
                <DaisySelectItem value="1y">1 year</DaisySelectItem>
              </DaisySelectContent>
            </DaisySelect>
          </div>
          
          <div className="flex items-center space-x-2">
            <DaisyButton
              variant={chartType === 'line' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')} />
              <LineChartIcon className="w-4 h-4" />
            </DaisyButton>
            <DaisyButton
              variant={chartType === 'area' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setChartType('area')} />
              <AreaChartIcon className="w-4 h-4" />
            </DaisyButton>
            <DaisyButton
              variant={chartType === 'bar' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')} />
              <BarChart3 className="w-4 h-4" />
            </DaisyButton>
            <DaisyButton
              variant={chartType === 'composed' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setChartType('composed')} />
              <Activity className="w-4 h-4" />
            </DaisyButton>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <DaisySwitch
                id="moving-average"
                checked={showMovingAverage}
                onCheckedChange={setShowMovingAverage}
              />
              <DaisyLabel htmlFor="moving-average" className="text-sm">7-day MA</DaisySwitch>
            </div>
            
            <div className="flex items-center space-x-2">
              <DaisySwitch
                id="forecast"
                checked={localShowForecast}
                onCheckedChange={setShowForecast}
              />
              <DaisyLabel htmlFor="forecast" className="text-sm">Forecast</DaisySwitch>
            </div>
          </div>
        </div>
      

      <DaisyCardContent >
  <DaisyTabs value={selectedTab} onValueChange={setSelectedTab} />
</DaisyCardContent>
          <DaisyTabsList className="grid w-full grid-cols-3" />
            <DaisyTabsTrigger value="overview">Overview</DaisyTabsList>
            <DaisyTabsTrigger value="detailed">Detailed View</DaisyTabsTrigger>
            <DaisyTabsTrigger value="insights">Insights</DaisyTabsTrigger>
          </DaisyTabsList>
          
          <DaisyTabsContent value="overview" className="space-y-4" />
            {/* Key Metrics */}
            {trendStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Current</div>
                  <div className="text-lg font-bold">
                    {metricConfigs[selectedMetric].format(trendStats.current)}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Change</div>
                  <div className={`text-lg font-bold ${trendStats.change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {trendStats.change >= 0 ? '+' : ''}{metricConfigs[selectedMetric].format(trendStats.change)}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">% Change</div>
                  <div className={`text-lg font-bold ${trendStats.percentChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {trendStats.percentChange >= 0 ? '+' : ''}{trendStats.percentChange}%
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Trend</div>
                  <div className="flex items-center space-x-1">
                    {trendStats.trend === 'increasing' && <TrendingUp className="w-4 h-4 text-red-600" />}
                    {trendStats.trend === 'decreasing' && <TrendingDown className="w-4 h-4 text-green-600" />}
                    {trendStats.trend === 'stable' && <Activity className="w-4 h-4 text-gray-600" />}
                    <span className="text-sm font-medium capitalize">{trendStats.trend}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Chart */}
            <ResponsiveContainer width="100%" height={height}>
              {renderChart()}
            </ResponsiveContainer>
          </DaisyTabsContent>
          
          <DaisyTabsContent value="detailed" className="space-y-4" />
            <ResponsiveContainer width="100%" height={height + 100}>
              <LineChart data={combinedData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                />
                <YAxis tickFormatter={metricConfigs[selectedMetric].format} />
                <DaisyTooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke={metricConfigs[selectedMetric].color}
                  strokeWidth={2}
                  dot={{ fill: metricConfigs[selectedMetric].color, strokeWidth: 2, r: 3 }}
                />
                {showMovingAverage && (
                  <Line
                    type="monotone"
                    dataKey="movingAverage"
                    stroke="#6b7280"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                )}
                <Brush dataKey="date" height={30} />
              </LineChart>
            </ResponsiveContainer>
          </DaisyTabsContent>
          
          <DaisyTabsContent value="insights" className="space-y-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DaisyCard >
  <DaisyCardContent className="p-4" >
  </DaisyTabsContent>
</DaisyCardContent>
                  <h4 className="font-medium mb-3 flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Forecast Summary
                  </h4>
                  {forecastData.length > 0 && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>30-day Prediction:</span>
                        <span className="font-medium">
                          {metricConfigs[selectedMetric].format(forecastData[forecastData.length - 1]?.predicted || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Confidence:</span>
                        <span className="font-medium">
                          {forecastData[forecastData.length - 1]?.confidence || 0}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Range:</span>
                        <span className="font-medium text-gray-600">
                          {metricConfigs[selectedMetric].format(forecastData[forecastData.length - 1]?.lowerBound || 0)} - {metricConfigs[selectedMetric].format(forecastData[forecastData.length - 1]?.upperBound || 0)}
                        </span>
                      </div>
                    </div>
                  )}
                </DaisyCardContent>
              </DaisyCard>
              
              <DaisyCard >
  <DaisyCardContent className="p-4" >
  </DaisyCard>
</DaisyCardContent>
                  <h4 className="font-medium mb-3 flex items-center">
                    <DaisyAlertTriangle className="w-4 h-4 mr-2" >
  Key Insights
</DaisyAlertTriangle>
                  </h4>
                  <div className="space-y-2 text-sm">
                    {trendStats?.trend === 'increasing' && (
                      <div className="p-2 bg-red-50 text-red-800 rounded">
                        ⚠️ Upward trend detected - requires attention
                      </div>
                    )}
                    {trendStats?.trend === 'decreasing' && (
                      <div className="p-2 bg-green-50 text-green-800 rounded">
                        ✅ Positive downward trend observed
                      </div>
                    )}
                    {Math.abs(trendStats?.percentChange || 0) > 20 && (
                      <div className="p-2 bg-yellow-50 text-yellow-800 rounded">
                        📈 Significant change ({trendStats?.percentChange}%) in selected period
                      </div>
                    )}
                    <div className="p-2 bg-blue-50 text-blue-800 rounded">
                      📊 Data points: {filteredData.length} | Range: {timeRange}
                    </div>
                  </div>
                </DaisyCardContent>
              </DaisyCard>
            </div>
          </DaisyTabsContent>
        </DaisyTabs>
      </DaisyCardContent>
    </DaisyCard>
  );
} 