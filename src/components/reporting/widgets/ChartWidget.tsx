'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, Copy, Trash2 } from 'lucide-react';
import { ReportWidget } from '@/lib/reporting/engine';

interface ChartWidgetProps {
  widget: ReportWidget;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ReportWidget>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

export function ChartWidget({
  widget,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
}: ChartWidgetProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [widget.dataSource]);

  const loadData = async () => {
    if (!widget.dataSource.source) {
      // Use sample data if no source configured
      setData(getSampleData());
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would call the reporting engine
      // For now, use sample data
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
      setData(getSampleData());
    } catch (err) {
      setError('Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  const getSampleData = () => {
    const chartType = widget.visualization.chartType || 'bar';
    
    switch (chartType) {
      case 'pie':
        return [
          { name: 'High Risk', value: 15, color: '#ff4444' },
          { name: 'Medium Risk', value: 25, color: '#ffaa00' },
          { name: 'Low Risk', value: 35, color: '#44ff44' },
          { name: 'Very Low Risk', value: 25, color: '#0088ff' },
        ];
      default:
        return [
          { name: 'Jan', value: 400, risk: 240 },
          { name: 'Feb', value: 300, risk: 139 },
          { name: 'Mar', value: 200, risk: 980 },
          { name: 'Apr', value: 278, risk: 390 },
          { name: 'May', value: 189, risk: 480 },
          { name: 'Jun', value: 239, risk: 380 },
        ];
    }
  };

  const renderChart = () => {
    const chartType = widget.visualization.chartType || 'bar';
    const showLegend = widget.visualization.showLegend !== false;
    const showGrid = widget.visualization.showGrid !== false;

    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            <Bar dataKey="value" fill="#8884d8" />
            <Bar dataKey="risk" fill="#82ca9d" />
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
            <Line type="monotone" dataKey="risk" stroke="#82ca9d" strokeWidth={2} />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            <Area type="monotone" dataKey="value" stackId="1" stroke="#8884d8" fill="#8884d8" />
            <Area type="monotone" dataKey="risk" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            {showLegend && <Legend />}
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="value" type="number" />
            <YAxis dataKey="risk" type="number" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            {showLegend && <Legend />}
            <Scatter name="Data Points" data={data} fill="#8884d8" />
          </ScatterChart>
        );

      default:
        return <div className="text-center text-gray-500">Unknown chart type</div>;
    }
  };

  return (
    <Card 
      className={`h-full ${isSelected ? 'ring-2 ring-blue-500' : ''} cursor-pointer`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-gray-500">Loading...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-red-500">{error}</div>
          </div>
        ) : (
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 