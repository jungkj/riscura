'use client';

import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ContentCard } from '@/components/layout/MainContentArea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Target,
  Move,
  Edit,
  Save,
  X,
  AlertTriangle,
  Shield,
  CheckCircle,
  BarChart3,
  FileText,
  Users,
  Calendar,
  TrendingUp,
} from 'lucide-react';

// Types
interface RiskPosition {
  id: string;
  title: string;
  impact: number; // 1-5
  likelihood: number; // 1-5
  x: number; // Grid position
  y: number; // Grid position
  category: string;
  status: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface RiskEvaluation {
  id: string;
  title: string;
  description: string;
  category: string;
  impactCriteria: {
    financial: number;
    operational: number;
    reputational: number;
    regulatory: number;
  };
  likelihoodCriteria: {
    frequency: number;
    probability: number;
    controls: number;
  };
  overallImpact: number;
  overallLikelihood: number;
  riskScore: number;
  treatment: 'accept' | 'mitigate' | 'transfer' | 'avoid';
  owner: string;
  dueDate: Date;
}

// Sample risk positions for matrix
const sampleRiskPositions: RiskPosition[] = [
  {
    id: 'RSK-001',
    title: 'Data breach via vendor',
    impact: 5,
    likelihood: 4,
    x: 4, // likelihood position
    y: 1, // impact position (inverted for grid)
    category: 'Data Security',
    status: 'open',
    riskLevel: 'critical',
  },
  {
    id: 'RSK-002',
    title: 'Unauthorized system access',
    impact: 4,
    likelihood: 3,
    x: 3,
    y: 2,
    category: 'Access Control',
    status: 'in-progress',
    riskLevel: 'high',
  },
  {
    id: 'RSK-003',
    title: 'Data retention violation',
    impact: 3,
    likelihood: 2,
    x: 2,
    y: 3,
    category: 'Compliance',
    status: 'monitoring',
    riskLevel: 'medium',
  },
];

// Risk level determination based on impact/likelihood
const getRiskLevel = (impact: number, likelihood: number): 'low' | 'medium' | 'high' | 'critical' => {
  const score = impact * likelihood;
  if (score >= 20) return 'critical';
  if (score >= 15) return 'high';
  if (score >= 6) return 'medium';
  return 'low';
};

// Risk color configuration
const getRiskColor = (level: string) => {
  const colors = {
    'critical': 'bg-semantic-error/20 border-semantic-error text-semantic-error',
    'high': 'bg-semantic-warning/20 border-semantic-warning text-semantic-warning',
    'medium': 'bg-interactive-primary/20 border-interactive-primary text-interactive-primary',
    'low': 'bg-semantic-success/20 border-semantic-success text-semantic-success',
  };
  return colors[level as keyof typeof colors] || colors.medium;
};

// Matrix Cell Component
const MatrixCell: React.FC<{
  impact: number;
  likelihood: number;
  risks: RiskPosition[];
  onRiskMove: (riskId: string, newImpact: number, newLikelihood: number) => void;
  onRiskClick: (risk: RiskPosition) => void;
}> = ({ impact, likelihood, risks, onRiskMove, onRiskClick }) => {
  const cellRisks = risks.filter(r => r.x === likelihood && r.y === impact);
  const riskLevel = getRiskLevel(6 - impact, likelihood); // Invert impact for display

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const riskId = e.dataTransfer.getData('text/plain');
    onRiskMove(riskId, 6 - impact, likelihood);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className={cn(
        "border border-border p-enterprise-2 min-h-16 relative transition-colors",
        getRiskColor(riskLevel).replace('text-', 'hover:bg-').replace('/20', '/10')
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Risk Level Indicator */}
      <div className="absolute top-1 right-1">
        <div className={cn("h-2 w-2 rounded-full", getRiskColor(riskLevel).split(' ')[0])}>
        </div>
      </div>

      {/* Risks in this cell */}
      <div className="space-y-enterprise-1">
        {cellRisks.map((risk) => (
          <div
            key={risk.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', risk.id);
            }}
            onClick={() => onRiskClick(risk)}
            className={cn(
              "p-enterprise-2 rounded border text-caption cursor-pointer transition-all hover:shadow-sm",
              getRiskColor(risk.riskLevel)
            )}
          >
            <div className="flex items-center space-x-enterprise-1">
              <Move className="h-3 w-3 opacity-50" />
              <span className="font-medium">{risk.id}</span>
            </div>
            <div className="text-xs mt-enterprise-1 line-clamp-2">
              {risk.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Risk Assessment Matrix Component
export const RiskAssessmentMatrix: React.FC = () => {
  const [risks, setRisks] = useState<RiskPosition[]>(sampleRiskPositions);
  const [selectedRisk, setSelectedRisk] = useState<RiskPosition | null>(null);
  const [showNewRiskDialog, setShowNewRiskDialog] = useState(false);

  const handleRiskMove = (riskId: string, newImpact: number, newLikelihood: number) => {
    setRisks(prev => prev.map(risk => 
      risk.id === riskId 
        ? { 
            ...risk, 
            impact: newImpact, 
            likelihood: newLikelihood, 
            x: newLikelihood, 
            y: 6 - newImpact,
            riskLevel: getRiskLevel(newImpact, newLikelihood)
          }
        : risk
    ));
  };

  const handleRiskClick = (risk: RiskPosition) => {
    setSelectedRisk(risk);
  };

  // Matrix labels
  const impactLabels = ['Very High', 'High', 'Medium', 'Low', 'Very Low'];
  const likelihoodLabels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];

  return (
    <div className="space-y-enterprise-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading-base font-semibold text-text-primary">Risk Assessment Matrix</h2>
          <p className="text-body-sm text-text-secondary">
            Interactive 5x5 risk matrix for risk positioning and evaluation
          </p>
        </div>
        <Button onClick={() => setShowNewRiskDialog(true)}>
          <Plus className="h-4 w-4 mr-enterprise-1" />
          Add Risk
        </Button>
      </div>

      {/* Matrix Legend */}
      <div className="flex items-center space-x-enterprise-4">
        <span className="text-caption font-medium text-text-primary">Risk Levels:</span>
        {['low', 'medium', 'high', 'critical'].map((level) => (
          <div key={level} className="flex items-center space-x-enterprise-1">
            <div className={cn("h-3 w-3 rounded border", getRiskColor(level))} />
            <span className="text-caption text-text-secondary capitalize">{level}</span>
          </div>
        ))}
      </div>

      {/* Risk Matrix Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Grid Header */}
          <div className="grid grid-cols-6 gap-0 border border-border rounded-lg overflow-hidden bg-white">
            {/* Top-left corner */}
            <div className="bg-surface-secondary p-enterprise-3 border-r border-b border-border">
              <div className="text-caption font-semibold text-text-primary">Impact →</div>
              <div className="text-caption text-text-secondary">Likelihood ↓</div>
            </div>

            {/* Impact headers */}
            {likelihoodLabels.map((label, index) => (
              <div key={label} className="bg-surface-secondary p-enterprise-3 border-r border-b border-border">
                <div className="text-caption font-semibold text-text-primary text-center">
                  {index + 1}
                </div>
                <div className="text-caption text-text-secondary text-center">{label}</div>
              </div>
            ))}

            {/* Matrix rows */}
            {impactLabels.map((impactLabel, impactIndex) => (
              <React.Fragment key={impactLabel}>
                {/* Likelihood header */}
                <div className="bg-surface-secondary p-enterprise-3 border-r border-b border-border">
                  <div className="text-caption font-semibold text-text-primary">{5 - impactIndex}</div>
                  <div className="text-caption text-text-secondary">{impactLabel}</div>
                </div>

                {/* Matrix cells */}
                {[1, 2, 3, 4, 5].map((likelihood) => (
                  <MatrixCell
                    key={`${impactIndex}-${likelihood}`}
                    impact={impactIndex + 1}
                    likelihood={likelihood}
                    risks={risks}
                    onRiskMove={handleRiskMove}
                    onRiskClick={handleRiskClick}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-enterprise-4">
        {['critical', 'high', 'medium', 'low'].map((level) => {
          const count = risks.filter(r => r.riskLevel === level).length;
          return (
            <ContentCard
              key={level}
              title={`${level.charAt(0).toUpperCase() + level.slice(1)} Risks`}
              className={cn("border-2", getRiskColor(level).split(' ')[1])}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary">{count}</div>
                <div className="text-caption text-text-secondary">risks identified</div>
              </div>
            </ContentCard>
          );
        })}
      </div>

      {/* Selected Risk Details Dialog */}
      {selectedRisk && (
        <Dialog open={!!selectedRisk} onOpenChange={() => setSelectedRisk(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Risk Details - {selectedRisk.id}</DialogTitle>
            </DialogHeader>
            <div className="space-y-enterprise-4">
              <div>
                <h4 className="text-body-sm font-semibold text-text-primary mb-enterprise-2">
                  {selectedRisk.title}
                </h4>
                <div className="grid grid-cols-2 gap-enterprise-4">
                  <div>
                    <span className="text-caption text-text-secondary">Impact Score:</span>
                    <div className="text-body-base font-medium text-text-primary">
                      {selectedRisk.impact}/5
                    </div>
                  </div>
                  <div>
                    <span className="text-caption text-text-secondary">Likelihood Score:</span>
                    <div className="text-body-base font-medium text-text-primary">
                      {selectedRisk.likelihood}/5
                    </div>
                  </div>
                  <div>
                    <span className="text-caption text-text-secondary">Risk Level:</span>
                    <div className={cn("inline-flex items-center px-2 py-1 rounded text-caption font-medium", getRiskColor(selectedRisk.riskLevel))}>
                      {selectedRisk.riskLevel.charAt(0).toUpperCase() + selectedRisk.riskLevel.slice(1)}
                    </div>
                  </div>
                  <div>
                    <span className="text-caption text-text-secondary">Category:</span>
                    <div className="text-body-base font-medium text-text-primary">
                      {selectedRisk.category}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-enterprise-2">
                <Button variant="outline" size="sm">
                  <Edit className="h-3 w-3 mr-enterprise-1" />
                  Edit Risk
                </Button>
                <Button variant="outline" size="sm">
                  <FileText className="h-3 w-3 mr-enterprise-1" />
                  View Details
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add New Risk Dialog */}
      <Dialog open={showNewRiskDialog} onOpenChange={setShowNewRiskDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Risk</DialogTitle>
          </DialogHeader>
          <div className="space-y-enterprise-4">
            <div>
              <label className="text-caption font-medium text-text-primary">Risk Title</label>
              <Input placeholder="Enter risk title..." className="mt-enterprise-1" />
            </div>
            <div>
              <label className="text-caption font-medium text-text-primary">Category</label>
              <Select>
                <SelectTrigger className="mt-enterprise-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="data-security">Data Security</SelectItem>
                  <SelectItem value="access-control">Access Control</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="infrastructure">Infrastructure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-enterprise-3">
              <div>
                <label className="text-caption font-medium text-text-primary">Impact (1-5)</label>
                <Select>
                  <SelectTrigger className="mt-enterprise-1">
                    <SelectValue placeholder="Impact" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-caption font-medium text-text-primary">Likelihood (1-5)</label>
                <Select>
                  <SelectTrigger className="mt-enterprise-1">
                    <SelectValue placeholder="Likelihood" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-enterprise-2">
              <Button variant="outline" onClick={() => setShowNewRiskDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowNewRiskDialog(false)}>
                <Save className="h-3 w-3 mr-enterprise-1" />
                Add Risk
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RiskAssessmentMatrix; 