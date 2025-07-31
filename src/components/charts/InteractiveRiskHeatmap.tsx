'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyTooltip, DaisyTooltipContent, DaisyTooltipTrigger, DaisyTooltipWrapper } from '@/components/ui/DaisyTooltip';
import { 
  ResponsiveContainer, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Scatter,
  ScatterChart,
  Legend
} from 'recharts';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Settings,
  Filter,
  Maximize2,
  Eye,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RiskData {
  id: string;
  title: string;
  category: string;
  likelihood: number; // 1-5
  impact: number; // 1-5
  riskScore: number; // calculated score
  owner: string;
  status: 'Open' | 'In Progress' | 'Mitigated' | 'Closed';
  lastAssessed: Date;
  trend: 'increasing' | 'decreasing' | 'stable';
  controlsCount: number;
  residualRisk: number;
}

interface HeatmapCell {
  x: number;
  y: number;
  value: number;
  count: number;
  risks: RiskData[];
  color: string;
  label: string;
}

interface InteractiveRiskHeatmapProps {
  data: RiskData[];
  onRiskSelect?: (risk: RiskData) => void;
  onCellDrillDown?: (cell: HeatmapCell) => void;
  height?: number;
  showControls?: boolean;
  className?: string;
}

const RISK_COLORS = {
  1: '#22c55e', // Low - Green
  2: '#84cc16', // Low-Medium - Light Green
  3: '#eab308', // Medium - Yellow
  4: '#f97316', // High - Orange
  5: '#ef4444', // Critical - Red
};

const IMPACT_LABELS = ['', 'Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic'];
const LIKELIHOOD_LABELS = ['', 'Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];

export default function InteractiveRiskHeatmap({
  data,
  onRiskSelect,
  onCellDrillDown,
  height = 400,
  showControls = true,
  className = ''
}: InteractiveRiskHeatmapProps) {
  const { toast } = useToast();
  
  // State management
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'heatmap' | 'scatter'>('heatmap');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showTooltip, setShowTooltip] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filter data based on selected filters
  const filteredData = useMemo(() => {
    return data.filter(risk => {
      const categoryMatch = filterCategory === 'all' || risk.category === filterCategory;
      const statusMatch = filterStatus === 'all' || risk.status === filterStatus;
      return categoryMatch && statusMatch;
    });
  }, [data, filterCategory, filterStatus]);

  // Generate heatmap cells
  const heatmapCells = useMemo(() => {
    const cells: HeatmapCell[] = [];
    
    // Create 5x5 grid for likelihood vs impact
    for (let likelihood = 1; likelihood <= 5; likelihood++) {
      for (let impact = 1; impact <= 5; impact++) {
        const cellRisks = filteredData.filter(
          risk => risk.likelihood === likelihood && risk.impact === impact
        );
        
        const riskScore = likelihood * impact;
        const count = cellRisks.length;
        
        // Calculate average residual risk for the cell
        const avgResidualRisk = count > 0 
          ? cellRisks.reduce((sum, risk) => sum + risk.residualRisk, 0) / count 
          : 0;

        cells.push({
          x: likelihood,
          y: impact,
          value: riskScore,
          count,
          risks: cellRisks,
          color: RISK_COLORS[riskScore as keyof typeof RISK_COLORS] || '#gray-400',
          label: `${LIKELIHOOD_LABELS[likelihood]} / ${IMPACT_LABELS[impact]}`
        });
      }
    }
    
    return cells;
  }, [filteredData]);

  // Generate scatter plot data
  const scatterData = useMemo(() => {
    return filteredData.map(risk => ({
      x: risk.likelihood + (Math.random() - 0.5) * 0.3, // Add jitter
      y: risk.impact + (Math.random() - 0.5) * 0.3,
      z: risk.riskScore,
      risk: risk,
      fill: RISK_COLORS[risk.riskScore as keyof typeof RISK_COLORS] || '#gray-400'
    }));
  }, [filteredData]);

  // Get unique categories and statuses for filters
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(data.map(risk => risk.category))];
    return uniqueCategories.sort();
  }, [data]);

  const statuses = useMemo(() => {
    const uniqueStatuses = [...new Set(data.map(risk => risk.status))];
    return uniqueStatuses.sort();
  }, [data]);

  // Handle cell click
  const handleCellClick = (cell: HeatmapCell) => {
    setSelectedCell(cell);
    onCellDrillDown?.(cell);
  };

  // Handle risk selection
  const handleRiskSelect = (risk: RiskData) => {
    onRiskSelect?.(risk);
  };

  // Export heatmap data
  const exportHeatmap = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      filters: { category: filterCategory, status: filterStatus },
      cells: heatmapCells.map(cell => ({
        likelihood: cell.x,
        impact: cell.y,
        riskScore: cell.value,
        count: cell.count,
        risks: cell.risks.map(risk => ({
          id: risk.id,
          title: risk.title,
          category: risk.category,
          owner: risk.owner,
          status: risk.status
        }))
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `risk-heatmap-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Risk heatmap data has been exported successfully.',
    });
  };

  // Reset view
  const resetView = () => {
    setZoomLevel(1);
    setSelectedCell(null);
    setFilterCategory('all');
    setFilterStatus('all');
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) return null;

    const data = payload[0].payload;
    
    if (viewMode === 'heatmap') {
      const cell = heatmapCells.find(c => c.x === data.x && c.y === data.y);
      if (!cell) return null;

  return (
    <div className="bg-white p-3 border rounded-lg shadow-lg max-w-xs">
          <div className="font-medium text-sm mb-2">{cell.label}</div>
          <div className="space-y-1 text-xs">
            <div>Risk Score: <span className="font-medium">{cell.value}</span></div>
            <div>Risk Count: <span className="font-medium">{cell.count}</span></div>
            {cell.count > 0 && (
              <div className="mt-2 pt-2 border-t">
                <div className="font-medium mb-1">Top Risks:</div>
                {cell.risks.slice(0, 3).map(risk => (
                  <div key={risk.id} className="truncate">• {risk.title}</div>
                ))}
                {cell.count > 3 && (
                  <div className="text-gray-500">... and {cell.count - 3} more</div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    } else {
      const risk = data.risk;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg max-w-xs">
          <div className="font-medium text-sm mb-2">{risk.title}</div>
          <div className="space-y-1 text-xs">
            <div>Category: <span className="font-medium">{risk.category}</span></div>
            <div>Likelihood: <span className="font-medium">{risk.likelihood}</span></div>
            <div>Impact: <span className="font-medium">{risk.impact}</span></div>
            <div>Risk Score: <span className="font-medium">{risk.riskScore}</span></div>
            <div>Owner: <span className="font-medium">{risk.owner}</span></div>
            <div>Status: <DaisyBadge variant="outline" className="text-xs">{risk.status}</DaisyBadge></div>
          </div>
        </div>
      );
    }
  };

  // Render heatmap grid
  const renderHeatmapGrid = () => {
    return (
      <div className="relative">
        <svg width="100%" height={height} viewBox="0 0 400 300">
          {/* Grid background */}
          <defs>
            <pattern id="grid" width="80" height="60" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 60" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Axis labels */}
          <text x="200" y="290" textAnchor="middle" className="text-sm font-medium">
            Likelihood
          </text>
          <text x="15" y="150" textAnchor="middle" className="text-sm font-medium" transform="rotate(-90, 15, 150)">
            Impact
          </text>
          
          {/* Heatmap cells */}
          {heatmapCells.map((cell, index) => {
            const x = (cell.x - 1) * 80 + 40;
            const y = 240 - (cell.y - 1) * 60 - 30;
            const opacity = cell.count === 0 ? 0.1 : Math.min(0.3 + (cell.count * 0.1), 1);
            
            return (
              <g key={index}>
                <rect
                  x={x - 35}
                  y={y - 25}
                  width="70"
                  height="50"
                  fill={cell.color}
                  opacity={opacity}
                  stroke={selectedCell?.x === cell.x && selectedCell?.y === cell.y ? '#2563eb' : '#e5e7eb'}
                  strokeWidth={selectedCell?.x === cell.x && selectedCell?.y === cell.y ? 3 : 1}
                  className="cursor-pointer hover:stroke-blue-500 hover:stroke-2 transition-all"
                  onClick={() => handleCellClick(cell)}
                />
                
                {/* Risk count */}
                <text
                  x={x}
                  y={y - 5}
                  textAnchor="middle"
                  className="text-lg font-bold fill-current pointer-events-none"
                  fill={cell.count > 0 ? '#1f2937' : '#9ca3af'}
                >
                  {cell.count}
                </text>
                
                {/* Risk score */}
                <text
                  x={x}
                  y={y + 10}
                  textAnchor="middle"
                  className="text-xs fill-current pointer-events-none"
                  fill={cell.count > 0 ? '#374151' : '#9ca3af'}
                >
                  Score: {cell.value}
                </text>
              </g>
            );
          })}
          
          {/* Axis tick labels */}
          {[1, 2, 3, 4, 5].map(i => (
            <g key={`likelihood-${i}`}>
              <text
                x={(i - 1) * 80 + 40}
                y={275}
                textAnchor="middle"
                className="text-xs fill-current"
              >
                {i}
              </text>
            </g>
          ))}
          
          {[1, 2, 3, 4, 5].map(i => (
            <g key={`impact-${i}`}>
              <text
                x={25}
                y={245 - (i - 1) * 60}
                textAnchor="middle"
                className="text-xs fill-current"
              >
                {i}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  // Render scatter plot
  const renderScatterPlot = () => {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number" 
            dataKey="x" 
            domain={[0.5, 5.5]}
            ticks={[1, 2, 3, 4, 5]}
            label={{ value: 'Likelihood', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            domain={[0.5, 5.5]}
            ticks={[1, 2, 3, 4, 5]}
            label={{ value: 'Impact', angle: -90, position: 'insideLeft' }}
          />
          <Scatter
            data={scatterData}
            onClick={(data) => handleRiskSelect(data.risk)}
          >
            {scatterData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.fill}
                className="cursor-pointer hover:opacity-80"
              />
            ))}
          </Scatter>
          {showTooltip && <CustomTooltip />}
        </ScatterChart>
      </ResponsiveContainer>
    );
  };

  return (
    <DaisyCard className={`${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <DaisyCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DaisyAlertTriangle className="w-5 h-5 text-orange-600" />
            <DaisyCardTitle className="text-lg">Risk Heatmap</DaisyCardTitle>
            <DaisyBadge variant="secondary" className="text-xs">
              {filteredData.length} risks
            </DaisyBadge>
          </div>
          
          {showControls && (
            <div className="flex items-center space-x-1">
              <DaisyButton
                variant="ghost"
                size="sm"
                onClick={() => setViewMode(viewMode === 'heatmap' ? 'scatter' : 'heatmap')}
                className="p-2"
              >
                <Eye className="w-4 h-4" />
              </DaisyButton>
              
              <DaisyButton
                variant="ghost"
                size="sm"
                onClick={() => setShowTooltip(!showTooltip)}
                className="p-2"
              >
                <Settings className="w-4 h-4" />
              </DaisyButton>
              
              <DaisyButton
                variant="ghost"
                size="sm"
                onClick={exportHeatmap}
                className="p-2"
              >
                <Download className="w-4 h-4" />
              </DaisyButton>
              
              <DaisyButton
                variant="ghost"
                size="sm"
                onClick={resetView}
                className="p-2"
              >
                <RotateCcw className="w-4 h-4" />
              </DaisyButton>
              
              <DaisyButton
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2"
              >
                <Maximize2 className="w-4 h-4" />
              </DaisyButton>
            </div>
          )}
        </div>
        
        {/* Filters */}
        <div className="flex items-center space-x-4 mt-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <DaisySelect value={filterCategory} onValueChange={setFilterCategory}>
              <DaisySelectTrigger className="w-40">
                <DaisySelectValue placeholder="Category" />
              </DaisySelectTrigger>
              <DaisySelectContent>
                <DaisySelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <DaisySelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </DaisySelect>
            
            <DaisySelect value={filterStatus} onValueChange={setFilterStatus}>
              <DaisySelectTrigger className="w-32">
                <DaisySelectValue placeholder="Status" />
              </DaisySelectTrigger>
              <DaisySelectContent>
                <DaisySelectItem value="all">All Status</SelectItem>
                {statuses.map(status => (
                  <DaisySelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </DaisySelect>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">View:</span>
            <DaisyButton
              variant={viewMode === 'heatmap' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('heatmap')}
            >
              Heatmap
            </DaisyButton>
            <DaisyButton
              variant={viewMode === 'scatter' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('scatter')}
            >
              Scatter
            </DaisyButton>
          </div>
        </div>
      

      <DaisyCardContent>
        <DaisyTooltipProvider>
          {viewMode === 'heatmap' ? renderHeatmapGrid() : renderScatterPlot()}
        
        
        {/* Legend */}
        <div className="mt-4 flex items-center justify-center space-x-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">Risk Level:</span>
            {Object.entries(RISK_COLORS).map(([score, color]) => (
              <div key={score} className="flex items-center space-x-1">
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs">
                  {score === '1' ? 'Low' : 
                   score === '2' ? 'Low-Med' :
                   score === '3' ? 'Medium' :
                   score === '4' ? 'High' : 'Critical'}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Selected cell details */}
        {selectedCell && selectedCell.count > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">
                {selectedCell.label} - {selectedCell.count} Risk{selectedCell.count !== 1 ? 's' : ''}
              </h4>
              <DaisyButton
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCell(null)}
              >
                ×
              </DaisyButton>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {selectedCell.risks.map(risk => (
                <div
                  key={risk.id}
                  className="p-2 bg-white rounded border hover:shadow-sm cursor-pointer transition-shadow"
                  onClick={() => handleRiskSelect(risk)}
                >
                  <div className="font-medium text-sm truncate">{risk.title}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-600">{risk.category}</span>
                    <DaisyBadge variant="outline" className="text-xs">
                      {risk.status}
                    </DaisyBadge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DaisyCardContent>
    </DaisyCard>
  );
} 