'use client';

import React, { useState, useEffect } from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { Copy, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ReportWidget } from '@/lib/reporting/engine';

interface KPIWidgetProps {
  widget: ReportWidget;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ReportWidget>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

interface KPIData {
  value: number;
  previousValue: number;
  target?: number;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
  format: 'number' | 'percentage' | 'currency';
  label?: string;
}

export function KPIWidget({
  widget,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
}: KPIWidgetProps) {
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [widget.dataSource]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setData(getSampleData());
    } catch (err) {
      setError('Failed to load KPI data');
    } finally {
      setLoading(false);
    }
  };

  const getSampleData = (): KPIData => {
    const kpiType = widget.dataSource.source || 'risks';
    
    switch (kpiType.toLowerCase()) {
      case 'risks':
        return {
          value: 23,
          previousValue: 28,
          target: 20,
          trend: 'down',
          status: 'warning',
          format: 'number',
          label: 'Open Risks',
        };
      case 'controls':
        return {
          value: 85,
          previousValue: 82,
          target: 90,
          trend: 'up',
          status: 'good',
          format: 'percentage',
          label: 'Control Effectiveness',
        };
      case 'incidents':
        return {
          value: 5,
          previousValue: 3,
          target: 2,
          trend: 'up',
          status: 'critical',
          format: 'number',
          label: 'Security Incidents',
        };
      case 'compliance':
        return {
          value: 92,
          previousValue: 89,
          target: 95,
          trend: 'up',
          status: 'good',
          format: 'percentage',
          label: 'Compliance Score',
        };
      default:
        return {
          value: 42,
          previousValue: 38,
          trend: 'up',
          status: 'good',
          format: 'number',
          label: 'Metric',
        };
    }
  };

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'percentage':
        return `${value}%`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      default:
        return value.toLocaleString();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getChangePercentage = () => {
    if (!data || data.previousValue === 0) return 0;
    return ((data.value - data.previousValue) / data.previousValue) * 100;
  };

  return (
    <DaisyCard 
      className={`h-full ${isSelected ? 'ring-2 ring-blue-500' : ''} cursor-pointer`}
      onClick={onSelect}
    >
      <DaisyCardBody className="pb-2 flex flex-row items-center justify-between" >
  <DaisyCardTitle className="text-sm font-medium">
</DaisyCard>{widget.title}</DaisyCardTitle>
        <div className="flex items-center space-x-1">
          <DaisyButton
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
          >
            <Copy className="w-3 h-3" />
          </DaisyButton>
          <DaisyButton
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-3 h-3" />
          </DaisyButton>
        </div>
      
      <DaisyCardBody className="pt-0" >
  {loading ? (
</DaisyCardBody>
          <div className="flex items-center justify-center h-16">
            <div className="text-sm text-gray-500">Loading...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-16">
            <div className="text-sm text-red-500">{error}</div>
          </div>
        ) : data ? (
          <div className="space-y-2">
            {/* Main Value */}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatValue(data.value, data.format)}
              </div>
              {data.label && (
                <div className="text-xs text-gray-500">{data.label}</div>
              )}
            </div>

            {/* Status Badge */}
            <div className="flex justify-center">
              <span className={`px-2 py-1 rounded text-xs capitalize ${getStatusColor(data.status)}`}>
                {data.status}
              </span>
            </div>

            {/* Trend and Change */}
            <div className="flex items-center justify-center space-x-2">
              {getTrendIcon(data.trend)}
              <span className={`text-xs ${
                getChangePercentage() > 0 ? 'text-green-600' : 
                getChangePercentage() < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {getChangePercentage() > 0 ? '+' : ''}{getChangePercentage().toFixed(1)}%
              </span>
            </div>

            {/* Target Progress */}
            {data.target && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Target: {formatValue(data.target, data.format)}</span>
                  <span>{((data.value / data.target) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${
                      data.value >= data.target ? 'bg-green-600' : 
                      data.value >= data.target * 0.8 ? 'bg-yellow-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${Math.min((data.value / data.target) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Previous Value Comparison */}
            <div className="text-center text-xs text-gray-500">
              Previous: {formatValue(data.previousValue, data.format)}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-16">
            <div className="text-sm text-gray-500">No data available</div>
          </div>
        )}
      </DaisyCardBody>
    </DaisyCard>
  );
} 