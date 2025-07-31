'use client';

import { useMemo, useState } from 'react';
import { useRisks } from '@/context/RiskContext';
import { Risk } from '@/types';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PieChart,
  Building,
  Users,
  Tag,
  Shield,
  BarChart3,
} from 'lucide-react';

interface RiskDistributionData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

interface RiskDistributionChartProps {
  className?: string;
  distributionBy?: 'category' | 'owner' | 'status' | 'level';
  chartType?: 'pie' | 'donut' | 'bar';
}

export const RiskDistributionChart: React.FC<RiskDistributionChartProps> = ({
  className = '',
  distributionBy = 'level',
  chartType = 'donut',
}) => {
  const { getFilteredRisks } = useRisks();
  const [selectedDistribution, setSelectedDistribution] = useState(distributionBy);
  const [selectedChartType, setSelectedChartType] = useState(chartType);

  const risks = getFilteredRisks();

  // Calculate distribution data
  const distributionData = useMemo<RiskDistributionData[]>(() => {
    const counts: Record<string, number> = {};
    const colors: Record<string, string> = {};
    
    // Count items based on distribution type
    risks.forEach(risk => {
      let key: string;
      switch (selectedDistribution) {
        case 'category':
          key = risk.category || 'Unknown';
          break;
        case 'owner':
          key = risk.owner || 'Unassigned';
          break;
        case 'status':
          key = risk.status || 'Unknown';
          break;
        case 'level':
        default:
          if (risk.riskScore >= 20) key = 'Critical';
          else if (risk.riskScore >= 15) key = 'High';
          else if (risk.riskScore >= 8) key = 'Medium';
          else key = 'Low';
          break;
      }
      
      counts[key] = (counts[key] || 0) + 1;
    });

    // Define colors based on distribution type
    if (selectedDistribution === 'level') {
      colors['Critical'] = '#dc2626';
      colors['High'] = '#ea580c';
      colors['Medium'] = '#d97706';
      colors['Low'] = '#16a34a';
    } else if (selectedDistribution === 'status') {
      colors['identified'] = '#f59e0b';
      colors['assessed'] = '#3b82f6';
      colors['mitigated'] = '#10b981';
      colors['closed'] = '#6b7280';
    } else {
      // Generate colors for other categories
      const colorPalette = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
        '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
      ];
      Object.keys(counts).forEach((key, index) => {
        colors[key] = colorPalette[index % colorPalette.length];
      });
    }

    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        color: colors[name] || '#6b7280',
        percentage: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [risks, selectedDistribution]);

  // Custom Donut Chart Component
  const DonutChart: React.FC<{ data: RiskDistributionData[] }> = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const size = 200;
    const strokeWidth = 30;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    
    let cumulativePercentage = 0;
    
    return (
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          {data.map((item, index) => {
            const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -cumulativePercentage * circumference / 100;
            cumulativePercentage += item.percentage;
            
            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300 hover:opacity-80"
              />
            );
          })}
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-slate-900">{total}</div>
          <div className="text-sm text-slate-600">Total Risks</div>
        </div>
      </div>
    );
  };

  // Custom Bar Chart Component
  const BarChart: React.FC<{ data: RiskDistributionData[] }> = ({ data }) => {
    const maxValue = Math.max(...data.map(item => item.value));
    
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-20 text-sm font-medium text-slate-600 truncate">
              {item.name}
            </div>
            <div className="flex-1 relative">
              <div 
                className="h-6 rounded transition-all duration-300 hover:opacity-80"
                style={{ 
                  backgroundColor: item.color,
                  width: `${(item.value / maxValue) * 100}%`,
                  minWidth: '4px'
                }}
              />
              <div className="absolute right-2 top-0 h-6 flex items-center text-xs font-medium text-white">
                {item.value}
              </div>
            </div>
            <div className="w-12 text-sm text-slate-500 text-right">
              {item.percentage.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getDistributionIcon = (type: string) => {
    switch (type) {
      case 'category': return Tag;
      case 'owner': return Users;
      case 'status': return BarChart3;
      case 'level': return Shield;
      default: return Shield;
    }
  };

  const DistributionIcon = getDistributionIcon(selectedDistribution);

  return (
    <DaisyCard className={className} >
  <DaisyCardHeader />
</DaisyCard>
        <div className="flex items-center justify-between">
          <DaisyCardTitle className="flex items-center gap-2" >
  <DistributionIcon className="h-5 w-5" />
</DaisyCardTitle>
            Risk Distribution
          </DaisyCardTitle>
          
          <div className="flex items-center gap-2">
            <DaisySelect value={selectedDistribution} onValueChange={(value) => setSelectedDistribution(value as typeof selectedDistribution)} />
              <DaisySelectTrigger className="w-32" />
                <DaisySelectValue /></DaisySelect>
              <DaisySelectContent />
                <DaisySelectItem value="level">By Level</DaisySelectContent>
                <DaisySelectItem value="category">By Category</DaisySelectItem>
                <DaisySelectItem value="owner">By Owner</DaisySelectItem>
                <DaisySelectItem value="status">By Status</DaisySelectItem>
              </DaisySelectContent>
            </DaisySelect>
            
            <DaisySelect value={selectedChartType} onValueChange={(value) => setSelectedChartType(value as typeof selectedChartType)} />
              <DaisySelectTrigger className="w-24" />
                <DaisySelectValue /></DaisySelect>
              <DaisySelectContent />
                <DaisySelectItem value="donut">Donut</DaisySelectContent>
                <DaisySelectItem value="bar">Bar</DaisySelectItem>
              </DaisySelectContent>
            </DaisySelect>
          </div>
        </div>
      
      
      <DaisyCardContent >
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
</DaisyCardContent>
          {/* Chart */}
          <div className="flex items-center justify-center">
            {selectedChartType === 'donut' ? (
              <DonutChart data={distributionData} />
            ) : (
              <div className="w-full">
                <BarChart data={distributionData} />
              </div>
            )}
          </div>
          
          {/* Legend */}
          <div className="space-y-3">
            <h4 className="font-medium text-slate-900">Distribution</h4>
            <div className="space-y-2">
              {distributionData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-slate-700">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DaisyBadge className="text-xs" >
  {item.value}
</DaisyBadge>
                    </DaisyBadge>
                    <span className="text-xs text-slate-500">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Summary */}
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Total:</span>
                <span className="font-medium text-slate-900">
                  {distributionData.reduce((sum, item) => sum + item.value, 0)} risks
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-slate-600">Categories:</span>
                <span className="font-medium text-slate-900">
                  {distributionData.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DaisyCardContent>
    </DaisyCard>
  );
}; 