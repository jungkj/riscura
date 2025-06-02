'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useRisks } from '@/context/RiskContext';
import { Risk } from '@/types';
import { calculateRiskScore, getRiskLevel, getRiskLevelColor } from '@/lib/utils';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Icons
import { 
  Download, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Filter,
  Eye,
  Grid3X3,
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  Settings
} from 'lucide-react';

interface EnhancedRiskMatrixProps {
  onRiskClick?: (risk: Risk) => void;
  selectedRisks?: string[];
  className?: string;
  viewMode?: 'matrix' | 'heatmap' | 'density';
  showLabels?: boolean;
  enableClustering?: boolean;
  enableExport?: boolean;
}

interface MatrixCell {
  likelihood: number;
  impact: number;
  riskScore: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  risks: Risk[];
  density: number;
  clustered: boolean;
}

interface ViewSettings {
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  showLabels: boolean;
  animationsEnabled: boolean;
}

export const EnhancedRiskMatrix: React.FC<EnhancedRiskMatrixProps> = ({
  onRiskClick,
  selectedRisks = [],
  className = '',
  viewMode = 'matrix',
  showLabels = true,
  enableClustering = true,
  enableExport = true,
}) => {
  const { getFilteredRisks, updateRisk } = useRisks();
  const matrixRef = useRef<HTMLDivElement>(null);
  
  // State management
  const [draggedRisk, setDraggedRisk] = useState<Risk | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ likelihood: number; impact: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [viewSettings, setViewSettings] = useState<ViewSettings>({
    zoom: 1,
    panX: 0,
    panY: 0,
    showGrid: true,
    showLabels: true,
    animationsEnabled: true,
  });
  const [selectedCell, setSelectedCell] = useState<MatrixCell | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const risks = getFilteredRisks();

  // Enhanced matrix data with clustering and density calculations
  const matrixData = useMemo(() => {
    const matrix: MatrixCell[][] = [];
    const maxRisksInCell = Math.max(...Array.from({ length: 25 }, (_, i) => {
      const likelihood = (i % 5) + 1;
      const impact = Math.floor(i / 5) + 1;
      return risks.filter(risk => risk.likelihood === likelihood && risk.impact === impact).length;
    }), 1);
    
    for (let impact = 5; impact >= 1; impact--) {
      const row: MatrixCell[] = [];
      for (let likelihood = 1; likelihood <= 5; likelihood++) {
        const riskScore = calculateRiskScore(likelihood, impact);
        const level = getRiskLevel(riskScore);
        const cellRisks = risks.filter(risk => 
          risk.likelihood === likelihood && risk.impact === impact
        );
        const density = cellRisks.length / maxRisksInCell;
        const clustered = enableClustering && cellRisks.length > 3;
        
        row.push({
          likelihood,
          impact,
          riskScore,
          level,
          risks: cellRisks,
          density,
          clustered,
        });
      }
      matrix.push(row);
    }
    
    return matrix;
  }, [risks, enableClustering]);

  // Enhanced cell styling based on view mode
  const getCellStyle = useCallback((cell: MatrixCell, isHovered: boolean = false) => {
    const baseOpacity = cell.density * 0.8 + 0.2;
    
    if (viewMode === 'heatmap') {
      const intensity = Math.min(cell.risks.length / 5, 1);
      return {
        backgroundColor: `hsl(${cell.level === 'critical' ? '0' : cell.level === 'high' ? '25' : cell.level === 'medium' ? '48' : '142'}, 70%, ${85 - intensity * 30}%)`,
        borderColor: `hsl(${cell.level === 'critical' ? '0' : cell.level === 'high' ? '25' : cell.level === 'medium' ? '48' : '142'}, 70%, ${70 - intensity * 20}%)`,
        opacity: isHovered ? 1 : baseOpacity,
      };
    }
    
    if (viewMode === 'density') {
      const hue = cell.risks.length === 0 ? 200 : Math.max(0, 120 - (cell.risks.length * 30));
      return {
        backgroundColor: `hsl(${hue}, 70%, 85%)`,
        borderColor: `hsl(${hue}, 70%, 70%)`,
        opacity: isHovered ? 1 : baseOpacity,
      };
    }
    
    // Default matrix view
    const colors = {
      low: { bg: 'rgb(220, 252, 231)', border: 'rgb(187, 247, 208)', hover: 'rgb(187, 247, 208)' },
      medium: { bg: 'rgb(254, 249, 195)', border: 'rgb(254, 240, 138)', hover: 'rgb(254, 240, 138)' },
      high: { bg: 'rgb(255, 237, 213)', border: 'rgb(253, 186, 116)', hover: 'rgb(253, 186, 116)' },
      critical: { bg: 'rgb(254, 226, 226)', border: 'rgb(252, 165, 165)', hover: 'rgb(252, 165, 165)' },
    };
    
    const color = colors[cell.level];
    return {
      backgroundColor: isHovered ? color.hover : color.bg,
      borderColor: color.border,
      opacity: baseOpacity,
    };
  }, [viewMode]);

  // Drag and drop handlers with enhanced feedback
  const handleDragStart = useCallback((e: React.DragEvent, risk: Risk) => {
    setDraggedRisk(risk);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', risk.id);
    
    // Create custom drag image
    const dragImage = document.createElement('div');
    dragImage.innerHTML = risk.title;
    dragImage.style.cssText = `
      position: absolute; top: -1000px; left: -1000px;
      padding: 8px 12px; background: white; border: 2px solid #3b82f6;
      border-radius: 8px; font-size: 12px; font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 60, 20);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, likelihood: number, impact: number) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (draggedRisk && (draggedRisk.likelihood !== likelihood || draggedRisk.impact !== impact)) {
      try {
        const newRiskScore = calculateRiskScore(likelihood, impact);
        await updateRisk(draggedRisk.id, {
          ...draggedRisk,
          likelihood,
          impact,
          riskScore: newRiskScore,
        });
      } catch (error) {
        console.error('Failed to update risk position:', error);
      }
    }
    
    setDraggedRisk(null);
    setHoveredCell(null);
  }, [draggedRisk, updateRisk]);

  const handleDragEnter = useCallback((likelihood: number, impact: number) => {
    if (isDragging) {
      setHoveredCell({ likelihood, impact });
    }
  }, [isDragging]);

  const handleDragLeave = useCallback(() => {
    setHoveredCell(null);
  }, []);

  // Export functionality
  const exportToPNG = useCallback(async () => {
    if (!matrixRef.current || isExporting) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(matrixRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      
      const link = document.createElement('a');
      link.download = `risk-matrix-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Export to PNG failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [isExporting]);

  const exportToPDF = useCallback(async () => {
    if (!matrixRef.current || isExporting) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(matrixRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`risk-matrix-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Export to PDF failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [isExporting]);

  const exportToSVG = useCallback(() => {
    // SVG export implementation would go here
    console.log('SVG export not yet implemented');
  }, []);

  // View controls
  const handleZoomIn = useCallback(() => {
    setViewSettings(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 3) }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setViewSettings(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.2, 0.5) }));
  }, []);

  const handleResetView = useCallback(() => {
    setViewSettings({
      zoom: 1,
      panX: 0,
      panY: 0,
      showGrid: true,
      showLabels: true,
      animationsEnabled: true,
    });
  }, []);

  // Risk clustering component
  const RiskCluster: React.FC<{ risks: Risk[]; cell: MatrixCell }> = ({ risks, cell }) => {
    if (!cell.clustered) {
      return (
        <>
          {risks.map((risk, index) => (
            <RiskItem key={risk.id} risk={risk} isSelected={selectedRisks.includes(risk.id)} />
          ))}
        </>
      );
    }

    return (
      <div className="relative">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-700">
              {risks.length}
            </div>
            <div className="text-xs text-slate-500">risks</div>
          </div>
        </div>
        <Button
          size="sm"
          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setSelectedCell(cell)}
        >
          <Eye className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  // Enhanced risk item component
  const RiskItem: React.FC<{ risk: Risk; isSelected: boolean }> = ({ risk, isSelected }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, risk)}
            onClick={() => onRiskClick?.(risk)}
            className={`
              p-2 m-0.5 rounded-lg text-xs cursor-pointer transition-all duration-200
              transform hover:scale-105 hover:shadow-lg
              ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
              ${getRiskLevelColor(getRiskLevel(risk.riskScore))}
              ${viewSettings.animationsEnabled ? 'animate-fade-in-up' : ''}
            `}
            style={{
              animationDelay: `${Math.random() * 200}ms`,
            }}
          >
            <div className="font-medium truncate">{risk.title}</div>
            <div className="text-xs opacity-75 truncate">{risk.owner}</div>
            <div className="flex items-center justify-between mt-1">
              <Badge className="text-xs px-1 py-0" variant="secondary">
                {risk.riskScore}
              </Badge>
              <div className="text-xs opacity-50">
                {risk.likelihood}×{risk.impact}
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div>
            <div className="font-medium">{risk.title}</div>
            <div className="text-sm text-slate-600 mt-1 line-clamp-2">{risk.description}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">{risk.category}</Badge>
              <Badge variant="secondary" className="text-xs">{risk.status}</Badge>
            </div>
            <div className="text-xs mt-2 text-slate-500">
              Risk Score: {risk.riskScore} ({getRiskLevel(risk.riskScore).toUpperCase()})
            </div>
            <div className="text-xs text-slate-500">
              Last Updated: {new Date(risk.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="space-y-4">
      {/* Enhanced Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={viewSettings.zoom >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={viewSettings.zoom <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetView}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <div className="text-sm text-slate-600 px-2">
              Zoom: {Math.round(viewSettings.zoom * 100)}%
            </div>
          </div>

          {enableExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isExporting}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportToPNG}>
                  Export as PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF}>
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToSVG}>
                  Export as SVG
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </Card>

      {/* Enhanced Matrix */}
      <Card className={className}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5" />
              Risk Matrix
              <Badge variant="secondary" className="ml-2">
                {risks.length} risks
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {viewMode === 'matrix' ? 'Matrix View' : 
                 viewMode === 'heatmap' ? 'Heatmap View' : 'Density View'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div 
            ref={matrixRef}
            className="relative overflow-hidden rounded-lg border"
            style={{
              transform: `scale(${viewSettings.zoom}) translate(${viewSettings.panX}px, ${viewSettings.panY}px)`,
              transformOrigin: 'center center',
              transition: viewSettings.animationsEnabled ? 'transform 0.3s ease-out' : 'none',
            }}
          >
            {/* Impact labels (left side) */}
            <div className="absolute left-0 top-12 bottom-0 w-16 flex flex-col-reverse">
              {[1, 2, 3, 4, 5].map(impact => (
                <div key={impact} className="flex-1 flex items-center justify-center text-sm font-medium text-slate-600">
                  {impact}
                </div>
              ))}
              <div className="absolute -left-6 top-1/2 -rotate-90 transform -translate-y-1/2 text-sm font-bold text-slate-700 whitespace-nowrap">
                IMPACT
              </div>
            </div>

            {/* Likelihood labels (bottom) */}
            <div className="absolute bottom-0 left-16 right-0 h-12 flex">
              {[1, 2, 3, 4, 5].map(likelihood => (
                <div key={likelihood} className="flex-1 flex items-center justify-center text-sm font-medium text-slate-600">
                  {likelihood}
                </div>
              ))}
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-sm font-bold text-slate-700">
                LIKELIHOOD
              </div>
            </div>

            {/* Matrix grid */}
            <div className="ml-16 mb-12 grid grid-cols-5 gap-1 bg-slate-100 p-2 rounded">
              {matrixData.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const isHovered = hoveredCell?.likelihood === cell.likelihood && hoveredCell?.impact === cell.impact;
                  const isDragTarget = draggedRisk && isHovered;
                  
                  return (
                    <div
                      key={`${cell.likelihood}-${cell.impact}`}
                      className={`
                        relative min-h-24 border-2 rounded-lg p-2 transition-all duration-200 group
                        ${isDragTarget ? 'ring-2 ring-blue-500 scale-105' : ''}
                        ${cell.clustered ? 'cursor-pointer' : ''}
                      `}
                      style={getCellStyle(cell, Boolean(isHovered || isDragTarget))}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, cell.likelihood, cell.impact)}
                      onDragEnter={() => handleDragEnter(cell.likelihood, cell.impact)}
                      onDragLeave={handleDragLeave}
                    >
                      {/* Cell content */}
                      <div className="h-full flex flex-col">
                        {/* Risk score indicator */}
                        <div className="absolute top-1 left-1 text-xs font-bold text-slate-500">
                          {cell.riskScore}
                        </div>
                        
                        {/* Density indicator for heatmap/density views */}
                        {(viewMode === 'heatmap' || viewMode === 'density') && cell.risks.length > 0 && (
                          <div className="absolute top-1 right-1 text-xs font-bold text-slate-700">
                            {cell.risks.length}
                          </div>
                        )}
                        
                        {/* Risk items or cluster */}
                        <div className="flex-1 flex flex-col justify-center overflow-hidden">
                          <RiskCluster risks={cell.risks} cell={cell} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Enhanced Legend */}
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                  <span>Low (1-6)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
                  <span>Medium (8-12)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded"></div>
                  <span>High (15-20)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                  <span>Critical (25)</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {(['critical', 'high', 'medium', 'low'] as const).map(level => {
                  const count = matrixData.flat().reduce((sum, cell) => 
                    sum + cell.risks.filter(r => getRiskLevel(r.riskScore) === level).length, 0
                  );
                  const colors = {
                    critical: 'text-red-600',
                    high: 'text-orange-600',
                    medium: 'text-yellow-600',
                    low: 'text-green-600',
                  };
                  
                  return (
                    <div key={level} className="text-center">
                      <div className={`text-xl font-bold ${colors[level]}`}>
                        {count}
                      </div>
                      <div className="text-xs text-slate-600 capitalize">{level}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cell Detail Dialog */}
      <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Cell Details - Likelihood: {selectedCell?.likelihood}, Impact: {selectedCell?.impact}
            </DialogTitle>
            <DialogDescription>
              Risk Score: {selectedCell?.riskScore} ({selectedCell?.level.toUpperCase()})
            </DialogDescription>
          </DialogHeader>
          
          {selectedCell && (
            <div className="space-y-4">
              <div className="grid gap-2">
                {selectedCell.risks.map(risk => (
                  <div
                    key={risk.id}
                    className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => {
                      onRiskClick?.(risk);
                      setSelectedCell(null);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{risk.title}</div>
                        <div className="text-sm text-slate-600">{risk.description}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{risk.category}</Badge>
                          <Badge variant="secondary" className="text-xs">{risk.status}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{risk.riskScore}</div>
                        <div className="text-xs text-slate-500">{risk.owner}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}; 