'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyTooltip, DaisyTooltipContent, DaisyTooltipTrigger, DaisyTooltipWrapper } from '@/components/ui/DaisyTooltip';
import { 
import { DaisyCardTitle } from '@/components/ui/daisy-components';
  Activity, 
  Filter, 
  Maximize2, 
  RotateCcw,
  Eye,
  AlertTriangle,
  Shield,
  Target
} from 'lucide-react';

interface HeatmapCell {
  id: string;
  x: number; // likelihood (1-5)
  y: number; // impact (1-5)
  value: number; // risk count
  risks: RiskItem[];
  riskScore: number; // average risk score for this cell
}

interface RiskItem {
  id: string;
  title: string;
  category: 'operational' | 'financial' | 'strategic' | 'compliance' | 'technology';
  impact: number;
  likelihood: number;
  riskScore: number;
  status: 'open' | 'mitigated' | 'monitoring' | 'closed';
  owner: string;
}

interface InteractiveHeatmapProps {
  data?: RiskItem[];
  showLegend?: boolean;
  interactive?: boolean;
  onCellClick?: (cell: HeatmapCell) => void;
  onRiskClick?: (_risk: RiskItem) => void;
  className?: string;
}

const defaultRisks: RiskItem[] = [
  {
    id: 'risk-001',
    title: 'Data Breach Vulnerability',
    category: 'technology',
    impact: 5,
    likelihood: 3,
    riskScore: 15,
    status: 'open',
    owner: 'IT Security Team'
  },
  {
    id: 'risk-002',
    title: 'Regulatory Compliance Gap',
    category: 'compliance',
    impact: 4,
    likelihood: 4,
    riskScore: 16,
    status: 'monitoring',
    owner: 'Compliance Team'
  },
  {
    id: 'risk-003',
    title: 'Market Volatility Impact',
    category: 'financial',
    impact: 3,
    likelihood: 4,
    riskScore: 12,
    status: 'mitigated',
    owner: 'Finance Team'
  },
  {
    id: 'risk-004',
    title: 'Supply Chain Disruption',
    category: 'operational',
    impact: 4,
    likelihood: 2,
    riskScore: 8,
    status: 'monitoring',
    owner: 'Operations Team'
  },
  {
    id: 'risk-005',
    title: 'Strategic Partnership Risk',
    category: 'strategic',
    impact: 3,
    likelihood: 3,
    riskScore: 9,
    status: 'open',
    owner: 'Strategy Team'
  },
  {
    id: 'risk-006',
    title: 'System Downtime Risk',
    category: 'technology',
    impact: 2,
    likelihood: 3,
    riskScore: 6,
    status: 'mitigated',
    owner: 'IT Operations'
  },
  {
    id: 'risk-007',
    title: 'Fraud Detection Gap',
    category: 'financial',
    impact: 4,
    likelihood: 2,
    riskScore: 8,
    status: 'open',
    owner: 'Risk Management'
  },
  {
    id: 'risk-008',
    title: 'Talent Retention Risk',
    category: 'operational',
    impact: 3,
    likelihood: 4,
    riskScore: 12,
    status: 'monitoring',
    owner: 'HR Team'
  },
  {
    id: 'risk-009',
    title: 'Cyber Attack Risk',
    category: 'technology',
    impact: 5,
    likelihood: 2,
    riskScore: 10,
    status: 'open',
    owner: 'Security Team'
  },
  {
    id: 'risk-010',
    title: 'Vendor Risk',
    category: 'operational',
    impact: 2,
    likelihood: 3,
    riskScore: 6,
    status: 'monitoring',
    owner: 'Procurement'
  }
];

const categoryColors = {
  operational: '#f59e0b',
  financial: '#ef4444',
  strategic: '#8b5cf6',
  compliance: '#10b981',
  technology: '#3b82f6'
}

const statusColors = {
  open: '#ef4444',
  mitigated: '#10b981',
  monitoring: '#f59e0b',
  closed: '#6b7280'
}

export const InteractiveHeatmap: React.FC<InteractiveHeatmapProps> = ({
  data = defaultRisks,
  showLegend = true,
  interactive = true,
  onCellClick,
  onRiskClick,
  className
}) => {
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Generate heatmap data
  const heatmapData = useMemo(() => {
    const cells: HeatmapCell[] = []
    
    // Create 5x5 grid
    for (let impact = 1; impact <= 5; impact++) {
      for (let likelihood = 1; likelihood <= 5; likelihood++) {
        const cellRisks = data.filter(risk => {
          const matchesPosition = risk.impact === impact && risk.likelihood === likelihood;
          const matchesCategory = !filterCategory || risk.category === filterCategory;
          const matchesStatus = !filterStatus || risk.status === filterStatus;
          return matchesPosition && matchesCategory && matchesStatus;
        });

        const avgRiskScore = cellRisks.length > 0 
          ? cellRisks.reduce((sum, risk) => sum + risk.riskScore, 0) / cellRisks.length 
          : 0;

        cells.push({
          id: `${likelihood}-${impact}`,
          x: likelihood,
          y: impact,
          value: cellRisks.length,
          risks: cellRisks,
          riskScore: avgRiskScore
        });
      }
    }
    
    return cells;
  }, [data, filterCategory, filterStatus]);

  const maxValue = Math.max(...heatmapData.map(cell => cell.value));

  const getCellColor = (cell: HeatmapCell) => {
    if (cell.value === 0) return '#f9fafb'; // gray-50
    
    const intensity = cell.value / Math.max(maxValue, 1);
    const riskLevel = cell.x * cell.y; // likelihood * impact
    
    if (riskLevel >= 20) return `rgba(239, 68, 68, ${0.3 + intensity * 0.7})`; // red
    if (riskLevel >= 15) return `rgba(245, 158, 11, ${0.3 + intensity * 0.7})`; // amber
    if (riskLevel >= 10) return `rgba(59, 130, 246, ${0.3 + intensity * 0.7})`; // blue
    return `rgba(16, 185, 129, ${0.3 + intensity * 0.7})`; // emerald
  }

  const getCellBorderColor = (cell: HeatmapCell) => {
    const riskLevel = cell.x * cell.y;
    if (riskLevel >= 20) return '#dc2626'; // red-600
    if (riskLevel >= 15) return '#d97706'; // amber-600
    if (riskLevel >= 10) return '#2563eb'; // blue-600
    return '#059669'; // emerald-600
  }

  const getRiskLevelLabel = (x: number, y: number) => {
    const riskLevel = x * y;
    if (riskLevel >= 20) return 'Critical';
    if (riskLevel >= 15) return 'High';
    if (riskLevel >= 10) return 'Medium';
    return 'Low';
  }

  const _categories = [...new Set(data.map(risk => risk.category))];
  const statuses = [...new Set(data.map(risk => risk.status))];

  return (
    <DaisyCard className={`bg-[#FAFAFA] border-gray-200 ${className}`}>
      <DaisyCardBody >
  <div className="flex items-center justify-between">
</DaisyCard>
          <DaisyCardTitle className="flex items-center gap-2" >
  <Activity className="h-5 w-5 text-[#199BEC]" />
</DaisyCardTitle>
            Risk Heatmap
          </DaisyCardTitle>
          <div className="flex items-center gap-2">
            <DaisyButton
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterCategory(null);
                setFilterStatus(null);
                setSelectedCell(null);
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </DaisyButton>
            <DaisyButton variant="outline" size="sm" >
  <Maximize2 className="h-4 w-4" />
</DaisyButton>
            </DaisyButton>
          </div>
        </div>
      
      <DaisyCardBody >
  <div className="space-y-6">
</DaisyCardBody>
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Category:</span>
              <DaisyButton
                variant={filterCategory === null ? "primary" : "outline"}
                size="sm"
                onClick={() =>
          setFilterCategory(null)} />
                All
              
        </DaisyButton>
              {categories.map(category => (
                <DaisyButton
                  key={category}
                  variant={filterCategory === category ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setFilterCategory(category)}
                  className="capitalize" />
                  <div 
                    className="w-2 h-2 rounded-full mr-2" 
                    style={{ backgroundColor: categoryColors[category as keyof typeof categoryColors] }} />
                  {category}
                </DaisyButton>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <DaisyButton
                variant={filterStatus === null ? "primary" : "outline"}
                size="sm"
                onClick={() =>
          setFilterStatus(null)} />
                All
              
        </DaisyButton>
              {statuses.map(status => (
                <DaisyButton
                  key={status}
                  variant={filterStatus === status ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className="capitalize" />
                  <div 
                    className="w-2 h-2 rounded-full mr-2" 
                    style={{ backgroundColor: statusColors[status as keyof typeof statusColors] }} />
                  {status}
                </DaisyButton>
              ))}
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="bg-white rounded-lg border border-gray-100 p-6">
            <div className="relative">
              {/* Axis Labels */}
              <div className="absolute -left-16 top-1/2 transform -translate-y-1/2 -rotate-90 text-sm font-medium text-gray-600">
                Impact →
              </div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8 text-sm font-medium text-gray-600">
                Likelihood →
              </div>

              {/* Grid */}
              <div className="grid grid-cols-5 gap-1 w-fit mx-auto">
                {/* Y-axis labels (Impact - reversed order for visual consistency) */}
                <div className="col-span-5 grid grid-cols-5 gap-1 mb-2">
                  <div /> {/* Empty corner */}
                  {[1, 2, 3, 4, 5].map(likelihood => (
                    <div key={likelihood} className="text-center text-sm font-medium text-gray-600 py-2">
                      {likelihood}
                    </div>
                  ))}
                </div>

                {[5, 4, 3, 2, 1].map(impact => (
                  <React.Fragment key={impact}>
                    {/* Y-axis label */}
                    <div className="flex items-center justify-center text-sm font-medium text-gray-600 pr-2">
                      {impact}
                    </div>
                    
                    {/* Row cells */}
                    {[1, 2, 3, 4, 5].map(likelihood => {
                      const cell = heatmapData.find(c => c.x === likelihood && c.y === impact);
                      if (!cell) return null;

                      return (
                        <DaisyTooltipProvider key={cell.id}>
                            <DaisyTooltip>
                              <DaisyTooltipTrigger asChild>
                                <motion.div
                                className={`w-16 h-16 border-2 rounded-lg cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
                                  interactive ? 'hover:scale-105 hover:shadow-lg' : ''
                                } ${selectedCell?.id === cell.id ? 'ring-2 ring-[#199BEC]' : ''}`}
                                style={{
                                  backgroundColor: getCellColor(cell),
                                  borderColor: cell.value > 0 ? getCellBorderColor(cell) : '#e5e7eb'
                                }}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: (impact + likelihood) * 0.05 }}
                                onClick={() => {
                                  if (interactive && cell.value > 0) {
                                    setSelectedCell(selectedCell?.id === cell.id ? null : cell);
                                    onCellClick?.(cell);
                                  }
                                }}
                              >
                                {cell.value > 0 && (
                                  <>
                                    <div className="text-lg font-bold text-gray-900">
                                      {cell.value}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      {getRiskLevelLabel(likelihood, impact)}
                                    </div>
                                  </>
                                )}
                              </motion.div>
                            </DaisyTooltipProvider>
                            <DaisyTooltipContent className="max-w-xs">
                                <div className="space-y-2">
                                <div className="font-semibold">
                                  Impact: {impact} | Likelihood: {likelihood}
                                </div>
                                <div className="text-sm">
                                  <span className="font-medium">Risk Level:</span> {getRiskLevelLabel(likelihood, impact)}
                                </div>
                                <div className="text-sm">
                                  <span className="font-medium">Risks:</span> {cell.value}
                                </div>
                                {cell.value > 0 && (
                                  <div className="text-sm">
                                    <span className="font-medium">Avg Score:</span> {cell.riskScore.toFixed(1)}
                                  </div>
                                )}
                                {cell.risks.length > 0 && (
                                  <div className="text-sm">
                                    <span className="font-medium">Top Risk:</span> {cell.risks[0].title}
                                  </div>
                                )}
                              </div>
                            </DaisyTooltipContent>
                          </DaisyTooltip>
                        
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>

              {/* Risk Level Zones Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Critical Zone */}
                <div className="absolute top-0 right-0 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                  Critical Zone
                </div>
                
                {/* Low Risk Zone */}
                <div className="absolute bottom-0 left-16 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                  Low Risk Zone
                </div>
              </div>
            </div>
          </div>

          {/* Selected Cell Details */}
          {Boolean(selectedCell) && selectedCell.value > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-lg border border-gray-100 p-4"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[#191919]">
                    Cell Details: Impact {selectedCell.y} × Likelihood {selectedCell.x}
                  </h3>
                  <DaisyButton
                    variant="ghost"
                    size="sm"
                    onClick={() =>
          setSelectedCell(null)} />
                    ×
                  
        </DaisyButton>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-[#191919]">
                      {selectedCell.value}
                    </div>
                    <div className="text-sm text-gray-600">Total Risks</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-[#191919]">
                      {selectedCell.riskScore.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Avg Score</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold" style={{ color: getCellBorderColor(selectedCell) }}>
                      {getRiskLevelLabel(selectedCell.x, selectedCell.y)}
                    </div>
                    <div className="text-sm text-gray-600">Risk Level</div>
                  </div>
                </div>

                {/* Risk List */}
                <div className="space-y-2">
                  <h4 className="font-medium text-[#191919]">Risks in this cell:</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedCell.risks.map(risk => (
                      <div
                        key={risk.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => onRiskClick?.(risk)}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: categoryColors[risk.category] }} />
                          <span className="font-medium text-sm">{risk.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DaisyBadge 
                            variant="secondary"
                            style={{ 
                              backgroundColor: statusColors[risk.status] + '20',
                              color: statusColors[risk.status]
                            }}
                          >
                            {risk.status}
                          </DaisyBadge>
                          <span className="text-sm font-medium">{risk.riskScore}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Legend */}
          {Boolean(showLegend) && (
            <div className="grid grid-cols-2 gap-6">
              {/* Risk Levels */}
              <div>
                <h4 className="font-medium text-[#191919] mb-3">Risk Levels</h4>
                <div className="space-y-2">
                  {[
                    { level: 'Critical', color: '#dc2626', range: '20-25' },
                    { level: 'High', color: '#d97706', range: '15-19' },
                    { level: 'Medium', color: '#2563eb', range: '10-14' },
                    { level: 'Low', color: '#059669', range: '1-9' }
                  ].map(item => (
                    <div key={item.level} className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-medium">{item.level}</span>
                      <span className="text-sm text-gray-500">({item.range})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <h4 className="font-medium text-[#191919] mb-3">Categories</h4>
                <div className="space-y-2">
                  {Object.entries(categoryColors).map(([category, color]) => (
                    <div key={category} className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: color }} />
                      <span className="text-sm font-medium capitalize">{category}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DaisyCardBody>
    </DaisyCard>
  );
} 