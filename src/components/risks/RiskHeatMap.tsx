'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ContentCard } from '@/components/layout/MainContentArea';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisySlider } from '@/components/ui/DaisySlider';
import { ZoomIn, ZoomOut, Download, RotateCcw, Grid3X3, Layers } from 'lucide-react';

// Types
interface HeatMapRisk {
  id: string;
  title: string;
  category: string;
  framework: string;
  impact: number;
  likelihood: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'mitigated' | 'closed';
  owner: string;
  bubble?: {
    size: number;
    opacity: number;
  };
}

// Sample heat map data
const sampleHeatMapData: HeatMapRisk[] = [
  {
    id: 'RSK-001',
    title: 'Data breach through third-party vendor',
    category: 'Data Security',
    framework: 'SOC 2',
    impact: 5,
    likelihood: 4,
    riskScore: 20,
    riskLevel: 'critical',
    status: 'open',
    owner: 'Sarah Chen',
    bubble: { size: 80, opacity: 0.9 },
  },
  {
    id: 'RSK-002',
    title: 'Unauthorized access to financial systems',
    category: 'Access Control',
    framework: 'ISO 27001',
    impact: 4,
    likelihood: 3,
    riskScore: 12,
    riskLevel: 'high',
    status: 'in-progress',
    owner: 'Michael Rodriguez',
    bubble: { size: 60, opacity: 0.8 },
  },
  {
    id: 'RSK-003',
    title: 'Compliance violation in data retention',
    category: 'Compliance',
    framework: 'GDPR',
    impact: 3,
    likelihood: 2,
    riskScore: 6,
    riskLevel: 'medium',
    status: 'in-progress',
    owner: 'Emma Johnson',
    bubble: { size: 40, opacity: 0.7 },
  },
];

// Risk color configuration
const getRiskColor = (level: string) => {
  const colors = {
    critical: 'bg-semantic-error',
    high: 'bg-semantic-warning',
    medium: 'bg-interactive-primary',
    low: 'bg-semantic-success',
  };
  return colors[level as keyof typeof colors] || colors.medium;
};

// Risk Bubble Component
const RiskBubble: React.FC<{
  risk: HeatMapRisk;
  scale: number;
  onClick: (risk: HeatMapRisk) => void;
}> = ({ risk, scale, onClick }) => {
  const baseSize = (risk.bubble?.size || 40) * scale;
  const opacity = risk.bubble?.opacity || 0.7;

  // Position based on impact (x) and likelihood (y) - center bubbles in grid cells
  // Each cell is 20% wide, so centers are at 10%, 30%, 50%, 70%, 90%
  const x = (risk.likelihood - 1) * 20 + 10; // Center of each likelihood column
  // For y-axis, align with the bottom-positioned grid: impact 1 is at bottom, impact 5 is at top
  const y = (risk.impact - 1) * 20 + 10; // Center of each impact row, measured from bottom

  return (
    <div
      className="absolute transition-all duration-300 cursor-pointer group"
      style={{
        left: `${x}%`,
        bottom: `${y}%`,
        transform: 'translate(-50%, 50%)',
      }}
      onClick={() => onClick(risk)}
    >
      <div
        className={cn(
          'rounded-full border-2 border-white shadow-lg transition-all duration-300 group-hover:scale-110',
          getRiskColor(risk.riskLevel)
        )}
        style={{
          width: `${baseSize}px`,
          height: `${baseSize}px`,
          opacity: opacity,
        }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-medium text-xs">{risk.id.split('-')[1]}</span>
      </div>

      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
          <div className="font-medium">{risk.title}</div>
          <div>
            Impact: {risk.impact}, Likelihood: {risk.likelihood}
          </div>
          <div>Score: {risk.riskScore}</div>
        </div>
      </div>
    </div>
  );
};

// Heat Map Grid Component
const HeatMapGrid: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Vertical grid lines for likelihood (1-5) - creating 5 equal sections */}
      {[0, 1, 2, 3, 4, 5].map((line) => (
        <div
          key={`v-${line}`}
          className="absolute top-0 bottom-0 border-l border-gray-300/40"
          style={{ left: `${line * 20}%` }} />
      ))}

      {/* Horizontal grid lines for impact (1-5) - align with y-axis label borders */}
      {/* The y-axis has 5 labels with h-1/5 each, so borders are at 0%, 20%, 40%, 60%, 80%, 100% */}
      {[0, 1, 2, 3, 4].map((line) => (
        <div
          key={`h-${line}`}
          className="absolute left-0 right-0 border-b border-gray-300/40"
          style={{ bottom: `${line * 20}%` }} />
      ))}
    </div>
  );
};

// Main Risk Heat Map Component
export const RiskHeatMap: React.FC = () => {
  const [selectedRisk, setSelectedRisk] = useState<HeatMapRisk | null>(null);
  const [zoomLevel, setZoomLevel] = useState([100]);
  const [groupBy, setGroupBy] = useState<'none' | 'category' | 'framework' | 'status'>('none');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterFramework, setFilterFramework] = useState<string>('all');
  const [showGrid, setShowGrid] = useState(true);

  // Filter and group data
  const filteredRisks = useMemo(() => {
    return sampleHeatMapData.filter((risk) => {
      const matchesCategory = filterCategory === 'all' || risk.category === filterCategory;
      const matchesFramework = filterFramework === 'all' || risk.framework === filterFramework;
      return matchesCategory && matchesFramework;
    });
  }, [filterCategory, filterFramework]);

  const groupedRisks = useMemo(() => {
    if (groupBy === 'none') return { 'All Risks': filteredRisks };

    return filteredRisks.reduce(
      (groups, risk) => {
        const key = risk[groupBy];
        if (!groups[key]) groups[key] = [];
        groups[key].push(risk);
        return groups;
      },
      {} as Record<string, HeatMapRisk[]>
    );
  }, [filteredRisks, groupBy]);

  const _categories = [...new Set(sampleHeatMapData.map((r) => r.category))];
  const frameworks = [...new Set(sampleHeatMapData.map((r) => r.framework))];

  const handleExport = () => {
    // console.log('Export heat map');
  };

  const handleReset = () => {
    setZoomLevel([100]);
    setGroupBy('none');
    setFilterCategory('all');
    setFilterFramework('all');
    setSelectedRisk(null);
  };

  const scale = zoomLevel[0] / 100;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Risk Heat Map</h2>
          <p className="text-sm text-gray-600">
            Interactive visualization of risk positioning and relationships
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <DaisyButton variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-3 w-3 mr-1" />
            Export
          </DaisyButton>
          <DaisyButton variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </DaisyButton>
        </div>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <ContentCard title="Zoom" className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <DaisyButton
                variant="outline"
                size="sm"
                onClick={() => setZoomLevel([Math.max(50, zoomLevel[0] - 25)])}
                disabled={zoomLevel[0] <= 50}
              >
                <ZoomOut className="h-3 w-3" />
              </DaisyButton>
              <span className="text-xs text-gray-600">{zoomLevel[0]}%</span>
              <DaisyButton
                variant="outline"
                size="sm"
                onClick={() => setZoomLevel([Math.min(200, zoomLevel[0] + 25)])}
                disabled={zoomLevel[0] >= 200}
              >
                <ZoomIn className="h-3 w-3" />
              </DaisyButton>
            </div>
            <DaisySlider
              value={zoomLevel}
              onValueChange={setZoomLevel}
              min={50}
              max={200}
              step={25}
              className="w-full"
            >
            </div>
        </ContentCard>

        <ContentCard title="Group By" className="p-4">
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as any)}
            className="w-full p-2 border border-gray-200 rounded"
          >
            <option value="none">No Grouping</option>
            <option value="category">Category</option>
            <option value="framework">Framework</option>
            <option value="status">Status</option>
          </select>
        </ContentCard>

        <ContentCard title="Category Filter" className="p-4">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full p-2 border border-gray-200 rounded"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </ContentCard>

        <ContentCard title="Framework Filter" className="p-4">
          <select
            value={filterFramework}
            onChange={(e) => setFilterFramework(e.target.value)}
            className="w-full p-2 border border-gray-200 rounded"
          >
            <option value="all">All Frameworks</option>
            {frameworks.map((framework) => (
              <option key={framework} value={framework}>
                {framework}
              </option>
            ))}
          </select>
        </ContentCard>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-xs font-medium text-gray-900">Risk Levels:</span>
          {['low', 'medium', 'high', 'critical'].map((level) => (
            <div key={level} className="flex items-center space-x-1">
              <div className={cn('h-4 w-4 rounded-full', getRiskColor(level))} />
              <span className="text-xs text-gray-600 capitalize">{level}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <DaisyButton
            variant={showGrid ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid3X3 className="h-3 w-3 mr-1" />
            Grid
          </DaisyButton>
          <span className="text-xs text-gray-600">{filteredRisks.length} risks shown</span>
        </div>
      </div>

      {/* Heat Map Container */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <div className="grid grid-cols-6 gap-0">
          <div className="bg-gray-50 p-3 border-r border-b border-gray-200">
            <div className="text-xs font-semibold text-gray-900">Impact →</div>
            <div className="text-xs text-gray-600">Likelihood ↓</div>
          </div>

          {['Very Low', 'Low', 'Medium', 'High', 'Very High'].map((label, index) => (
            <div
              key={label}
              className="bg-gray-50 p-3 border-r border-b border-gray-200 text-center"
            >
              <div className="text-xs font-semibold text-gray-900">{index + 1}</div>
              <div className="text-xs text-gray-600">{label}</div>
            </div>
          ))}
        </div>

        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 border-r border-gray-200 bg-gray-50">
            {['Very High', 'High', 'Medium', 'Low', 'Very Low'].map((label, index) => (
              <div
                key={label}
                className="h-1/5 p-2 border-b border-gray-200 flex flex-col justify-center text-center"
              >
                <div className="text-xs font-semibold text-gray-900">{5 - index}</div>
                <div className="text-xs text-gray-600">{label}</div>
              </div>
            ))}
          </div>

          <div
            className="ml-20 relative bg-gradient-to-br from-green-50/50 via-yellow-50/50 to-red-50/50"
            style={{ height: '400px' }}
          >
            {showGrid && <HeatMapGrid />}

            {Object.entries(groupedRisks).map(([groupName, risks]) => (
              <div key={groupName} className="absolute inset-0">
                {risks.map((risk) => (
                  <RiskBubble key={risk.id} risk={risk} scale={scale} onClick={setSelectedRisk} />
                ))}
              </div>
            ))}

            {groupBy !== 'none' && Object.keys(groupedRisks).length > 1 && (
              <div className="absolute top-2 right-2 space-y-1">
                {Object.entries(groupedRisks).map(([groupName, risks]) => (
                  <DaisyBadge key={groupName} variant="outline" className="text-xs">
                    <Layers className="h-3 w-3 mr-1" />
                    {groupName} ({risks.length})
                  </DaisyBadge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Risk Details */}
      {selectedRisk && (
        <ContentCard
          title={`Risk Details - ${selectedRisk.id}`}
          className="border-l-4 border-l-blue-500"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-gray-600">Title:</span>
              <div className="text-sm font-medium text-gray-900">{selectedRisk.title}</div>
            </div>
            <div>
              <span className="text-xs text-gray-600">Category:</span>
              <div className="text-sm font-medium text-gray-900">{selectedRisk.category}</div>
            </div>
            <div>
              <span className="text-xs text-gray-600">Risk Score:</span>
              <div className="text-sm font-medium text-gray-900">
                {selectedRisk.riskScore} ({selectedRisk.impact} × {selectedRisk.likelihood})
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-600">Owner:</span>
              <div className="text-sm font-medium text-gray-900">{selectedRisk.owner}</div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <div className={cn('h-3 w-3 rounded-full', getRiskColor(selectedRisk.riskLevel))} />
              <span className="text-xs text-gray-600">
                {selectedRisk.riskLevel.charAt(0).toUpperCase() + selectedRisk.riskLevel.slice(1)}{' '}
                Risk
              </span>
            </div>
            <DaisyButton variant="outline" size="sm" onClick={() =>
          setSelectedRisk(null)}>
              Close
            
        </DaisyButton>
          </div>
        </ContentCard>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['critical', 'high', 'medium', 'low'].map((level) => {
          const count = filteredRisks.filter((r) => r.riskLevel === level).length;
          const percentage =
            filteredRisks.length > 0 ? Math.round((count / filteredRisks.length) * 100) : 0;

          return (
            <ContentCard
              key={level}
              title={`${level.charAt(0).toUpperCase() + level.slice(1)} Risks`}
              className={cn(
                'text-center',
                count > 0 ? 'border-2' : 'border',
                count > 0 ? getRiskColor(level).replace('bg-', 'border-') : 'border-gray-200'
              )}
            >
              <div className="space-y-1">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-xs text-gray-600">{percentage}% of total</div>
              </div>
            </ContentCard>
          );
        })}
      </div>
    </div>
  );
};

export default RiskHeatMap;
