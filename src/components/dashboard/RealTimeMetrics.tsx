'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import {
  TrendingUp, TrendingDown, Minus, BarChart3, AlertTriangle, 
  CheckCircle, Shield, Activity, Clock, Target, DollarSign,
  Users, Globe, Zap, Eye, Brain
} from 'lucide-react';

interface MetricData {
  totalRisks: number;
  highPriorityRisks: number;
  complianceScore: number;
  activeIncidents: number;
  controlsActive: number;
  aiInsights: number;
  lastUpdate: Date;
}

interface RealTimeMetricsProps {
  data: MetricData;
}

interface MetricItem {
  id: string;
  label: string;
  value: number;
  previousValue?: number;
  format: 'number' | 'percentage' | 'currency' | 'time';
  icon: React.ReactNode;
  color: string;
  target?: number;
  threshold?: { warning: number; critical: number };
  description?: string;
}

export function RealTimeMetrics({ data }: RealTimeMetricsProps) {
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});
  const [isVisible, setIsVisible] = useState(false);

  // Define metrics configuration
  const metrics: MetricItem[] = [
    {
      id: 'total-risks',
      label: 'Total Risks',
      value: data.totalRisks,
      previousValue: data.totalRisks - 3,
      format: 'number',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'text-blue-600',
      target: 150,
      threshold: { warning: 180, critical: 200 },
      description: 'Active risks across all categories'
    },
    {
      id: 'high-priority',
      label: 'High Priority',
      value: data.highPriorityRisks,
      previousValue: data.highPriorityRisks + 2,
      format: 'number',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-red-600',
      target: 15,
      threshold: { warning: 20, critical: 30 },
      description: 'Critical and high-impact risks requiring immediate attention'
    },
    {
      id: 'compliance-score',
      label: 'Compliance Score',
      value: data.complianceScore,
      previousValue: data.complianceScore - 1.2,
      format: 'percentage',
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'text-green-600',
      target: 95,
      threshold: { warning: 85, critical: 75 },
      description: 'Overall compliance effectiveness across frameworks'
    },
    {
      id: 'active-incidents',
      label: 'Active Incidents',
      value: data.activeIncidents,
      previousValue: data.activeIncidents + 1,
      format: 'number',
      icon: <Activity className="w-5 h-5" />,
      color: 'text-orange-600',
      target: 0,
      threshold: { warning: 3, critical: 5 },
      description: 'Ongoing security incidents and risk events'
    },
    {
      id: 'controls-active',
      label: 'Active Controls',
      value: data.controlsActive,
      previousValue: data.controlsActive - 5,
      format: 'number',
      icon: <Shield className="w-5 h-5" />,
      color: 'text-purple-600',
      target: 250,
      threshold: { warning: 200, critical: 150 },
      description: 'Operational security and compliance controls'
    },
    {
      id: 'ai-insights',
      label: 'AI Insights',
      value: data.aiInsights,
      previousValue: data.aiInsights - 2,
      format: 'number',
      icon: <Brain className="w-5 h-5" />,
      color: 'text-indigo-600',
      target: 10,
      threshold: { warning: 5, critical: 2 },
      description: 'Active AI-generated recommendations and insights'
    }
  ];

  // Animate values on mount and data changes
  useEffect(() => {
    setIsVisible(true);
    
    metrics.forEach((metric, index) => {
      setTimeout(() => {
        setAnimatedValues(prev => ({
          ...prev,
          [metric.id]: metric.value
        }));
      }, index * 200);
    });
  }, [data]);

  // Helper functions
  const formatValue = (value: number, format: string): string => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'time':
        return `${Math.floor(value / 60)}h ${value % 60}m`;
      default:
        return value.toLocaleString();
    }
  };

  const getTrendIcon = (current: number, previous?: number) => {
    if (!previous) return <Minus className="w-3 h-3" />;
    
    if (current > previous) {
      return <TrendingUp className="w-3 h-3 text-green-600" />;
    } else if (current < previous) {
      return <TrendingDown className="w-3 h-3 text-red-600" />;
    } else {
      return <Minus className="w-3 h-3 text-gray-400" />;
    }
  };

  const getTrendPercentage = (current: number, previous?: number): string => {
    if (!previous || previous === 0) return '0.0%';
    
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const getStatusColor = (value: number, threshold?: { warning: number; critical: number }) => {
    if (!threshold) return 'text-gray-600';
    
    if (value >= threshold.critical) return 'text-red-600';
    if (value >= threshold.warning) return 'text-orange-600';
    return 'text-green-600';
  };

  const getProgressValue = (value: number, target?: number) => {
    if (!target) return 0;
    return Math.min((value / target) * 100, 100);
  };

  return (
    <div className="space-y-4 font-inter">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <h2 className="text-lg font-semibold text-[#191919] font-inter">
            Real-Time Metrics
          </h2>
          <Badge variant="outline" className="text-xs border-[#D8C3A5] text-[#191919] font-inter">
            Live
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-[#A8A8A8] font-inter">
          <Clock className="w-4 h-4" />
          <span>Last updated: {data.lastUpdate.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric, index) => {
          const animatedValue = animatedValues[metric.id] || 0;
          const trendPercentage = getTrendPercentage(metric.value, metric.previousValue);
          const statusColor = getStatusColor(metric.value, metric.threshold);
          const progressValue = getProgressValue(metric.value, metric.target);

          return (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ 
                opacity: isVisible ? 1 : 0, 
                y: isVisible ? 0 : 20,
                scale: isVisible ? 1 : 0.9
              }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ scale: 1.02 }}
              className="h-full"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="h-full bg-[#FAFAFA] border-[#D8C3A5] hover:shadow-lg transition-all duration-300 cursor-pointer">
                    <CardContent className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-lg bg-[#D8C3A5]/20 ${statusColor}`}>
                          {metric.icon}
                        </div>
                        <div className="flex items-center space-x-1">
                          {getTrendIcon(metric.value, metric.previousValue)}
                          <span className={`text-xs font-medium font-inter ${
                            metric.previousValue && metric.value > metric.previousValue 
                              ? 'text-green-600' 
                              : metric.previousValue && metric.value < metric.previousValue
                              ? 'text-red-600'
                              : 'text-[#A8A8A8]'
                          }`}>
                            {trendPercentage}
                          </span>
                        </div>
                      </div>

                      {/* Value */}
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-[#191919] font-inter">
                          <AnimatedNumber value={animatedValue} format={metric.format} />
                        </div>
                        <p className="text-xs font-medium text-[#A8A8A8] font-inter">
                          {metric.label}
                        </p>
                      </div>

                      {/* Progress Bar (if target exists) */}
                      {metric.target && (
                        <div className="space-y-1">
                          <Progress 
                            value={progressValue} 
                            className="h-2 bg-[#D8C3A5]/30"
                          />
                          <div className="flex justify-between text-xs text-[#A8A8A8] font-inter">
                            <span>Current</span>
                            <span>Target: {formatValue(metric.target, metric.format)}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="bg-[#191919] text-[#FAFAFA] border-[#D8C3A5] font-inter">
                  <div className="space-y-1">
                    <p className="font-medium">{metric.label}</p>
                    <p className="text-sm opacity-90">{metric.description}</p>
                    {metric.threshold && (
                      <div className="text-xs space-y-0.5 opacity-75">
                        <p>Warning: {formatValue(metric.threshold.warning, metric.format)}</p>
                        <p>Critical: {formatValue(metric.threshold.critical, metric.format)}</p>
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 10 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <Card className="bg-[#F5F1E9] border-[#D8C3A5]">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center space-y-1">
                <div className="text-sm font-medium text-[#A8A8A8] font-inter">
                  Risk Exposure
                </div>
                <div className="text-xl font-bold text-[#191919] font-inter">
                  {((data.highPriorityRisks / data.totalRisks) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-[#A8A8A8] font-inter">
                  High-priority risks ratio
                </div>
              </div>
              
              <div className="text-center space-y-1">
                <div className="text-sm font-medium text-[#A8A8A8] font-inter">
                  Control Coverage
                </div>
                <div className="text-xl font-bold text-[#191919] font-inter">
                  {((data.controlsActive / (data.totalRisks * 1.5)) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-[#A8A8A8] font-inter">
                  Risk mitigation ratio
                </div>
              </div>
              
              <div className="text-center space-y-1">
                <div className="text-sm font-medium text-[#A8A8A8] font-inter">
                  AI Efficiency
                </div>
                <div className="text-xl font-bold text-[#191919] font-inter">
                  {(data.aiInsights * 8.5).toFixed(0)}%
                </div>
                <div className="text-xs text-[#A8A8A8] font-inter">
                  Process automation level
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Animated Number Component
function AnimatedNumber({ value, format }: { value: number; format: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const startTime = Date.now();
    const startValue = displayValue;
    const difference = value - startValue;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (difference * easeOut);
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  const formatValue = (val: number, fmt: string): string => {
    switch (fmt) {
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'currency':
        return `$${Math.round(val).toLocaleString()}`;
      case 'time':
        return `${Math.floor(val / 60)}h ${Math.round(val % 60)}m`;
      default:
        return Math.round(val).toLocaleString();
    }
  };

  return <span>{formatValue(displayValue, format)}</span>;
} 