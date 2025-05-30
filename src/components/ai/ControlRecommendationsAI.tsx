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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';

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
    sox: { name: 'SOX Controls', icon: <Shield className="h-5 w-5" />, color: 'text-purple-600' }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Control Frameworks</Label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {frameworks.map(framework => {
          const info = frameworkInfo[framework as keyof typeof frameworkInfo];
          const isSelected = selected.includes(framework);
          
          return (
            <Card 
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
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gray-50 ${info?.color || 'text-gray-600'}`}>
                    {info?.icon || <Settings className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{info?.name || framework}</h4>
                    <p className="text-xs text-muted-foreground">
                      {isSelected ? 'Selected' : 'Click to select'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'preventive': return <Shield className="h-4 w-4" />;
      case 'detective': return <AlertTriangle className="h-4 w-4" />;
      case 'corrective': return <Settings className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              {getTypeIcon(recommendation.controlTemplate.type)}
            </div>
            <div>
              <CardTitle className="text-lg">{recommendation.controlTemplate.title}</CardTitle>
              <CardDescription>{recommendation.controlTemplate.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${getPriorityColor(recommendation.priority)}`} />
            <Badge variant="outline" className="capitalize">
              {recommendation.priority}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
            <Progress value={recommendation.aiConfidence * 100} className="flex-1" />
            <span className="text-sm">{(recommendation.aiConfidence * 100).toFixed(0)}%</span>
          </div>

          {/* Framework Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{recommendation.framework.toUpperCase()}</Badge>
            <Badge variant="outline">{recommendation.controlTemplate.type}</Badge>
          </div>

          {/* Rationale */}
          <div>
            <p className="text-sm font-medium mb-1">Rationale</p>
            <p className="text-sm text-muted-foreground">{recommendation.rationale}</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              View Details
            </Button>
            <Button size="sm" onClick={onAccept}>
              Accept Recommendation
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const GapAnalysisView: React.FC<{ 
  analysis: ControlGapAnalysis;
  onRecommendationAccepted: (recommendation: ControlRecommendation) => void;
}> = ({ analysis, onRecommendationAccepted }) => {
  return (
    <div className="space-y-6">
      {/* Current Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Current Control Coverage</CardTitle>
          <CardDescription>Existing controls for this risk</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.currentControls.map(control => (
              <div key={control.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{control.title}</h4>
                  <p className="text-sm text-muted-foreground">{control.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={control.effectiveness === 'high' ? 'default' : 'secondary'}>
                    {control.effectiveness}
                  </Badge>
                  <Badge variant="outline">{control.type}</Badge>
                </div>
              </div>
            ))}
            {analysis.currentControls.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No existing controls found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Identified Gaps */}
      <Card>
        <CardHeader>
          <CardTitle>Control Gaps</CardTitle>
          <CardDescription>Areas requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.identifiedGaps.map(gap => (
              <div key={gap.id} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium">{gap.description}</h4>
                  <Badge variant={gap.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {gap.severity}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{gap.impact}</p>
                <div className="flex flex-wrap gap-1">
                  {gap.rootCause.map(cause => (
                    <Badge key={cause} variant="outline" className="text-xs">
                      {cause}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Controls</CardTitle>
          <CardDescription>AI-suggested controls to address gaps</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
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
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Investment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(analysis.implementation.total + analysis.operational.total).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              5-year TCO
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Expected ROI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(analysis.roi * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Annual return
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Payback Period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analysis.paybackPeriod} mo
            </div>
            <p className="text-xs text-muted-foreground">
              Break-even time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Net Present Value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${analysis.npv.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              5-year NPV
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
          <CardDescription>Detailed cost analysis</CardDescription>
        </CardHeader>
        <CardContent>
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
                <Separator />
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
                <Separator />
                <div className="flex justify-between font-medium">
                  <span className="text-sm">Total</span>
                  <span className="text-sm">${analysis.operational.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Expected Benefits</CardTitle>
          <CardDescription>Quantified value proposition</CardDescription>
        </CardHeader>
        <CardContent>
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
                <Separator />
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
        </CardContent>
      </Card>

      {/* Sensitivity Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Sensitivity Analysis</CardTitle>
          <CardDescription>Impact of key variables on ROI</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.sensitivityAnalysis.scenarios.map((scenario, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{scenario.name}</h4>
                  <Badge variant="outline">{(scenario.likelihood * 100).toFixed(0)}% likely</Badge>
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
        </CardContent>
      </Card>
    </div>
  );
};

const ImplementationPlanView: React.FC<{ 
  plan: ImplementationPlan;
}> = ({ plan }) => {
  return (
    <div className="space-y-6">
      {/* Timeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Timeline</CardTitle>
          <CardDescription>{plan.timeline} days total • {plan.phases.length} phases</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Resource Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Requirements</CardTitle>
          <CardDescription>Personnel and technology needs</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle>Key Milestones</CardTitle>
          <CardDescription>Critical checkpoints and deliverables</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {plan.milestones.map((milestone, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
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
        </CardContent>
      </Card>
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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>Smart Control Recommendations</CardTitle>
              <CardDescription>
                AI-powered control recommendations with cost-benefit analysis and implementation guidance
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="recommendations" disabled={!recommendations.length}>
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="gaps" disabled={!gapAnalyses.length}>
            Gap Analysis
          </TabsTrigger>
          <TabsTrigger value="cost-benefit" disabled={!selectedRecommendation}>
            Cost-Benefit
          </TabsTrigger>
          <TabsTrigger value="implementation" disabled={!implementationPlan}>
            Implementation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuration">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analysis Configuration</CardTitle>
                <CardDescription>Configure parameters for control recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Framework Selection */}
                <FrameworkSelector
                  frameworks={availableFrameworks}
                  selected={selectedFrameworks}
                  onSelectionChange={setSelectedFrameworks}
                />

                <Separator />

                {/* Organization Profile */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Organization Profile</Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="org-size">Organization Size</Label>
                      <Select value={organizationSize} onValueChange={(value: 'small' | 'medium' | 'large' | 'enterprise') => setOrganizationSize(value)}>
                        <SelectTrigger id="org-size">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small (&lt; 100 employees)</SelectItem>
                          <SelectItem value="medium">Medium (100-1000 employees)</SelectItem>
                          <SelectItem value="large">Large (1000-10000 employees)</SelectItem>
                          <SelectItem value="enterprise">Enterprise (&gt; 10000 employees)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="risk-tolerance">Risk Tolerance</Label>
                      <Select value={riskTolerance} onValueChange={(value: 'low' | 'medium' | 'high') => setRiskTolerance(value)}>
                        <SelectTrigger id="risk-tolerance">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - Conservative approach</SelectItem>
                          <SelectItem value="medium">Medium - Balanced approach</SelectItem>
                          <SelectItem value="high">High - Risk-taking approach</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Budget and Timeline */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Investment Parameters</Label>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="budget">Budget Limit</Label>
                        <span className="text-sm text-muted-foreground">
                          ${budget[0].toLocaleString()}
                        </span>
                      </div>
                      <Slider
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
                        <Label htmlFor="timeline">Timeline (months)</Label>
                        <span className="text-sm text-muted-foreground">
                          {timeline[0]} months
                        </span>
                      </div>
                      <Slider
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

                <Separator />

                {/* Priority Focus */}
                <div className="space-y-2">
                  <Label htmlFor="priority-focus">Priority Focus</Label>
                  <Select value={priorityFocus} onValueChange={(value: 'cost' | 'time' | 'effectiveness' | 'compliance') => setPriorityFocus(value)}>
                    <SelectTrigger id="priority-focus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cost">Cost - Minimize investment</SelectItem>
                      <SelectItem value="time">Time - Fastest implementation</SelectItem>
                      <SelectItem value="effectiveness">Effectiveness - Maximum risk reduction</SelectItem>
                      <SelectItem value="compliance">Compliance - Regulatory alignment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex justify-end gap-2">
                  <Button
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
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>AI-Generated Recommendations</CardTitle>
                    <CardDescription>
                      {recommendations.length} control recommendations • {selectedFrameworks.join(', ').toUpperCase()} frameworks
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleGenerateImplementationPlan}
                      disabled={recommendations.length === 0}
                      className="gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Generate Plan
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gaps">
          <div className="space-y-6">
            {gapAnalyses.map(analysis => (
              <GapAnalysisView
                key={analysis.riskId}
                analysis={analysis}
                onRecommendationAccepted={handleAcceptRecommendation}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cost-benefit">
          {selectedRecommendation && (
            <CostBenefitView
              analysis={selectedRecommendation.costBenefitAnalysis}
              recommendation={selectedRecommendation}
            />
          )}
        </TabsContent>

        <TabsContent value="implementation">
          {implementationPlan && (
            <ImplementationPlanView plan={implementationPlan} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}; 