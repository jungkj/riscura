import React, { useEffect, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ComplianceDonutProps {
  isLoading?: boolean;
}

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: ChartDataItem;
  }>;
}

export const ComplianceDonut: React.FC<ComplianceDonutProps> = ({ isLoading = false }) => {
  const data = useMemo(() => [
    { name: 'Compliant', value: 85, color: '#10b981' },
    { name: 'Partially Compliant', value: 12, color: '#f59e0b' },
    { name: 'Non-Compliant', value: 3, color: '#ef4444' },
  ], []);
  
  const [animatedData, setAnimatedData] = useState<ChartDataItem[]>(
    data.map(item => ({ ...item, value: 0 }))
  );
  
  // Animation effect for the chart
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setAnimatedData(data);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, data]);
  
  const CustomTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.value}%</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return <Skeleton className="h-[280px] w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={animatedData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {animatedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {animatedData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm">{item.name}</span>
              </div>
              <span className="text-sm font-medium">{item.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};