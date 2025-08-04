'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
// import { DaisyCard, DaisyCardBody } from '@/components/ui/DaisyCard'
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyTooltip, DaisyTooltipContent, DaisyTooltipTrigger } from '@/components/ui/DaisyTooltip';
import { DaisyCardBody } from '@/components/ui/daisy-components';
import { Brain } from 'lucide-react';

// import {
  TrendingUp, TrendingDown, Minus, BarChart3, AlertTriangle, 
  CheckCircle, Shield, Activity, Clock, Target, DollarSign,
  Users, Globe, Zap, Eye, Brain
} from 'lucide-react'

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
  threshold?: { warning: number; critical: number }
  description?: string;
}

export function RealTimeMetrics({ data }: RealTimeMetricsProps) {
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Define metrics configuration
  const metrics: MetricItem[] = [
    {
      id: 'total-risks',
      label: 'Total Risks',
      value: data.totalRisks,
      previousValue: data.totalRisks - 3,
      format: 'number',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'text-[#191919]',
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
      icon: <DaisyAlertTriangle className="w-5 h-5" >
  ,
</DaisyAlertTriangle>
      color: 'text-[#191919]',
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
      color: 'text-[#191919]',
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
      color: 'text-[#191919]',
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
      color: 'text-[#191919]',
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
      color: 'text-[#191919]',
      target: 10,
      threshold: { warning: 5, critical: 2 },
      description: 'Active AI-generated recommendations and insights'
    }
  ]

  // Animate values on mount and data changes
  useEffect(() => {
    if (isAnimating) return; // Prevent multiple animations
    
    setIsAnimating(true);
    setIsVisible(true);
    
    // Batch all animations together
    const animationPromises = metrics.map((metric, index) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setAnimatedValues(prev => ({
            ...prev,
            [metric.id]: metric.value
          }))
          resolve();
        }, index * 150); // Reduced delay between animations
      });
    });

    // Wait for all animations to complete
    Promise.all(animationPromises).then(() => {
      setTimeout(() => {
        setIsAnimating(false)
      }, 100); // Small delay before allowing new animations
    });
  }, [data, isAnimating]);

  // Helper functions
  const formatValue = (_value: number, format: string): string => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'time':
        return `${Math.floor(value / 60)}h ${value % 60}m`;
      default:
        return value.toLocaleString();
    }
  }

  const getTrendIcon = (current: number, previous?: number) => {
    if (!previous) return <Minus className="w-3 h-3" />;
    
    if (current > previous) {
      return <TrendingUp className="w-3 h-3 text-green-600" />;
    } else if (current < previous) {
      return <TrendingDown className="w-3 h-3 text-red-600" />;
    } else {
      return <Minus className="w-3 h-3 text-gray-400" />;
    }
  }

  const getTrendPercentage = (current: number, previous?: number): string => {
    if (!previous || previous === 0) return '0.0%';
    
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  }

  const getStatusColor = (_value: number, threshold?: { warning: number; critical: number }) => {
    if (!threshold) return 'text-gray-600';
    
    if (value >= threshold.critical) return 'text-red-600';
    if (value >= threshold.warning) return 'text-orange-600';
    return 'text-green-600';
  }

  const getProgressValue = (_value: number, target?: number) => {
    if (!target) return 0;
    return Math.min((value / target) * 100, 100);
  }

  return (
    <div className="space-y-4 font-inter">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-2 h-2 rounded-full ${isAnimating ? 'bg-green-500 animate-pulse' : 'bg-green-500'}`} />
          <h2 className="text-lg font-semibold text-[#191919] font-inter">
            Real-Time Metrics
          </h2>
          <DaisyBadge variant="outline" className="text-xs border-[#D8C3A5] text-[#191919] font-inter" >
  {isAnimating ? 'Analyzing...' : 'Live'}
</DaisyBadge>
          </DaisyBadge>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-[#A8A8A8] font-inter">
          <Clock className="w-4 h-4" />
          <span>Last updated: {data.lastUpdate.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {metrics.map((metric) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <DaisyCard className="bg-white/60 border-[#E5E1D8] backdrop-blur-sm" >
  <DaisyCardBody className="p-4" >
  </DaisyCard>
</DaisyCardBody>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {metric.icon}
                    <span className="text-sm text-[#6B5B47]">{metric.label}</span>
                  </div>
                  <DaisyTooltip>
                      <DaisyTooltipTrigger>
                        <div className="flex items-center space-x-1">
                        {getTrendIcon(metric.value, metric.previousValue)}
                        <span className={`text-xs ${getStatusColor(metric.value, metric.threshold)}`}>
                          {getTrendPercentage(metric.value, metric.previousValue)}
                        </span>
                      </div>
                    </DaisyTooltip>
                    <DaisyTooltipContent>
                        <p>{metric.description}</p>
                    </DaisyTooltipContent>
                  </DaisyTooltip>
                </div>
                
                <div className="flex items-baseline justify-between">
                  <span className={`text-2xl font-semibold ${metric.color}`}>
                    {formatValue(metric.value, metric.format)}
                  </span>
                  {metric.target && (
                    <span className="text-xs text-[#A8A8A8]">
                      Target: {formatValue(metric.target, metric.format)}
                    </span>
                  )}
                </div>
                
                {metric.target && (
                  <DaisyProgress
                    value={getProgressValue(metric.value, metric.target)}
                    className="mt-2 h-1" />)}
              </DaisyProgress>
            </DaisyCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 10 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <DaisyCard className="bg-[#F5F1E9] border-[#D8C3A5]" >
  <DaisyCardBody className="p-4" >
  </DaisyCard>
</DaisyCardBody>
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
          </DaisyCardBody>
        </DaisyCard>
      </motion.div>
    </div>
  );
}

// Animated Number Component
const AnimatedNumber = ({ value, format }: { value: number; format: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const _duration = 1000;
    const startTime = Date.now();
    const startValue = displayValue;
    const difference = value - startValue;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentValue = startValue + (difference * easeOut);
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [value]);

  const formatValue = (_val: number, fmt: string): string => {
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
  }

  return <span>{formatValue(displayValue, format)}</span>;
} 