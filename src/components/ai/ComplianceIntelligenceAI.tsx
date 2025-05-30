import React, { useState } from 'react';
import {
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  BookOpen,
  Target,
  TrendingUp,
  Download,
  Play,
  Calendar,
  Settings,
  Eye,
  Brain
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { Risk, Control } from '@/types';
import { 
  complianceAIService,
  ComplianceAssessment,
  ComplianceGap,
  ComplianceRoadmap,
  RegulatoryChange,
  AuditPreparation
} from '@/services/ComplianceAIService';

interface ComplianceIntelligenceAIProps {
  risks: Risk[];
  existingControls: Control[];
  onAssessmentCompleted?: (assessment: ComplianceAssessment) => void;
  onRoadmapGenerated?: (roadmap: ComplianceRoadmap) => void;
  onAuditPlanCreated?: (plan: AuditPreparation) => void;
  className?: string;
}

const FrameworkSelector: React.FC<{
  frameworks: string[];
  selected: string[];
  onSelectionChange: (frameworks: string[]) => void;
}> = ({ frameworks, selected, onSelectionChange }) => {
  const frameworkInfo = {
    sox: { name: 'SOX', icon: <Shield className="h-5 w-5" />, color: 'text-blue-600', description: 'Sarbanes-Oxley Act' },
    gdpr: { name: 'GDPR', icon: <Shield className="h-5 w-5" />, color: 'text-green-600', description: 'General Data Protection Regulation' },
    hipaa: { name: 'HIPAA', icon: <Shield className="h-5 w-5" />, color: 'text-purple-600', description: 'Health Insurance Portability Act' },
    iso27001: { name: 'ISO 27001', icon: <Target className="h-5 w-5" />, color: 'text-orange-600', description: 'Information Security Management' }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Regulatory Frameworks</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    {info?.icon || <Shield className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{info?.name || framework}</h4>
                    <p className="text-xs text-muted-foreground">
                      {info?.description || 'Regulatory framework'}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle className="h-4 w-4 text-primary ml-auto" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const AssessmentOverview: React.FC<{
  assessment: ComplianceAssessment;
  onViewDetails: (section: string) => void;
}> = ({ assessment, onViewDetails }) => {
  const getMaturityLabel = (level: number) => {
    const labels = {
      1: 'Initial',
      2: 'Repeatable', 
      3: 'Defined',
      4: 'Managed',
      5: 'Optimized'
    };
    return labels[level as keyof typeof labels] || 'Unknown';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(assessment.overallScore)}`}>
              {assessment.overallScore}%
            </div>
            <Progress value={assessment.overallScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Maturity Level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assessment.maturityLevel}/5
            </div>
            <p className="text-sm text-muted-foreground">
              {getMaturityLabel(assessment.maturityLevel)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Critical Gaps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {assessment.criticalGaps}
            </div>
            <p className="text-sm text-muted-foreground">
              of {assessment.gapsIdentified} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assessment.completionPercentage}%
            </div>
            <Progress value={assessment.completionPercentage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Audit Readiness */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Audit Readiness
          </CardTitle>
          <CardDescription>Current state of audit preparedness</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Documentation</span>
                <span>{assessment.auditReadiness.documentation}%</span>
              </div>
              <Progress value={assessment.auditReadiness.documentation} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Process Maturity</span>
                <span>{assessment.auditReadiness.process_maturity}%</span>
              </div>
              <Progress value={assessment.auditReadiness.process_maturity} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Evidence Quality</span>
                <span>{assessment.auditReadiness.evidence_quality}%</span>
              </div>
              <Progress value={assessment.auditReadiness.evidence_quality} />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => onViewDetails('audit')}>
              View Audit Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Top Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Recommendations</CardTitle>
          <CardDescription>AI-generated compliance improvements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {assessment.recommendations.slice(0, 3).map((rec, index) => (
              <div key={rec.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="p-1 rounded-full bg-blue-50">
                  <Brain className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{rec.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {rec.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {rec.timeline} days • ${rec.costBenefit.implementation.total.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {(rec.aiConfidence * 100).toFixed(0)}% confidence
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => onViewDetails('recommendations')}>
              View All Recommendations
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const GapAnalysisView: React.FC<{
  gaps: ComplianceGap[];
  onGapSelected: (gap: ComplianceGap) => void;
}> = ({ gaps, onGapSelected }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getGapTypeIcon = (type: string) => {
    switch (type) {
      case 'missing': return <AlertTriangle className="h-4 w-4" />;
      case 'partial': return <Clock className="h-4 w-4" />;
      case 'outdated': return <TrendingUp className="h-4 w-4" />;
      case 'ineffective': return <Settings className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const groupedGaps = gaps.reduce((acc, gap) => {
    const framework = gap.framework;
    if (!acc[framework]) acc[framework] = [];
    acc[framework].push(gap);
    return acc;
  }, {} as Record<string, ComplianceGap[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedGaps).map(([framework, frameworkGaps]) => (
        <Card key={framework}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {framework.toUpperCase()} Compliance Gaps
            </CardTitle>
            <CardDescription>
              {frameworkGaps.length} gaps identified • {frameworkGaps.filter(g => g.severity === 'critical').length} critical
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {frameworkGaps.map(gap => (
                <div
                  key={gap.id}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => onGapSelected(gap)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        {getGapTypeIcon(gap.gapType)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{gap.description}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {gap.businessImpact}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {gap.gapType}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {gap.estimatedEffort}h • ${gap.estimatedCost.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${getSeverityColor(gap.severity)}`} />
                      <Badge variant="outline" className="capitalize">
                        {gap.severity}
                      </Badge>
                    </div>
                  </div>
                  
                  {gap.remediationActions.length > 0 && (
                    <div className="mt-3 pl-11">
                      <p className="text-xs text-muted-foreground mb-1">Remediation actions:</p>
                      <div className="flex flex-wrap gap-1">
                        {gap.remediationActions.slice(0, 3).map((action, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {action.title}
                          </Badge>
                        ))}
                        {gap.remediationActions.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{gap.remediationActions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const RegulatoryChangesView: React.FC<{
  changes: RegulatoryChange[];
  onChangeSelected: (change: RegulatoryChange) => void;
}> = ({ changes, onChangeSelected }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'new': return <AlertTriangle className="h-4 w-4" />;
      case 'amendment': return <Settings className="h-4 w-4" />;
      case 'clarification': return <BookOpen className="h-4 w-4" />;
      case 'enforcement': return <Shield className="h-4 w-4" />;
      case 'deadline': return <Clock className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {changes.map(change => (
        <Card 
          key={change.id} 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onChangeSelected(change)}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 rounded-lg">
                  {getTypeIcon(change.type)}
                </div>
                <div>
                  <CardTitle className="text-base">{change.title}</CardTitle>
                  <CardDescription className="mt-1">{change.description}</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getSeverityColor(change.severity)}>
                  {change.severity}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {change.type}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Framework</p>
                <p className="font-medium">{change.framework.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Effective Date</p>
                <p className="font-medium">{change.effective_date.toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Impact Level</p>
                <p className="font-medium capitalize">{change.impact_assessment.urgency}</p>
              </div>
            </div>

            {change.ai_analysis.action_required && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Action Required</AlertTitle>
                <AlertDescription>
                  This change requires organizational response by {change.ai_analysis.deadline.toLocaleDateString()}
                </AlertDescription>
              </Alert>
            )}

            <div className="mt-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">
                  AI Confidence: {(change.ai_analysis.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Prep time: {change.ai_analysis.preparation_time} days
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const RoadmapView: React.FC<{
  roadmap: ComplianceRoadmap;
}> = ({ roadmap }) => {
  return (
    <div className="space-y-6">
      {/* Roadmap Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Roadmap Overview</CardTitle>
          <CardDescription>
            {roadmap.timeline} month journey from maturity level {roadmap.current_maturity} to {roadmap.target_maturity}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Budget</p>
              <p className="text-lg font-semibold">${roadmap.budget.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Initiatives</p>
              <p className="text-lg font-semibold">{roadmap.initiatives.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phases</p>
              <p className="text-lg font-semibold">{roadmap.phases.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Frameworks</p>
              <p className="text-lg font-semibold">{roadmap.frameworks.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phases */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Phases</CardTitle>
          <CardDescription>Structured approach to compliance maturity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roadmap.phases.map((phase, index) => (
              <div key={phase.id} className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{phase.name}</h4>
                  <p className="text-sm text-muted-foreground">{phase.duration} months</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">${phase.budget.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    {phase.objectives.length} objectives
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Initiatives */}
      <Card>
        <CardHeader>
          <CardTitle>Key Initiatives</CardTitle>
          <CardDescription>Priority compliance improvement projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {roadmap.initiatives.slice(0, 5).map(initiative => (
              <div key={initiative.id} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{initiative.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{initiative.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {initiative.priority}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {initiative.framework.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{initiative.timeline} days</div>
                    <div>${initiative.cost.toLocaleString()}</div>
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

export const ComplianceIntelligenceAI: React.FC<ComplianceIntelligenceAIProps> = ({
  risks,
  existingControls,
  onAssessmentCompleted,
  onRoadmapGenerated,
  onAuditPlanCreated,
  className = ''
}) => {
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(['sox']);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [assessment, setAssessment] = useState<ComplianceAssessment | null>(null);
  const [gaps, setGaps] = useState<ComplianceGap[]>([]);
  const [changes, setChanges] = useState<RegulatoryChange[]>([]);
  const [roadmap, setRoadmap] = useState<ComplianceRoadmap | null>(null);
  const [auditPlan, setAuditPlan] = useState<AuditPreparation | null>(null);
  const [activeTab, setActiveTab] = useState('configuration');

  const availableFrameworks = ['sox', 'gdpr', 'hipaa', 'iso27001'];

  const handlePerformAssessment = async () => {
    setIsAnalyzing(true);
    try {
      const scope = {
        frameworks: selectedFrameworks,
        departments: ['all'],
        processes: ['all'],
        systems: ['all'],
        timeframe: {
          start: new Date(),
          end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        },
        exclusions: []
      };

      const assessmentResult = await complianceAIService.performComplianceAssessment(
        selectedFrameworks,
        scope,
        existingControls,
        risks,
        {
          includeAuditReadiness: true,
          includeRoadmap: true,
          generateEvidence: true,
          aiAnalysis: true
        }
      );

      // Identify gaps
      const allGaps: ComplianceGap[] = [];
      for (const framework of selectedFrameworks) {
        const frameworkGaps = await complianceAIService.identifyComplianceGaps(
          framework,
          existingControls,
          risks
        );
        allGaps.push(...frameworkGaps);
      }

      // Monitor regulatory changes
      const regulatoryChanges = await complianceAIService.monitorRegulatoryChanges(
        selectedFrameworks
      );

      setAssessment(assessmentResult);
      setGaps(allGaps);
      setChanges(regulatoryChanges);
      
      onAssessmentCompleted?.(assessmentResult);
      setActiveTab('overview');
    } catch (error) {
      console.error('Failed to perform assessment:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!assessment) return;

    try {
      const roadmapResult = await complianceAIService.generateComplianceRoadmap(
        selectedFrameworks,
        assessment,
        4, // target maturity
        {
          budget: 500000,
          timeline: 18
        }
      );

      setRoadmap(roadmapResult);
      onRoadmapGenerated?.(roadmapResult);
      setActiveTab('roadmap');
    } catch (error) {
      console.error('Failed to generate roadmap:', error);
    }
  };

  const handlePrepareAudit = async () => {
    if (selectedFrameworks.length === 0) return;

    try {
      const auditDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now
      
      const auditPrep = await complianceAIService.prepareAudit(
        selectedFrameworks[0],
        'external',
        ['all'],
        auditDate,
        existingControls
      );

      setAuditPlan(auditPrep);
      onAuditPlanCreated?.(auditPrep);
      setActiveTab('audit');
    } catch (error) {
      console.error('Failed to prepare audit:', error);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>Compliance Intelligence</CardTitle>
              <CardDescription>
                AI-powered regulatory compliance management and audit preparation
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="overview" disabled={!assessment}>Overview</TabsTrigger>
          <TabsTrigger value="gaps" disabled={!gaps.length}>Gap Analysis</TabsTrigger>
          <TabsTrigger value="changes" disabled={!changes.length}>Reg Changes</TabsTrigger>
          <TabsTrigger value="roadmap" disabled={!roadmap}>Roadmap</TabsTrigger>
          <TabsTrigger value="audit" disabled={!auditPlan}>Audit Prep</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Configuration</CardTitle>
                <CardDescription>Configure compliance assessment parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FrameworkSelector
                  frameworks={availableFrameworks}
                  selected={selectedFrameworks}
                  onSelectionChange={setSelectedFrameworks}
                />

                <Separator />

                <div className="flex justify-end gap-2">
                  <Button
                    onClick={handlePerformAssessment}
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
                        Start Assessment
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="overview">
          {assessment && (
            <div className="space-y-6">
              <AssessmentOverview
                assessment={assessment}
                onViewDetails={(section) => setActiveTab(section)}
              />
              
              <div className="flex gap-2">
                <Button onClick={handleGenerateRoadmap} className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Generate Roadmap
                </Button>
                <Button variant="outline" onClick={handlePrepareAudit} className="gap-2">
                  <Eye className="h-4 w-4" />
                  Prepare Audit
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="gaps">
          <GapAnalysisView
            gaps={gaps}
            onGapSelected={(gap) => console.log('Gap selected:', gap)}
          />
        </TabsContent>

        <TabsContent value="changes">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Regulatory Changes Monitor</CardTitle>
                <CardDescription>
                  Track regulatory updates and assess impact on your organization
                </CardDescription>
              </CardHeader>
            </Card>
            <RegulatoryChangesView
              changes={changes}
              onChangeSelected={(change) => console.log('Change selected:', change)}
            />
          </div>
        </TabsContent>

        <TabsContent value="roadmap">
          {roadmap && <RoadmapView roadmap={roadmap} />}
        </TabsContent>

        <TabsContent value="audit">
          {auditPlan && (
            <Card>
              <CardHeader>
                <CardTitle>Audit Preparation Plan</CardTitle>
                <CardDescription>
                  Comprehensive audit preparation for {auditPlan.framework.toUpperCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Audit Type</p>
                      <p className="font-medium capitalize">{auditPlan.audit_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <p className="font-medium">{auditPlan.timeline.audit_start.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Readiness</p>
                      <p className="font-medium">{auditPlan.readiness_assessment.overall_readiness}%</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2">Preparation Tasks</h4>
                    <div className="space-y-2">
                      {auditPlan.preparation_tasks.slice(0, 5).map((task, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{task.task}</span>
                          <Badge variant="outline" className="text-xs">
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}; 