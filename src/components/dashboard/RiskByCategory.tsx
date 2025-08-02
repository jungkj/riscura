import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';

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

export const RiskByCategory: React.FC = () => {
  const data = useMemo(() => [
    { name: 'Operational', value: 35, color: '#3b82f6' },
    { name: 'Financial', value: 25, color: '#10b981' },
    { name: 'Compliance', value: 20, color: '#f59e0b' },
    { name: 'Strategic', value: 15, color: '#ef4444' },
    { name: 'Technology', value: 5, color: '#8b5cf6' },
  ], []);

  const CustomTooltip: React.FC<DaisyTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} risks ({((data.value / 100) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <DaisyCard >
  <DaisyCardBody />
</DaisyTooltipProps>
        <DaisyCardTitle>Risk by Category</DaisyCardTitle>
        </DaisyCardBody>
        <DaisyCardBody >
  <div className="h-80">
</DaisyCardBody>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <DaisyTooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </DaisyTooltip>
    </DaisyCard>
  );
};