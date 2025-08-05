'use client';

import React, { useMemo, useState } from 'react';
// import { useRisks } from '@/context/RiskContext';
// import { Risk } from '@/types';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import {
import { DaisyCardTitle, DaisySelect, DaisySelectTrigger, DaisySelectContent, DaisySelectItem, DaisySelectValue, DaisyTooltip } from '@/components/ui/daisy-components';
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar,
  ComposedChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Download,
  Minus,
} from 'lucide-react';

interface RiskTrendData {
  date: string;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  new: number;
  resolved: number;
  avgScore: number;
}

interface RiskTrendChartProps {
  className?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  chartType?: 'line' | 'area' | 'bar' | 'composed';
}

export const RiskTrendChart: React.FC<RiskTrendChartProps> = ({
  className = '',
  timeRange = '30d',
  chartType = 'line',
}) => {
  const { getFilteredRisks } = useRisks();
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedChartType, setSelectedChartType] = useState(chartType);
  const [selectedMetric, setSelectedMetric] = useState<'count' | 'score'>('count');

  const risks = getFilteredRisks();

  // Generate mock historical data for demonstration
  const trendData = useMemo<RiskTrendData[]>(() => {
    const days = selectedTimeRange === '7d' ? 7 : 
                 selectedTimeRange === '30d' ? 30 : 
                 selectedTimeRange === '90d' ? 90 : 365
    
    const data: RiskTrendData[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simulate risk evolution with some randomness but realistic trends
      const baseRisks = Math.max(0, risks.length + (Math.random() - 0.5) * 10)
      const critical = Math.floor(baseRisks * 0.1 * (1 + (Math.random() - 0.5) * 0.5));
      const high = Math.floor(baseRisks * 0.2 * (1 + (Math.random() - 0.5) * 0.5));
      const medium = Math.floor(baseRisks * 0.4 * (1 + (Math.random() - 0.5) * 0.5));
      const low = Math.floor(baseRisks * 0.3 * (1 + (Math.random() - 0.5) * 0.5));
      const total = critical + high + medium + low;
      
      // Calculate average score
      const _avgScore = (critical * 20 + high * 15 + medium * 8 + low * 3) / Math.max(total, 1)
      
      // Simulate new and resolved risks
      const newRisks = Math.floor(Math.random() * 5)
      const resolvedRisks = Math.floor(Math.random() * 3);
      
      data.push({
        date: date.toISOString().split('T')[0],
        total,
        critical,
        high,
        medium,
        low,
        new: newRisks,
        resolved: resolvedRisks,
        avgScore: Math.round(avgScore * 10) / 10,
      });
    }
    
    return data;
  }, [risks, selectedTimeRange]);

  // Calculate trend metrics
  const trendMetrics = useMemo(() => {
    if (trendData.length < 2) return null
    
    const latest = trendData[trendData.length - 1];
    const previous = trendData[trendData.length - 2];
    
    const totalChange = latest.total - previous.total;
    const totalPercentChange = previous.total > 0 ? (totalChange / previous.total) * 100 : 0;
    
    const avgScoreChange = latest.avgScore - previous.avgScore;
    const avgScorePercentChange = previous.avgScore > 0 ? (avgScoreChange / previous.avgScore) * 100 : 0;
    
    return {
      total: { change: totalChange, percent: totalPercentChange },
      avgScore: { change: avgScoreChange, percent: avgScorePercentChange },
    }
  }, [trendData]);

  const getTrendIcon = (change: number) => {
    if (change > 0) return TrendingUp;
    if (change < 0) return TrendingDown;
    return Minus;
  }

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-red-600';
    if (change < 0) return 'text-green-600';
    return 'text-slate-500';
  }

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-medium mb-2">{new Date(label).toLocaleDateString()}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  }

  const renderChart = () => {
    const commonProps = {
      data: trendData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    }

    switch (selectedChartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
            <YAxis />
            <DaisyTooltip content={customTooltip}>
              <Legend />
            <Area type="monotone" dataKey="critical" stackId="1" stroke="#dc2626" fill="#fecaca" />
            <Area type="monotone" dataKey="high" stackId="1" stroke="#ea580c" fill="#fed7aa" />
            <Area type="monotone" dataKey="medium" stackId="1" stroke="#d97706" fill="#fef3c7" />
            <Area type="monotone" dataKey="low" stackId="1" stroke="#16a34a" fill="#dcfce7" />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
            <YAxis />
            <DaisyTooltip content={customTooltip}>
              <Legend />
            <Bar dataKey="critical" stackId="a" fill="#dc2626" />
            <Bar dataKey="high" stackId="a" fill="#ea580c" />
            <Bar dataKey="medium" stackId="a" fill="#d97706" />
            <Bar dataKey="low" stackId="a" fill="#16a34a" />
          </BarChart>
        );

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <DaisyTooltip content={customTooltip}>
              <Legend />
            <Bar yAxisId="left" dataKey="new" fill="#3b82f6" name="New Risks" />
            <Bar yAxisId="left" dataKey="resolved" fill="#10b981" name="Resolved Risks" />
            <Line yAxisId="right" type="monotone" dataKey="avgScore" stroke="#f59e0b" strokeWidth={3} name="Avg Score" />
          </ComposedChart>
        );

      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
            <YAxis />
            <DaisyTooltip content={customTooltip}>
              <Legend />
            <Line type="monotone" dataKey="critical" stroke="#dc2626" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="high" stroke="#ea580c" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="medium" stroke="#d97706" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="low" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        );
    }
  }

  return (
    <DaisyCard className={className} >
  <DaisyCardBody >
</DaisyTooltip>
        <div className="flex items-center justify-between">
          <DaisyCardTitle className="flex items-center gap-2" >
  <TrendingUp className="h-5 w-5" />
</DaisyCardTitle>
            Risk Trends
          </DaisyCardTitle>
          
          <div className="flex items-center gap-2">
            <DaisySelect value={selectedTimeRange} onValueChange={(value) => setSelectedTimeRange(value as typeof selectedTimeRange)} />
              <DaisySelectTrigger className="w-24">
                  <DaisySelectValue />
</DaisySelect>
              <DaisySelectContent >
                  <DaisySelectItem value="7d">7 days</DaisySelectItem>
                <DaisySelectItem value="30d">30 days</DaisySelectItem>
                <DaisySelectItem value="90d">90 days</DaisySelectItem>
                <DaisySelectItem value="1y">1 year</DaisySelectItem>
              </DaisySelectContent>
            </DaisySelect>
            
            <DaisySelect value={selectedChartType} onValueChange={(value) => setSelectedChartType(value as typeof selectedChartType)} />
              <DaisySelectTrigger className="w-32">
                  <DaisySelectValue />
</DaisySelect>
              <DaisySelectContent >
                  <DaisySelectItem value="line">Line Chart</DaisySelectItem>
                <DaisySelectItem value="area">Area Chart</DaisySelectItem>
                <DaisySelectItem value="bar">Bar Chart</DaisySelectItem>
                <DaisySelectItem value="composed">Composed</DaisySelectItem>
              </DaisySelectContent>
            </DaisySelect>
          </div>
        </div>
        
        {/* Trend Metrics */}
        {Boolean(trendMetrics) && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="text-sm text-slate-600">Total Risks:</div>
              <div className={`flex items-center gap-1 text-sm ${getTrendColor(trendMetrics.total.change)}`}>
                {(() => {
                  const TrendIcon = getTrendIcon(trendMetrics.total.change);
                  return <TrendIcon className="h-4 w-4" />;
                })()}
                <span className="font-medium">
                  {trendMetrics.total.change > 0 ? '+' : ''}{trendMetrics.total.change}
                </span>
                <span className="text-xs">
                  ({trendMetrics.total.percent > 0 ? '+' : ''}{trendMetrics.total.percent.toFixed(1)}%)
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-sm text-slate-600">Avg Score:</div>
              <div className={`flex items-center gap-1 text-sm ${getTrendColor(trendMetrics.avgScore.change)}`}>
                {(() => {
                  const TrendIcon = getTrendIcon(trendMetrics.avgScore.change);
                  return <TrendIcon className="h-4 w-4" />;
                })()}
                <span className="font-medium">
                  {trendMetrics.avgScore.change > 0 ? '+' : ''}{trendMetrics.avgScore.change.toFixed(1)}
                </span>
                <span className="text-xs">
                  ({trendMetrics.avgScore.percent > 0 ? '+' : ''}{trendMetrics.avgScore.percent.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        )}
      
      
      <DaisyCardBody >
  <div style={{ width: '100%', height: 400 }}>
</DaisyCardBody>
          <ResponsiveContainer>
            {renderChart()}
          </ResponsiveContainer>
        </div>
        
        {/* Chart Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded"></div>
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-600 rounded"></div>
            <span>High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-600 rounded"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded"></div>
            <span>Low</span>
          </div>
        </div>
      </DaisyCardBody>
    </DaisyCard>
  );
} 