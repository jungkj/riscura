'use client';

import { useMemo, useState, useRef } from 'react';
import { useRisks } from '@/context/RiskContext';
import { Risk } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Circle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
} from 'lucide-react';

interface BubbleData {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  risk: Risk;
}

interface RiskBubbleChartProps {
  className?: string;
  xAxis?: 'likelihood' | 'impact' | 'score' | 'timeline';
  yAxis?: 'likelihood' | 'impact' | 'score' | 'category';
  sizeBy?: 'impact' | 'likelihood' | 'score';
  colorBy?: 'level' | 'category' | 'owner' | 'status';
}

export const RiskBubbleChart: React.FC<RiskBubbleChartProps> = ({
  className = '',
  xAxis = 'likelihood',
  yAxis = 'impact',
  sizeBy = 'score',
  colorBy = 'level',
}) => {
  const { getFilteredRisks } = useRisks();
  const [selectedXAxis, setSelectedXAxis] = useState(xAxis);
  const [selectedYAxis, setSelectedYAxis] = useState(yAxis);
  const [selectedSizeBy, setSelectedSizeBy] = useState(sizeBy);
  const [selectedColorBy, setSelectedColorBy] = useState(colorBy);
  const [hoveredBubble, setHoveredBubble] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);

  const risks = getFilteredRisks();

  // Calculate bubble data
  const bubbleData = useMemo<BubbleData[]>(() => {
    const width = 600;
    const height = 400;
    const padding = 60;
    
    return risks.map((risk, index) => {
      // Calculate X position
      let xValue: number;
      switch (selectedXAxis) {
        case 'likelihood':
          xValue = risk.likelihood;
          break;
        case 'impact':
          xValue = risk.impact;
          break;
        case 'score':
          xValue = risk.riskScore;
          break;
        case 'timeline':
          xValue = new Date(risk.createdAt).getTime();
          break;
        default:
          xValue = risk.likelihood;
      }
      
      // Calculate Y position
      let yValue: number;
      switch (selectedYAxis) {
        case 'likelihood':
          yValue = risk.likelihood;
          break;
        case 'impact':
          yValue = risk.impact;
          break;
        case 'score':
          yValue = risk.riskScore;
          break;
        case 'category':
          // Map categories to numeric values
          const categories = ['operational', 'financial', 'strategic', 'compliance', 'technological'];
          yValue = categories.indexOf(risk.category?.toLowerCase() || '') + 1;
          break;
        default:
          yValue = risk.impact;
      }
      
      // Calculate size
      let sizeValue: number;
      switch (selectedSizeBy) {
        case 'impact':
          sizeValue = risk.impact;
          break;
        case 'likelihood':
          sizeValue = risk.likelihood;
          break;
        case 'score':
          sizeValue = risk.riskScore;
          break;
        default:
          sizeValue = risk.riskScore;
      }
      
      // Calculate color
      let color: string;
      switch (selectedColorBy) {
        case 'level':
          if (risk.riskScore >= 20) color = '#dc2626';
          else if (risk.riskScore >= 15) color = '#ea580c';
          else if (risk.riskScore >= 8) color = '#d97706';
          else color = '#16a34a';
          break;
        case 'category':
          const categoryColors: Record<string, string> = {
            'operational': '#3b82f6',
            'financial': '#ef4444',
            'strategic': '#10b981',
            'compliance': '#f59e0b',
            'technological': '#8b5cf6',
          };
          color = categoryColors[risk.category?.toLowerCase() || ''] || '#6b7280';
          break;
        case 'owner':
          // Generate color based on owner name hash
          const hash = risk.owner?.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
          }, 0) || 0;
          const hue = Math.abs(hash) % 360;
          color = `hsl(${hue}, 70%, 50%)`;
          break;
        case 'status':
          const statusColors: Record<string, string> = {
            'identified': '#f59e0b',
            'assessed': '#3b82f6',
            'mitigated': '#10b981',
            'closed': '#6b7280',
          };
          color = statusColors[risk.status || ''] || '#6b7280';
          break;
        default:
          color = '#3b82f6';
      }
      
      // Normalize positions to chart area
      const xRange = selectedXAxis === 'timeline' ? 
        { min: Math.min(...risks.map(r => new Date(r.createdAt).getTime())), 
          max: Math.max(...risks.map(r => new Date(r.createdAt).getTime())) } :
        selectedXAxis === 'score' ? { min: 0, max: 25 } : { min: 1, max: 5 };
      
      const yRange = selectedYAxis === 'score' ? { min: 0, max: 25 } : 
                     selectedYAxis === 'category' ? { min: 1, max: 5 } : { min: 1, max: 5 };
      
      const x = padding + ((xValue - xRange.min) / (xRange.max - xRange.min)) * (width - 2 * padding);
      const y = height - padding - ((yValue - yRange.min) / (yRange.max - yRange.min)) * (height - 2 * padding);
      
      // Normalize size (radius between 6 and 30)
      const sizeRange = selectedSizeBy === 'score' ? { min: 0, max: 25 } : { min: 1, max: 5 };
      const size = 6 + ((sizeValue - sizeRange.min) / (sizeRange.max - sizeRange.min)) * 24;
      
      return {
        id: risk.id,
        x,
        y,
        size,
        color,
        risk,
      };
    });
  }, [risks, selectedXAxis, selectedYAxis, selectedSizeBy, selectedColorBy]);

  // Axis labels and ticks
  const getAxisLabel = (axis: string) => {
    switch (axis) {
      case 'likelihood': return 'Likelihood';
      case 'impact': return 'Impact';
      case 'score': return 'Risk Score';
      case 'timeline': return 'Creation Date';
      case 'category': return 'Category';
      default: return axis;
    }
  };

  const getAxisTicks = (axis: string, isYAxis = false) => {
    const width = 600;
    const height = 400;
    const padding = 60;
    
    if (axis === 'timeline') {
      const dates = risks.map(r => new Date(r.createdAt).getTime());
      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);
      const tickCount = 5;
      const ticks = [];
      
      for (let i = 0; i <= tickCount; i++) {
        const timestamp = minDate + (maxDate - minDate) * (i / tickCount);
        const position = padding + (i / tickCount) * (width - 2 * padding);
        ticks.push({
          value: new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          position: isYAxis ? height - position : position,
        });
      }
      return ticks;
    }
    
    if (axis === 'score') {
      const maxScore = 25;
      const tickCount = 5;
      const ticks = [];
      
      for (let i = 0; i <= tickCount; i++) {
        const value = (maxScore / tickCount) * i;
        const position = padding + (i / tickCount) * ((isYAxis ? height : width) - 2 * padding);
        ticks.push({
          value: value.toString(),
          position: isYAxis ? height - position : position,
        });
      }
      return ticks;
    }
    
    if (axis === 'category') {
      const categories = ['Operational', 'Financial', 'Strategic', 'Compliance', 'Tech'];
      return categories.map((cat, i) => ({
        value: cat,
        position: isYAxis ? 
          height - padding - (i / (categories.length - 1)) * (height - 2 * padding) :
          padding + (i / (categories.length - 1)) * (width - 2 * padding),
      }));
    }
    
    // Default 1-5 scale
    return [1, 2, 3, 4, 5].map((value, i) => ({
      value: value.toString(),
      position: isYAxis ? 
        height - padding - (i / 4) * (height - 2 * padding) :
        padding + (i / 4) * (width - 2 * padding),
    }));
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Circle className="h-5 w-5" />
            Risk Bubble Chart
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetZoom}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-slate-600 mb-1 block">X-Axis</label>
            <Select value={selectedXAxis} onValueChange={setSelectedXAxis}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="likelihood">Likelihood</SelectItem>
                <SelectItem value="impact">Impact</SelectItem>
                <SelectItem value="score">Risk Score</SelectItem>
                <SelectItem value="timeline">Timeline</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-xs text-slate-600 mb-1 block">Y-Axis</label>
            <Select value={selectedYAxis} onValueChange={setSelectedYAxis}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="impact">Impact</SelectItem>
                <SelectItem value="likelihood">Likelihood</SelectItem>
                <SelectItem value="score">Risk Score</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-xs text-slate-600 mb-1 block">Size By</label>
            <Select value={selectedSizeBy} onValueChange={setSelectedSizeBy}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Risk Score</SelectItem>
                <SelectItem value="impact">Impact</SelectItem>
                <SelectItem value="likelihood">Likelihood</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-xs text-slate-600 mb-1 block">Color By</label>
            <Select value={selectedColorBy} onValueChange={setSelectedColorBy}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="level">Risk Level</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="relative overflow-hidden rounded-lg border bg-slate-50">
          <svg
            ref={svgRef}
            width="100%"
            height="400"
            viewBox="0 0 600 400"
            className="bg-white"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
          >
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* X-axis */}
            <line x1="60" y1="340" x2="540" y2="340" stroke="#e2e8f0" strokeWidth="2" />
            {getAxisTicks(selectedXAxis).map((tick, i) => (
              <g key={i}>
                <line x1={tick.position} y1="340" x2={tick.position} y2="345" stroke="#64748b" strokeWidth="1" />
                <text x={tick.position} y="360" textAnchor="middle" className="text-xs fill-slate-600">
                  {tick.value}
                </text>
              </g>
            ))}
            <text x="300" y="390" textAnchor="middle" className="text-sm font-medium fill-slate-700">
              {getAxisLabel(selectedXAxis)}
            </text>
            
            {/* Y-axis */}
            <line x1="60" y1="60" x2="60" y2="340" stroke="#e2e8f0" strokeWidth="2" />
            {getAxisTicks(selectedYAxis, true).map((tick, i) => (
              <g key={i}>
                <line x1="55" y1={tick.position} x2="60" y2={tick.position} stroke="#64748b" strokeWidth="1" />
                <text x="45" y={tick.position + 4} textAnchor="end" className="text-xs fill-slate-600">
                  {tick.value}
                </text>
              </g>
            ))}
            <text x="20" y="200" textAnchor="middle" className="text-sm font-medium fill-slate-700" transform="rotate(-90 20 200)">
              {getAxisLabel(selectedYAxis)}
            </text>
            
            {/* Bubbles */}
            <TooltipProvider>
              {bubbleData.map((bubble) => (
                <Tooltip key={bubble.id}>
                  <TooltipTrigger asChild>
                    <circle
                      cx={bubble.x}
                      cy={bubble.y}
                      r={bubble.size}
                      fill={bubble.color}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="cursor-pointer transition-all duration-200 hover:stroke-slate-400 hover:stroke-[3px]"
                      style={{
                        opacity: hoveredBubble && hoveredBubble !== bubble.id ? 0.3 : 0.8,
                      }}
                      onMouseEnter={() => setHoveredBubble(bubble.id)}
                      onMouseLeave={() => setHoveredBubble(null)}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div>
                      <div className="font-medium">{bubble.risk.title}</div>
                      <div className="text-sm text-slate-600 mt-1">{bubble.risk.description}</div>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                        <div>Risk Score: {bubble.risk.riskScore}</div>
                        <div>Owner: {bubble.risk.owner}</div>
                        <div>Category: {bubble.risk.category}</div>
                        <div>Status: {bubble.risk.status}</div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </svg>
        </div>
        
        {/* Legend */}
        <div className="mt-4 p-4 bg-slate-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-slate-700 mb-2">Size represents: {getAxisLabel(selectedSizeBy)}</div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Circle className="w-3 h-3 fill-slate-400" />
                  <span className="text-xs">Small</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="w-4 h-4 fill-slate-400" />
                  <span className="text-xs">Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="w-6 h-6 fill-slate-400" />
                  <span className="text-xs">Large</span>
                </div>
              </div>
            </div>
            
            <div>
              <div className="font-medium text-slate-700 mb-2">Color represents: {getAxisLabel(selectedColorBy)}</div>
              {selectedColorBy === 'level' && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-600"></div>
                    <span className="text-xs">Low</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
                    <span className="text-xs">Medium</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-orange-600"></div>
                    <span className="text-xs">High</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-600"></div>
                    <span className="text-xs">Critical</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 