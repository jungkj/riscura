import React, { useState } from 'react';
import {
  Shield,
  Settings,
  Play,
  Download,
  AlertTriangle,
  CheckCircle,
  Target,
  Brain,
  Activity,
  Calendar
} from 'lucide-react';

import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { DaisySlider } from '@/components/ui/DaisySlider';

import { Risk, Control } from '@/types';
import { 
  controlRecommendationAIService,
  ControlRecommendation,
  ControlGapAnalysis,
  ImplementationPlan,
  CostBenefitAnalysis
} from '@/services/ControlRecommendationAIService';

interface ControlRecommendationsAIProps {
  risks: Risk[];
  existingControls: Control[];
  onRecommendationAccepted?: (recommendation: ControlRecommendation) => void;
  onImplementationPlanGenerated?: (plan: ImplementationPlan) => void;
  className?: string;
}

const FrameworkSelector: React.FC<{
  frameworks: string[];
  selected: string[];
  onSelectionChange: (frameworks: string[]) => void;
}> = ({ frameworks, selected, onSelectionChange }) => {
  const frameworkInfo = {
    cobit: { name: 'COBIT 2019', icon: <Target className="h-5 w-5" />, color: 'text-blue-600' },
    itil: { name: 'ITIL 4', icon: <Activity className="h-5 w-5" />, color: 'text-green-600' },
    sox: { name: 'SOX Controls', icon: <Shield className="h-5 w-5" />, color: 'text-[#191919]' }
  };

  return (
    <div className="space-y-3">
      <DaisyLabel className="text-sm font-medium">Control Frameworks</DaisyLabel>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {frameworks.map(framework => {
          const info = frameworkInfo[framework as keyof typeof frameworkInfo];
          const isSelected = selected.includes(framework);
          
          return (
            <DaisyCard 
              key={framework}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary border-primary' : ''
              }`}
              onClick={() => {
                if (isSelected) {
                  onSelectionChange(selected.filter(f => f !== framework));
                } else {
                  onSelectionChange([...selected, framework]);
                }
              }}
            >
              <DaisyCardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-secondary/10 ${info?.color || 'text-muted-foreground'}`}>
                    {info?.icon || <Settings className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{info?.name || framework}</h4>
                    <p className="text-xs text-muted-foreground">
                      {isSelected ? 'Selected' : 'Click to select'}
                    </p>
                  </div>
                </div>
              </DaisyCardBody>
            </DaisyCard>
          );
        })}
      </div>
    </div>
  );
};

const RecommendationCard: React.FC<{
  recommendation: ControlRecommendation;
  onAccept: () => void;
  onViewDetails: () => void;
}> = ({ recommendation, onAccept, onViewDetails }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-muted';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'preventive': return <Shield className="h-4 w-4" />;
      case 'detective': return <DaisyAlertTriangle className="h-4 w-4" />;
      case 'corrective': return <Settings className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <DaisyCard>
      <DaisyCardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              {getTypeIcon(recommendation.controlTemplate.type)}
            </div>
            <div>
              <DaisyCardTitle className="text-lg">{recommendation.controlTemplate.title}</DaisyCardTitle>
              <DaisyCardDescription>{recommendation.controlTemplate.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${getPriorityColor(recommendation.priority)}`} />
            <DaisyBadge variant="outline" className="capitalize">
              {recommendation.priority}
            </DaisyBadge>
          </div>
        </div>
      
      <DaisyCardContent>
        <div className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Implementation Cost</p>
              <p className="font-semibold">
                ${recommendation.costBenefitAnalysis.implementation.total.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Timeline</p>
              <p className="font-semibold">{recommendation.implementationPlan.timeline} days</p>
            </div>
            <div>
              <p className="text-muted-foreground">ROI</p>
              <p className="font-semibold">{(recommendation.costBenefitAnalysis.roi * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Risk Reduction</p>
              <p className="font-semibold">{(recommendation.riskReduction.reductionPercentage * 100).toFixed(1)}%</p>
            </div>
          </div>

          {/* AI Confidence */}
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">AI Confidence</span>
            <DaisyProgress value={recommendation.aiConfidence * 100} className="flex-1" />
            <span className="text-sm">{(recommendation.aiConfidence * 100).toFixed(0)}%</span>
          </div>

          {/* Framework Badge */}
          <div className="flex items-center gap-2">
            <DaisyBadge variant="secondary">{recommendation.framework.toUpperCase()}</DaisyBadge>
            <DaisyBadge variant="outline">{recommendation.controlTemplate.type}</DaisyBadge>
          </div>

          {/* Rationale */}
          <div>
            <p className="text-sm font-medium mb-1">Rationale</p>
            <p className="text-sm text-muted-foreground">{recommendation.rationale}</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <DaisyButton variant="outline" size="sm" onClick={onViewDetails}>
              View Details
            </DaisyButton>
            <DaisyButton size="sm" onClick={onAccept}>
              Accept Recommendation
            </DaisyButton>
          </div>
        </div>
      </DaisyCardBody>
    </DaisyCard>
  );
};

const GapAnalysisView: React.FC<{ 
  analysis: ControlGapAnalysis;
  onRecommendationAccepted: (recommendation: ControlRecommendation) => void;
}> = ({ analysis, onRecommendationAccepted }) => {
  return (
    <div className="space-y-6">
      {/* Current Controls */}
      <DaisyCard>
        <DaisyCardHeader>
          <DaisyCardTitle>Current Control Coverage</DaisyCardTitle>
          <DaisyCardDescription>Existing controls for this risk</p>
        
        <DaisyCardContent>
          <div className="space-y-3">
            {analysis.currentControls.map(control => (
              <div key={control.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{control.title}</h4>
                  <p className="text-sm text-muted-foreground">{control.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <DaisyBadge variant={control.effectiveness === 'high' ? 'default' : 'secondary'}>
                    {control.effectiveness}
                  </DaisyBadge>
                  <DaisyBadge variant="outline">{control.type}</DaisyBadge>
                </div>
              </div>
            ))}
            {analysis.currentControls.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No existing controls found</p>
            )}
          </div>
        </DaisyCardBody>
      </DaisyCard>

      {/* Identified Gaps */}
      <DaisyCard>
        <DaisyCardHeader>
          <DaisyCardTitle>Control Gaps</DaisyCardTitle>
          <DaisyCardDescription>Areas requiring attention</p>
        
        <DaisyCardContent>
          <div className="space-y-3">
            {analysis.identifiedGaps.map(gap => (
              <div key={gap.id} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium">{gap.description}</h4>
                  <DaisyBadge variant={gap.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {gap.severity}
                  </DaisyBadge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{gap.impact}</p>
                <div className="flex flex-wrap gap-1">
                  {gap.rootCause.map(cause => (
                    <DaisyBadge key={cause} variant="outline" className="text-xs">
                      {cause}
                    </DaisyBadge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DaisyCardBody>
      </DaisyCard>

      {/* Recommendations */}
      <DaisyCard>
        <DaisyCardHeader>
          <DaisyCardTitle>Recommended Controls</DaisyCardTitle>
          <DaisyCardDescription>AI-suggested controls to address gaps</p>
        
        <DaisyCardContent>
          <div className="space-y-4">
            {analysis.recommendations.map(recommendation => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onAccept={() => onRecommendationAccepted(recommendation)}
                onViewDetails={() => console.log('View details:', recommendation.id)}
              />
            ))}
          </div>
        </DaisyCardBody>
      </DaisyCard>
    </div>
  );
};

const CostBenefitView: React.FC<{ 
  analysis: CostBenefitAnalysis;
  recommendation: ControlRecommendation;
}> = ({ analysis, recommendation }) => {
  return (
    <div className="space-y-6">
      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DaisyCard>
          <DaisyCardHeader className="pb-2">
            <DaisyCardDescription>Total Investment</p>
          
          <DaisyCardContent>
            <div className="text-2xl font-bold">
              ${(analysis.implementation.total + analysis.operational.total).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              5-year TCO
            </p>
          </DaisyCardBody>
        </DaisyCard>

        <DaisyCard>
          <DaisyCardHeader className="pb-2">
            <DaisyCardDescription>Expected ROI</p>
          
          <DaisyCardContent>
            <div className="text-2xl font-bold text-green-600">
              {(analysis.roi * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Annual return
            </p>
          </DaisyCardBody>
        </DaisyCard>

        <DaisyCard>
          <DaisyCardHeader className="pb-2">
            <DaisyCardDescription>Payback Period</p>
          
          <DaisyCardContent>
            <div className="text-2xl font-bold">
              {analysis.paybackPeriod} mo
            </div>
            <p className="text-xs text-muted-foreground">
              Break-even time
            </p>
          </DaisyCardBody>
        </DaisyCard>

        <DaisyCard>
          <DaisyCardHeader className="pb-2">
            <DaisyCardDescription>Net Present Value</p>
          
          <DaisyCardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${analysis.npv.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              5-year NPV
            </p>
          </DaisyCardBody>
        </DaisyCard>
      </div>

      {/* Cost Breakdown */}
      <DaisyCard>
        <DaisyCardHeader>
          <DaisyCardTitle>Cost Breakdown</DaisyCardTitle>
          <DaisyCardDescription>Detailed cost analysis</p>
        
        <DaisyCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Implementation Costs</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Personnel</span>
                  <span className="text-sm font-medium">${analysis.implementation.personnel.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Technology</span>
                  <span className="text-sm font-medium">${analysis.implementation.technology.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Training</span>
                  <span className="text-sm font-medium">${analysis.implementation.training.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">External</span>
                  <span className="text-sm font-medium">${analysis.implementation.external.toLocaleString()}</span>
                </div>
                <DaisySeparator />
                <div className="flex justify-between font-medium">
                  <span className="text-sm">Total</span>
                  <span className="text-sm">${analysis.implementation.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Annual Operating Costs</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Personnel</span>
                  <span className="text-sm font-medium">${analysis.operational.personnel.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Technology</span>
                  <span className="text-sm font-medium">${analysis.operational.technology.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Maintenance</span>
                  <span className="text-sm font-medium">${analysis.operational.ongoing.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">External</span>
                  <span className="text-sm font-medium">${analysis.operational.external.toLocaleString()}</span>
                </div>
                <DaisySeparator />
                <div className="flex justify-between font-medium">
                  <span className="text-sm">Total</span>
                  <span className="text-sm">${analysis.operational.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </DaisyCardBody>
      </DaisyCard>

      {/* Benefits Analysis */}
      <DaisyCard>
        <DaisyCardHeader>
          <DaisyCardTitle>Expected Benefits</DaisyCardTitle>
          <DaisyCardDescription>Quantified value proposition</p>
        
        <DaisyCardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Risk Reduction Value</span>
                  <span className="text-sm font-medium">${analysis.benefits.riskReduction.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Efficiency Gains</span>
                  <span className="text-sm font-medium">${analysis.benefits.efficiencyGains.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Compliance Benefits</span>
                  <span className="text-sm font-medium">${analysis.benefits.complianceBenefits.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Avoided Costs</span>
                  <span className="text-sm font-medium">${analysis.benefits.avoidedCosts.toLocaleString()}</span>
                </div>
                <DaisySeparator />
                <div className="flex justify-between font-medium">
                  <span className="text-sm">Total Annual Benefits</span>
                  <span className="text-sm">${analysis.benefits.total.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Qualitative Benefits</h4>
                <div className="space-y-1">
                  {analysis.benefits.qualitativeBenefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DaisyCardBody>
      </DaisyCard>

      {/* Sensitivity Analysis */}
      <DaisyCard>
        <DaisyCardHeader>
          <DaisyCardTitle>Sensitivity Analysis</DaisyCardTitle>
          <DaisyCardDescription>Impact of key variables on ROI</p>
        
        <DaisyCardContent>
          <div className="space-y-4">
            {analysis.sensitivityAnalysis.scenarios.map((scenario, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{scenario.name}</h4>
                  <DaisyBadge variant="outline">{(scenario.likelihood * 100).toFixed(0)}% likely</DaisyBadge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Cost Impact: </span>
                    <span className={scenario.costImpact > 0 ? 'text-red-600' : 'text-green-600'}>
                      {scenario.costImpact > 0 ? '+' : ''}{(scenario.costImpact * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Benefit Impact: </span>
                    <span className={scenario.benefitImpact > 0 ? 'text-green-600' : 'text-red-600'}>
                      {scenario.benefitImpact > 0 ? '+' : ''}{(scenario.benefitImpact * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DaisyCardBody>
      </DaisyCard>
    </div>
  );
};

const ImplementationPlanView: React.FC<{ 
  plan: ImplementationPlan;
}> = ({ plan }) => {
  return (
    <div className="space-y-6">
      {/* Timeline Overview */}
      <DaisyCard>
        <DaisyCardHeader>
          <DaisyCardTitle>Implementation Timeline</DaisyCardTitle>
          <DaisyCardDescription>{plan.timeline} days total • {plan.phases.length} phases</p>
        
        <DaisyCardContent>
          <div className="space-y-4">
            {plan.phases.map((phase, index) => (
              <div key={phase.id} className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{phase.name}</h4>
                  <p className="text-sm text-muted-foreground">{phase.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{phase.duration} days</div>
                  <div className="text-xs text-muted-foreground">{phase.activities.length} activities</div>
                </div>
              </div>
            ))}
          </div>
        </DaisyCardBody>
      </DaisyCard>

      {/* Resource Requirements */}
      <DaisyCard>
        <DaisyCardHeader>
          <DaisyCardTitle>Resource Requirements</DaisyCardTitle>
          <DaisyCardDescription>Personnel and technology needs</p>
        
        <DaisyCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Human Resources</h4>
              <div className="space-y-2">
                {plan.resources
                  .filter(r => r.type === 'human')
                  .map((resource, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="text-sm font-medium">{resource.description}</span>
                        <div className="text-xs text-muted-foreground">
                          {resource.skillLevel} level • {resource.duration} days
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        {resource.quantity}x
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Technology & Tools</h4>
              <div className="space-y-2">
                {plan.resources
                  .filter(r => r.type === 'technology')
                  .map((resource, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="text-sm font-medium">{resource.description}</span>
                        <div className="text-xs text-muted-foreground">
                          ${resource.cost.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        {resource.quantity}x
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </DaisyCardBody>
      </DaisyCard>

      {/* Milestones */}
      <DaisyCard>
        <DaisyCardHeader>
          <DaisyCardTitle>Key Milestones</DaisyCardTitle>
          <DaisyCardDescription>Critical checkpoints and deliverables</p>
        
        <DaisyCardContent>
          <div className="space-y-3">
            {plan.milestones.map((milestone, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <DaisyCalendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium">{milestone.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{milestone.description}</p>
                  <div className="text-xs text-muted-foreground">
                    Target: Day {milestone.targetDate}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DaisyCardBody>
      </DaisyCard>
    </div>
  );
};

export const ControlRecommendationsAI: React.FC<ControlRecommendationsAIProps> = ({
  risks,
  existingControls,
  onRecommendationAccepted,
  onImplementationPlanGenerated,
  className = ''
}) => {
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(['cobit']);
  const [organizationSize, setOrganizationSize] = useState<'small' | 'medium' | 'large' | 'enterprise'>('medium');
  const [budget, setBudget] = useState<number[]>([100000]);
  const [timeline, setTimeline] = useState<number[]>([12]);
  const [riskTolerance, setRiskTolerance] = useState<'low' | 'medium' | 'high'>('medium');
  const [priorityFocus, setPriorityFocus] = useState<'cost' | 'time' | 'effectiveness' | 'compliance'>('effectiveness');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<ControlRecommendation[]>([]);
  const [gapAnalyses, setGapAnalyses] = useState<ControlGapAnalysis[]>([]);
  const [implementationPlan, setImplementationPlan] = useState<ImplementationPlan | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<ControlRecommendation | null>(null);
  
  const [activeTab, setActiveTab] = useState('configuration');

  const availableFrameworks = ['cobit', 'itil', 'sox'];

  const handleGenerateRecommendations = async () => {
    setIsAnalyzing(true);
    try {
      const recs = await controlRecommendationAIService.generateControlRecommendations(
        risks,
        existingControls,
        {
          frameworks: selectedFrameworks,
          organizationProfile: {
            industry: 'technology',
            size: organizationSize,
            maturityLevel: 3,
            riskTolerance,
            regulatoryRequirements: selectedFrameworks.includes('sox') ? ['SOX'] : [],
            budgetConstraints: budget[0],
            technicalCapabilities: ['cloud', 'automation']
          },
          budget: budget[0],
          timeline: timeline[0],
          riskTolerance,
          priorityFocus
        }
      );

      const gaps = await controlRecommendationAIService.performControlGapAnalysis(
        risks,
        existingControls,
        selectedFrameworks[0]
      );

      setRecommendations(recs);
      setGapAnalyses(gaps);
      setActiveTab('recommendations');
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateImplementationPlan = async () => {
    if (recommendations.length === 0) return;

    try {
      const plan = await controlRecommendationAIService.generateImplementationRoadmap(
        recommendations,
        {
          budget: budget[0],
          timeline: timeline[0],
          resources: [],
          dependencies: []
        }
      );

      setImplementationPlan(plan);
      onImplementationPlanGenerated?.(plan);
      setActiveTab('implementation');
    } catch (error) {
      console.error('Failed to generate implementation plan:', error);
    }
  };

  const handleAcceptRecommendation = (recommendation: ControlRecommendation) => {
    onRecommendationAccepted?.(recommendation);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <DaisyCard>
        <DaisyCardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <DaisyCardTitle>Smart Control Recommendations</DaisyCardTitle>
              <DaisyCardDescription>
                AI-powered control recommendations with cost-benefit analysis and implementation guidance
              </p>
            </div>
          </div>
        
      </DaisyCard>

      <DaisyTabs value={activeTab} onValueChange={setActiveTab}>
        <DaisyTabsList className="grid w-full grid-cols-5">
          <DaisyTabsTrigger value="configuration">Configuration</DaisyTabsTrigger>
          <DaisyTabsTrigger value="recommendations" disabled={!recommendations.length}>
            Recommendations
          </DaisyTabsTrigger>
          <DaisyTabsTrigger value="gaps" disabled={!gapAnalyses.length}>
            Gap Analysis
          </DaisyTabsTrigger>
          <DaisyTabsTrigger value="cost-benefit" disabled={!selectedRecommendation}>
            Cost-Benefit
          </DaisyTabsTrigger>
          <DaisyTabsTrigger value="implementation" disabled={!implementationPlan}>
            Implementation
          </DaisyTabsTrigger>
        </DaisyTabsList>

        <DaisyTabsContent value="configuration">
          <div className="space-y-6">
            <DaisyCard>
              <DaisyCardHeader>
                <DaisyCardTitle>Analysis Configuration</DaisyCardTitle>
                <DaisyCardDescription>Configure parameters for control recommendations</p>
              
              <DaisyCardContent className="space-y-6">
                {/* Framework Selection */}
                <FrameworkSelector
                  frameworks={availableFrameworks}
                  selected={selectedFrameworks}
                  onSelectionChange={setSelectedFrameworks}
                />

                <DaisySeparator />

                {/* Organization Profile */}
                <div className="space-y-4">
                  <DaisyLabel className="text-sm font-medium">Organization Profile</DaisyLabel>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <DaisyLabel htmlFor="org-size">Organization Size</DaisyLabel>
                      <DaisySelect value={organizationSize} onValueChange={(value: 'small' | 'medium' | 'large' | 'enterprise') => setOrganizationSize(value)}>
                        <DaisySelectTrigger id="org-size">
                          <DaisySelectValue />
                        </SelectTrigger>
                        <DaisySelectContent>
                          <DaisySelectItem value="small">Small (&lt; 100 employees)</SelectItem>
                          <DaisySelectItem value="medium">Medium (100-1000 employees)</SelectItem>
                          <DaisySelectItem value="large">Large (1000-10000 employees)</SelectItem>
                          <DaisySelectItem value="enterprise">Enterprise (&gt; 10000 employees)</SelectItem>
                        </SelectContent>
                      </DaisySelect>
                    </div>

                    <div className="space-y-2">
                      <DaisyLabel htmlFor="risk-tolerance">Risk Tolerance</DaisyLabel>
                      <DaisySelect value={riskTolerance} onValueChange={(value: 'low' | 'medium' | 'high') => setRiskTolerance(value)}>
                        <DaisySelectTrigger id="risk-tolerance">
                          <DaisySelectValue />
                        </SelectTrigger>
                        <DaisySelectContent>
                          <DaisySelectItem value="low">Low - Conservative approach</SelectItem>
                          <DaisySelectItem value="medium">Medium - Balanced approach</SelectItem>
                          <DaisySelectItem value="high">High - Risk-taking approach</SelectItem>
                        </SelectContent>
                      </DaisySelect>
                    </div>
                  </div>
                </div>

                <DaisySeparator />

                {/* Budget and Timeline */}
                <div className="space-y-4">
                  <DaisyLabel className="text-sm font-medium">Investment Parameters</DaisyLabel>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <DaisyLabel htmlFor="budget">Budget Limit</DaisyLabel>
                        <span className="text-sm text-muted-foreground">
                          ${budget[0].toLocaleString()}
                        </span>
                      </div>
                      <DaisySlider
                        id="budget"
                        min={10000}
                        max={1000000}
                        step={10000}
                        value={budget}
                        onValueChange={setBudget}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <DaisyLabel htmlFor="timeline">Timeline (months)</DaisyLabel>
                        <span className="text-sm text-muted-foreground">
                          {timeline[0]} months
                        </span>
                      </div>
                      <DaisySlider
                        id="timeline"
                        min={3}
                        max={24}
                        step={1}
                        value={timeline}
                        onValueChange={setTimeline}
                      />
                    </div>
                  </div>
                </div>

                <DaisySeparator />

                {/* Priority Focus */}
                <div className="space-y-2">
                  <DaisyLabel htmlFor="priority-focus">Priority Focus</DaisyLabel>
                  <DaisySelect value={priorityFocus} onValueChange={(value: 'cost' | 'time' | 'effectiveness' | 'compliance') => setPriorityFocus(value)}>
                    <DaisySelectTrigger id="priority-focus">
                      <DaisySelectValue />
                    </SelectTrigger>
                    <DaisySelectContent>
                      <DaisySelectItem value="cost">Cost - Minimize investment</SelectItem>
                      <DaisySelectItem value="time">Time - Fastest implementation</SelectItem>
                      <DaisySelectItem value="effectiveness">Effectiveness - Maximum risk reduction</SelectItem>
                      <DaisySelectItem value="compliance">Compliance - Regulatory alignment</SelectItem>
                    </SelectContent>
                  </DaisySelect>
                </div>

                <DaisySeparator />

                <div className="flex justify-end gap-2">
                  <DaisyButton
                    onClick={handleGenerateRecommendations}
                    disabled={isAnalyzing || selectedFrameworks.length === 0}
                    className="gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Generate Recommendations
                      </>
                    )}
                  </DaisyButton>
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="recommendations">
          <div className="space-y-6">
            <DaisyCard>
              <DaisyCardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DaisyCardTitle>AI-Generated Recommendations</DaisyCardTitle>
                    <DaisyCardDescription>
                      {recommendations.length} control recommendations • {selectedFrameworks.join(', ').toUpperCase()} frameworks
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <DaisyButton 
                      variant="outline" 
                      onClick={handleGenerateImplementationPlan}
                      disabled={recommendations.length === 0}
                      className="gap-2"
                    >
                      <DaisyCalendar className="h-4 w-4" />
                      Generate Plan
                    </DaisyButton>
                    <DaisyButton variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Export
                    </DaisyButton>
                  </div>
                </div>
              
              <DaisyCardContent>
                <div className="space-y-4">
                  {recommendations.map(recommendation => (
                    <RecommendationCard
                      key={recommendation.id}
                      recommendation={recommendation}
                      onAccept={() => handleAcceptRecommendation(recommendation)}
                      onViewDetails={() => {
                        setSelectedRecommendation(recommendation);
                        setActiveTab('cost-benefit');
                      }}
                    />
                  ))}
                  {recommendations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recommendations generated yet</p>
                      <p className="text-sm">Configure analysis parameters and click "Generate Recommendations"</p>
                    </div>
                  )}
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="gaps">
          <div className="space-y-6">
            {gapAnalyses.map(analysis => (
              <GapAnalysisView
                key={analysis.riskId}
                analysis={analysis}
                onRecommendationAccepted={handleAcceptRecommendation}
              />
            ))}
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="cost-benefit">
          {selectedRecommendation && (
            <CostBenefitView
              analysis={selectedRecommendation.costBenefitAnalysis}
              recommendation={selectedRecommendation}
            />
          )}
        </DaisyTabsContent>

        <DaisyTabsContent value="implementation">
          {implementationPlan && (
            <ImplementationPlanView plan={implementationPlan} />
          )}
        </DaisyTabsContent>
      </DaisyTabs>
    </div>
  );
}; 