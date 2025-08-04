import React, { useState, useMemo } from 'react';
// import { useRisks } from '@/context/RiskContext';
// import { Risk } from '@/types';
// import { calculateRiskScore, getRiskLevel, getRiskLevelColor } from '@/lib/utils';

// UI Components
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyButton } from '@/components/ui/DaisyButton';
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
  DialogTrigger,
} from '@/components/ui/dialog';

// Icons
import { Info, Maximize2 } from 'lucide-react';

interface RiskMatrixProps {
  onRiskClick?: (_risk: Risk) => void;
  selectedRisks?: string[];
  className?: string;
}

interface MatrixCell {
  likelihood: number;
  impact: number;
  riskScore: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  risks: Risk[];
}

export const RiskMatrix: React.FC<RiskMatrixProps> = ({
  onRiskClick,
  selectedRisks = [],
  className = '',
}) => {
  const { getFilteredRisks, updateRisk } = useRisks();
  const [draggedRisk, setDraggedRisk] = useState<Risk | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ likelihood: number; impact: number } | null>(null);

  const risks = getFilteredRisks();

  // Create 5x5 matrix data
  const matrixData = useMemo(() => {
    const matrix: MatrixCell[][] = [];
    
    for (let impact = 5; impact >= 1; impact--) {
      const row: MatrixCell[] = [];
      for (let likelihood = 1; likelihood <= 5; likelihood++) {
        const riskScore = calculateRiskScore(likelihood, impact);
        const level = getRiskLevel(riskScore);
        const cellRisks = risks.filter(risk => 
          risk.likelihood === likelihood && risk.impact === impact
        );
        
        row.push({
          likelihood,
          impact,
          riskScore,
          level,
          risks: cellRisks,
        });
      }
      matrix.push(row);
    }
    
    return matrix;
  }, [risks]);

  // Get cell background color based on risk level
  const getCellColor = (level: string, isHovered: boolean = false) => {
    const baseColors = {
      low: 'bg-green-100 border-green-200',
      medium: 'bg-yellow-100 border-yellow-200',
      high: 'bg-orange-100 border-orange-200',
      critical: 'bg-red-100 border-red-200',
    };
    
    const hoverColors = {
      low: 'bg-green-200 border-green-300',
      medium: 'bg-yellow-200 border-yellow-300',
      high: 'bg-orange-200 border-orange-300',
      critical: 'bg-red-200 border-red-300',
    };
    
    return isHovered ? hoverColors[level as keyof typeof hoverColors] : baseColors[level as keyof typeof baseColors];
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, risk: Risk) => {
    setDraggedRisk(risk);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, likelihood: number, impact: number) => {
    e.preventDefault();
    
    if (draggedRisk && (draggedRisk.likelihood !== likelihood || draggedRisk.impact !== impact)) {
      try {
        await updateRisk(draggedRisk.id, {
          ...draggedRisk,
          likelihood,
          impact,
          riskScore: calculateRiskScore(likelihood, impact),
        });
      } catch (error) {
        // console.error('Failed to update risk position:', error);
      }
    }
    
    setDraggedRisk(null);
    setHoveredCell(null);
  };

  const handleDragEnter = (likelihood: number, impact: number) => {
    setHoveredCell({ likelihood, impact });
  };

  const handleDragLeave = () => {
    setHoveredCell(null);
  };

  // Risk item component
  const RiskItem: React.FC<{ risk: Risk; isSelected: boolean }> = ({ risk, isSelected }) => (
    <DaisyTooltipProvider>
        <DaisyTooltip>
          <DaisyTooltipTrigger asChild>
            <div
            draggable
            onDragStart={(e) => handleDragStart(e, risk)}
            onClick={() => onRiskClick?.(risk)}
            className={`
              p-2 m-1 rounded text-xs cursor-pointer transition-all duration-200
              ${isSelected ? 'ring-2 ring-blue-500' : ''}
              ${getRiskLevelColor(getRiskLevel(risk.riskScore))}
              hover:shadow-md hover:scale-105
            `}
          >
            <div className="font-medium truncate">{risk.title}</div>
            <div className="text-xs opacity-75">{risk.owner}</div>
          </div>
        </DaisyTooltipProvider>
        <DaisyTooltipContent>
            <div className="max-w-xs">
            <div className="font-medium">{risk.title}</div>
            <div className="text-sm text-muted-foreground mt-1">{risk.description}</div>
            <div className="flex items-center gap-2 mt-2">
              <DaisyBadge variant="outline">{risk.category}</DaisyTooltipContent>
              <DaisyBadge variant="secondary">{risk.status}</DaisyBadge>
            </div>
            <div className="text-xs mt-1">
              Risk Score: {risk.riskScore} ({getRiskLevel(risk.riskScore).toUpperCase()})
            </div>
          </div>
        </DaisyTooltipContent>
      </DaisyTooltip>
    
  );

  // Matrix legend
  const MatrixLegend: React.FC = () => (
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
  );

  return (
    <DaisyCard className={className} >
  <DaisyCardBody >
</DaisyCard>
        <div className="flex items-center justify-between">
          <div>
            <DaisyCardTitle>Risk Matrix</DaisyCardTitle>
            <p className="text-sm text-muted-foreground">
              Drag risks to reposition them based on likelihood and impact
            </p>
          </div>
          <DaisyDialog >
              <DaisyDialogTrigger asChild >
                <DaisyButton variant="outline" size="sm" >
  <Maximize2 className="h-4 w-4 mr-2" />
</DaisyDialog>
                Full View
              </DaisyButton>
            </DaisyDialogTrigger>
            <DaisyDialogContent className="max-w-6xl" >
  <DaisyDialogHeader>
</DaisyDialogContent>
                <DaisyDialogTitle>Risk Matrix - Full View</DaisyDialogTitle>
                <DaisyDialogDescription >
  Interactive risk matrix showing all risks positioned by likelihood and impact
</DaisyDialogDescription>
                </DaisyDialogDescription>
              </DaisyDialogHeader>
              <div className="mt-4">
                <RiskMatrix onRiskClick={onRiskClick} selectedRisks={selectedRisks} />
              </div>
            </DaisyDialogContent>
          </DaisyDialog>
        </div>
      
      <DaisyCardBody >
  <div className="space-y-4">
</DaisyCardBody>
          {/* Matrix Legend */}
          <MatrixLegend />
          
          {/* Matrix Grid */}
          <div className="relative">
            {/* Impact Label (Y-axis) */}
            <div className="absolute -left-16 top-1/2 transform -translate-y-1/2 -rotate-90">
              <span className="text-sm font-medium text-muted-foreground">Impact</span>
            </div>
            
            {/* Likelihood Label (X-axis) */}
            <div className="text-center mb-2">
              <span className="text-sm font-medium text-muted-foreground">Likelihood</span>
            </div>
            
            {/* Matrix Table */}
            <div className="grid grid-cols-6 gap-1 border border-gray-300 rounded-lg p-2 bg-white">
              {/* Header Row */}
              <div className="text-center text-xs font-medium text-muted-foreground p-2"></div>
              {[1, 2, 3, 4, 5].map(likelihood => (
                <div key={likelihood} className="text-center text-xs font-medium text-muted-foreground p-2">
                  {likelihood}
                </div>
              ))}
              
              {/* Matrix Rows */}
              {matrixData.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  {/* Impact Label */}
                  <div className="text-center text-xs font-medium text-muted-foreground p-2">
                    {5 - rowIndex}
                  </div>
                  
                  {/* Matrix Cells */}
                  {row.map((cell) => {
                    const isHovered = hoveredCell?.likelihood === cell.likelihood && 
                                    hoveredCell?.impact === cell.impact;
                    
                    return (
                      <div
                        key={`${cell.likelihood}-${cell.impact}`}
                        className={`
                          min-h-24 border-2 rounded-lg p-1 transition-all duration-200
                          ${getCellColor(cell.level, isHovered)}
                          ${draggedRisk ? 'cursor-copy' : ''}
                        `}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, cell.likelihood, cell.impact)}
                        onDragEnter={() => handleDragEnter(cell.likelihood, cell.impact)}
                        onDragLeave={handleDragLeave}
                      >
                        {/* Cell Score */}
                        <div className="text-xs text-center font-medium mb-1">
                          {cell.riskScore}
                        </div>
                        
                        {/* Risks in Cell */}
                        <div className="space-y-1 max-h-20 overflow-y-auto">
                          {cell.risks.map(risk => (
                            <RiskItem
                              key={risk.id}
                              risk={risk}
                              isSelected={selectedRisks.includes(risk.id)} />
                          ))}
                        </div>
                        
                        {/* Risk Count */}
                        {cell.risks.length > 0 && (
                          <div className="text-xs text-center mt-1 opacity-75">
                            {cell.risks.length} risk{cell.risks.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            
            {/* Axis Labels */}
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Rare</span>
              <span>Unlikely</span>
              <span>Possible</span>
              <span>Likely</span>
              <span>Almost Certain</span>
            </div>
            
            <div className="absolute -right-20 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground">
              <span>Catastrophic</span>
              <span>Major</span>
              <span>Moderate</span>
              <span>Minor</span>
              <span>Insignificant</span>
            </div>
          </div>
          
          {/* Matrix Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {matrixData.flat().reduce((sum, cell) => sum + cell.risks.filter(r => getRiskLevel(r.riskScore) === 'critical').length, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {matrixData.flat().reduce((sum, cell) => sum + cell.risks.filter(r => getRiskLevel(r.riskScore) === 'high').length, 0)}
              </div>
              <div className="text-xs text-muted-foreground">High</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {matrixData.flat().reduce((sum, cell) => sum + cell.risks.filter(r => getRiskLevel(r.riskScore) === 'medium').length, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {matrixData.flat().reduce((sum, cell) => sum + cell.risks.filter(r => getRiskLevel(r.riskScore) === 'low').length, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Low</div>
            </div>
          </div>
          
          {/* Help Text */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">How to use the Risk Matrix:</p>
              <ul className="mt-1 space-y-1 text-xs">
                <li>• Drag risks to reposition them based on likelihood and impact</li>
                <li>• Click on risks to view details</li>
                <li>• Colors indicate risk levels: Green (Low), Yellow (Medium), Orange (High), Red (Critical)</li>
                <li>• Numbers in cells show the calculated risk score (Likelihood × Impact)</li>
              </ul>
            </div>
          </div>
        </div>
      </DaisyCardBody>
    </DaisyCard>
  );
}; 