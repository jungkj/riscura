'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ContentCard } from '@/components/layout/MainContentArea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Calculator,
  Eye,
  RotateCcw,
  Minus,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

// Import our API services
import { api, Risk } from '@/lib/mockData';
import { aiService } from '@/lib/mockAI';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface RiskPosition {
  id: string;
  title: string;
  impact: number; // 1-5
  likelihood: number; // 1-5
  x: number; // Grid position
  y: number; // Grid position
  category: string;
  status: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
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

interface RiskFactor {
  id: string;
  name: string;
  description: string;
  category: 'LIKELIHOOD' | 'IMPACT';
  weight: number;
  value: number; // 1-5 scale
  justification?: string;
}

interface RiskAssessment {
  id?: string;
  riskId?: string;
  title: string;
  description: string;
  category: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: RiskFactor[];
  mitigatingControls: string[];
  residualLikelihood: number;
  residualImpact: number;
  residualRiskScore: number;
  assessmentDate: string;
  nextReviewDate: string;
  assessor: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  comments?: string;
  aiAnalysis?: {
    confidence: number;
    recommendations: string[];
    insights: string[];
  };
}

interface MatrixCell {
  likelihood: number;
  impact: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  color: string;
  risks: string[];
}

// ============================================================================
// RISK SCORING ALGORITHMS
// ============================================================================

class RiskScoringEngine {
  // Standard 5x5 risk matrix
  private static readonly RISK_MATRIX: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
    '1-1': 'LOW', '1-2': 'LOW', '1-3': 'LOW', '1-4': 'MEDIUM', '1-5': 'MEDIUM',
    '2-1': 'LOW', '2-2': 'LOW', '2-3': 'MEDIUM', '2-4': 'MEDIUM', '2-5': 'HIGH',
    '3-1': 'LOW', '3-2': 'MEDIUM', '3-3': 'MEDIUM', '3-4': 'HIGH', '3-5': 'HIGH',
    '4-1': 'MEDIUM', '4-2': 'MEDIUM', '4-3': 'HIGH', '4-4': 'HIGH', '4-5': 'CRITICAL',
    '5-1': 'MEDIUM', '5-2': 'HIGH', '5-3': 'HIGH', '5-4': 'CRITICAL', '5-5': 'CRITICAL',
  };

  private static readonly LEVEL_COLORS = {
    LOW: '#22c55e',
    MEDIUM: '#eab308',
    HIGH: '#f97316',
    CRITICAL: '#dc2626',
  };

  // Calculate risk score using weighted factors
  static calculateRiskScore(factors: RiskFactor[]): { likelihood: number; impact: number; score: number } {
    const likelihoodFactors = factors.filter(f => f.category === 'LIKELIHOOD');
    const impactFactors = factors.filter(f => f.category === 'IMPACT');

    const likelihood = this.calculateWeightedAverage(likelihoodFactors);
    const impact = this.calculateWeightedAverage(impactFactors);
    const score = likelihood * impact;

    return { likelihood, impact, score };
  }

  // Calculate weighted average for factors
  private static calculateWeightedAverage(factors: RiskFactor[]): number {
    if (factors.length === 0) return 1;

    const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
    const weightedSum = factors.reduce((sum, factor) => sum + (factor.value * factor.weight), 0);

    return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 1;
  }

  // Determine risk level from likelihood and impact
  static getRiskLevel(likelihood: number, impact: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const likelihoodRounded = Math.round(likelihood);
    const impactRounded = Math.round(impact);
    const key = `${likelihoodRounded}-${impactRounded}`;
    return this.RISK_MATRIX[key] || 'LOW';
  }

  // Get color for risk level
  static getRiskColor(level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): string {
    return this.LEVEL_COLORS[level];
  }

  // Generate matrix data for visualization
  static generateMatrixData(): MatrixCell[][] {
    const matrix: MatrixCell[][] = [];
    
    for (let impact = 5; impact >= 1; impact--) {
      const row: MatrixCell[] = [];
      for (let likelihood = 1; likelihood <= 5; likelihood++) {
        const level = this.getRiskLevel(likelihood, impact);
        row.push({
          likelihood,
          impact,
          level,
          color: this.LEVEL_COLORS[level],
          risks: [], // Will be populated with actual risks
        });
      }
      matrix.push(row);
    }
    
    return matrix;
  }
}

// ============================================================================
// DEFAULT RISK FACTORS
// ============================================================================

const DEFAULT_LIKELIHOOD_FACTORS: Omit<RiskFactor, 'id' | 'value' | 'justification'>[] = [
  {
    name: 'Historical Frequency',
    description: 'How often has this type of risk occurred in the past?',
    category: 'LIKELIHOOD',
    weight: 0.3,
  },
  {
    name: 'Current Controls',
    description: 'Effectiveness of existing controls in preventing this risk',
    category: 'LIKELIHOOD',
    weight: 0.25,
  },
  {
    name: 'Environmental Factors',
    description: 'External factors that could increase likelihood',
    category: 'LIKELIHOOD',
    weight: 0.2,
  },
  {
    name: 'Process Complexity',
    description: 'Complexity of processes that could lead to this risk',
    category: 'LIKELIHOOD',
    weight: 0.15,
  },
  {
    name: 'Human Factors',
    description: 'Human error or intentional actions that could trigger this risk',
    category: 'LIKELIHOOD',
    weight: 0.1,
  },
];

const DEFAULT_IMPACT_FACTORS: Omit<RiskFactor, 'id' | 'value' | 'justification'>[] = [
  {
    name: 'Financial Impact',
    description: 'Direct and indirect financial losses',
    category: 'IMPACT',
    weight: 0.3,
  },
  {
    name: 'Operational Impact',
    description: 'Disruption to business operations and processes',
    category: 'IMPACT',
    weight: 0.25,
  },
  {
    name: 'Reputational Impact',
    description: 'Damage to organization reputation and brand',
    category: 'IMPACT',
    weight: 0.2,
  },
  {
    name: 'Regulatory Impact',
    description: 'Regulatory fines, sanctions, or compliance issues',
    category: 'IMPACT',
    weight: 0.15,
  },
  {
    name: 'Strategic Impact',
    description: 'Impact on strategic objectives and long-term goals',
    category: 'IMPACT',
    weight: 0.1,
  },
];

// ============================================================================
// RISK ASSESSMENT MATRIX COMPONENT
// ============================================================================

const RiskAssessmentMatrix: React.FC = () => {
  const [assessment, setAssessment] = useState<RiskAssessment>({
    title: '',
    description: '',
    category: 'OPERATIONAL',
    likelihood: 1,
    impact: 1,
    riskScore: 1,
    riskLevel: 'LOW',
    factors: [],
    mitigatingControls: [],
    residualLikelihood: 1,
    residualImpact: 1,
    residualRiskScore: 1,
    assessmentDate: new Date().toISOString().split('T')[0],
    nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    assessor: '',
    status: 'DRAFT',
  });

  const [existingRisks, setExistingRisks] = useState<Risk[]>([]);
  const [selectedTab, setSelectedTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);

  // Initialize factors
  useEffect(() => {
    const likelihoodFactors = DEFAULT_LIKELIHOOD_FACTORS.map((factor, index) => ({
      ...factor,
      id: `likelihood-${index}`,
      value: 1,
    }));

    const impactFactors = DEFAULT_IMPACT_FACTORS.map((factor, index) => ({
      ...factor,
      id: `impact-${index}`,
      value: 1,
    }));

    setAssessment(prev => ({
      ...prev,
      factors: [...likelihoodFactors, ...impactFactors],
    }));
  }, []);

  // Load existing risks for matrix visualization
  useEffect(() => {
    const loadRisks = async () => {
      try {
        const response = await api.risks.getRisks({ limit: 1000 });
        // Validate and ensure data is an array of Risk objects
        const risks = Array.isArray(response.data) ? response.data : [];
        setExistingRisks(risks);
      } catch (error) {
        console.error('Failed to load risks:', error);
      }
    };
    loadRisks();
  }, []);

  // Calculate risk scores when factors change
  useEffect(() => {
    const { likelihood, impact, score } = RiskScoringEngine.calculateRiskScore(assessment.factors);
    const riskLevel = RiskScoringEngine.getRiskLevel(likelihood, impact);

    setAssessment(prev => ({
      ...prev,
      likelihood,
      impact,
      riskScore: score,
      riskLevel: riskLevel,
    }));
  }, [assessment.factors]);

  // Update factor value
  const updateFactor = (factorId: string, field: keyof RiskFactor, value: any) => {
    setAssessment(prev => ({
      ...prev,
      factors: prev.factors.map(factor =>
        factor.id === factorId ? { ...factor, [field]: value } : factor
      ),
    }));
  };

  // Add mitigating control
  const addMitigatingControl = () => {
    setAssessment(prev => ({
      ...prev,
      mitigatingControls: [...prev.mitigatingControls, ''],
    }));
  };

  // Update mitigating control
  const updateMitigatingControl = (index: number, value: string) => {
    setAssessment(prev => ({
      ...prev,
      mitigatingControls: prev.mitigatingControls.map((control, i) =>
        i === index ? value : control
      ),
    }));
  };

  // Remove mitigating control
  const removeMitigatingControl = (index: number) => {
    setAssessment(prev => ({
      ...prev,
      mitigatingControls: prev.mitigatingControls.filter((_, i) => i !== index),
    }));
  };

  // Get AI analysis
  const getAIAnalysis = async () => {
    if (!assessment.title || !assessment.description) {
      toast.error('Please provide a title and description before AI analysis');
      return;
    }

    try {
      setAiAnalyzing(true);
      const analysis = await aiService.risk.analyzeRisk({
        title: assessment.title,
        description: assessment.description,
        category: assessment.category,
        context: {
          likelihood: assessment.likelihood,
          impact: assessment.impact,
          factors: assessment.factors,
        },
      });

      setAssessment(prev => ({
        ...prev,
        aiAnalysis: {
          confidence: analysis.confidence,
          recommendations: analysis.recommendations?.map(r => r.description) || [],
          insights: analysis.insights?.map(i => i.finding) || [],
        },
      }));

      toast.success('AI analysis completed');
    } catch (error) {
      console.error('AI analysis failed:', error);
      toast.error('Failed to get AI analysis');
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Save assessment
  const saveAssessment = async () => {
    try {
      setLoading(true);
      
      const riskData = {
        title: assessment.title,
        description: assessment.description,
        category: assessment.category as any,
        likelihood: assessment.likelihood,
        impact: assessment.impact,
        riskScore: assessment.riskScore,
        riskLevel: assessment.riskLevel.toLowerCase() as 'low' | 'medium' | 'high' | 'critical',
        status: 'assessed' as const,
        dateIdentified: assessment.assessmentDate,
        nextReview: new Date(assessment.nextReviewDate),
        owner: assessment.assessor,
      };

      if (assessment.riskId) {
        await api.risks.updateRisk(assessment.riskId, riskData);
        toast.success('Risk assessment updated successfully');
      } else {
        await api.risks.createRisk(riskData);
        toast.success('Risk assessment saved successfully');
      }

      // Reset form
      setAssessment(prev => ({
        ...prev,
        title: '',
        description: '',
        status: 'DRAFT',
      }));
    } catch (error) {
      console.error('Failed to save assessment:', error);
      toast.error('Failed to save risk assessment');
    } finally {
      setLoading(false);
    }
  };

  // Reset assessment
  const resetAssessment = () => {
    setAssessment(prev => ({
      ...prev,
      title: '',
      description: '',
      category: 'OPERATIONAL',
      status: 'DRAFT',
      comments: '',
      factors: prev.factors.map(factor => ({ ...factor, value: 1, justification: '' })),
      mitigatingControls: [],
    }));
  };

  // Generate matrix data with current risks
  const matrixData = useMemo(() => {
    const matrix = RiskScoringEngine.generateMatrixData();
    
    // Populate matrix with existing risks
    existingRisks.forEach(risk => {
      const likelihoodRounded = Math.round(risk.likelihood);
      const impactRounded = Math.round(risk.impact);
      
      if (likelihoodRounded >= 1 && likelihoodRounded <= 5 && 
          impactRounded >= 1 && impactRounded <= 5) {
        const row = 5 - impactRounded;
        const col = likelihoodRounded - 1;
        if (matrix[row] && matrix[row][col]) {
          matrix[row][col].risks.push(risk.title);
        }
      }
    });

    return matrix;
  }, [existingRisks]);

  const likelihoodFactors = assessment.factors.filter(f => f.category === 'LIKELIHOOD');
  const impactFactors = assessment.factors.filter(f => f.category === 'IMPACT');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Risk Assessment Matrix</h1>
          <p className="text-sm text-gray-600 mt-1">
            Comprehensive risk assessment using quantitative and qualitative factors
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowMatrix(true)}>
            <Eye className="h-4 w-4 mr-2" />
            View Matrix
          </Button>
          <Button variant="outline" size="sm" onClick={resetAssessment}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={saveAssessment} disabled={loading || !assessment.title}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Assessment'}
          </Button>
        </div>
      </div>

      {/* Risk Score Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Risk Score Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{assessment.likelihood.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Likelihood</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{assessment.impact.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Impact</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{assessment.riskScore.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Risk Score</div>
            </div>
            <div className="text-center">
              <Badge 
                style={{ 
                  backgroundColor: RiskScoringEngine.getRiskColor(assessment.riskLevel.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'),
                  color: 'white',
                  fontSize: '14px',
                  padding: '8px 16px'
                }}
              >
                {assessment.riskLevel.toUpperCase()}
              </Badge>
              <div className="text-sm text-gray-600 mt-1">Risk Level</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Form */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="factors">Risk Factors</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Risk Information</CardTitle>
              <CardDescription>
                Provide fundamental information about the risk being assessed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Risk Title *</Label>
                  <Input
                    id="title"
                    value={assessment.title}
                    onChange={(e) => setAssessment(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter a descriptive title for this risk"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Risk Category</Label>
                  <Select
                    value={assessment.category}
                    onValueChange={(value) => setAssessment(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPERATIONAL">Operational</SelectItem>
                      <SelectItem value="FINANCIAL">Financial</SelectItem>
                      <SelectItem value="STRATEGIC">Strategic</SelectItem>
                      <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                      <SelectItem value="TECHNOLOGY">Technology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Risk Description *</Label>
                <Textarea
                  id="description"
                  value={assessment.description}
                  onChange={(e) => setAssessment(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide a detailed description of the risk..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assessor">Assessor</Label>
                  <Input
                    id="assessor"
                    value={assessment.assessor}
                    onChange={(e) => setAssessment(prev => ({ ...prev, assessor: e.target.value }))}
                    placeholder="Risk assessor name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="assessmentDate">Assessment Date</Label>
                  <Input
                    id="assessmentDate"
                    type="date"
                    value={assessment.assessmentDate}
                    onChange={(e) => setAssessment(prev => ({ ...prev, assessmentDate: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nextReviewDate">Next Review Date</Label>
                  <Input
                    id="nextReviewDate"
                    type="date"
                    value={assessment.nextReviewDate}
                    onChange={(e) => setAssessment(prev => ({ ...prev, nextReviewDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">Additional Comments</Label>
                <Textarea
                  id="comments"
                  value={assessment.comments || ''}
                  onChange={(e) => setAssessment(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder="Any additional comments or notes..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factors" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Likelihood Factors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Likelihood Factors
                </CardTitle>
                <CardDescription>
                  Assess factors that influence the probability of this risk occurring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {likelihoodFactors.map((factor) => (
                      <div key={factor.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{factor.name}</h4>
                          <Badge variant="outline">Weight: {(factor.weight * 100).toFixed(0)}%</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{factor.description}</p>
                        
                        <div className="space-y-2">
                          <Label>Score (1-5)</Label>
                          <Select
                            value={factor.value.toString()}
                            onValueChange={(value) => updateFactor(factor.id, 'value', parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 - Very Low</SelectItem>
                              <SelectItem value="2">2 - Low</SelectItem>
                              <SelectItem value="3">3 - Medium</SelectItem>
                              <SelectItem value="4">4 - High</SelectItem>
                              <SelectItem value="5">5 - Very High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Justification</Label>
                          <Textarea
                            value={factor.justification || ''}
                            onChange={(e) => updateFactor(factor.id, 'justification', e.target.value)}
                            placeholder="Explain your scoring rationale..."
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Impact Factors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Impact Factors
                </CardTitle>
                <CardDescription>
                  Assess the potential consequences if this risk materializes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {impactFactors.map((factor) => (
                      <div key={factor.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{factor.name}</h4>
                          <Badge variant="outline">Weight: {(factor.weight * 100).toFixed(0)}%</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{factor.description}</p>
                        
                        <div className="space-y-2">
                          <Label>Score (1-5)</Label>
                          <Select
                            value={factor.value.toString()}
                            onValueChange={(value) => updateFactor(factor.id, 'value', parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 - Minimal</SelectItem>
                              <SelectItem value="2">2 - Minor</SelectItem>
                              <SelectItem value="3">3 - Moderate</SelectItem>
                              <SelectItem value="4">4 - Major</SelectItem>
                              <SelectItem value="5">5 - Severe</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Justification</Label>
                          <Textarea
                            value={factor.justification || ''}
                            onChange={(e) => updateFactor(factor.id, 'justification', e.target.value)}
                            placeholder="Explain your scoring rationale..."
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Mitigating Controls
              </CardTitle>
              <CardDescription>
                Identify existing or planned controls that mitigate this risk
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {assessment.mitigatingControls.map((control, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={control}
                    onChange={(e) => updateMitigatingControl(index, e.target.value)}
                    placeholder="Describe the mitigating control..."
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeMitigatingControl(index)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button variant="outline" onClick={addMitigatingControl}>
                <Plus className="h-4 w-4 mr-2" />
                Add Control
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                AI Risk Analysis
              </CardTitle>
              <CardDescription>
                Get AI-powered insights and recommendations for this risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={getAIAnalysis} 
                disabled={aiAnalyzing || !assessment.title || !assessment.description}
              >
                {aiAnalyzing ? 'Analyzing...' : 'Get AI Analysis'}
              </Button>

              {assessment.aiAnalysis && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Confidence: {(assessment.aiAnalysis.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>

                  {assessment.aiAnalysis.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Recommendations</h4>
                      <ul className="space-y-1">
                        {assessment.aiAnalysis.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {assessment.aiAnalysis.insights.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Key Insights</h4>
                      <ul className="space-y-1">
                        {assessment.aiAnalysis.insights.map((insight, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Risk Matrix Dialog */}
      <Dialog open={showMatrix} onOpenChange={setShowMatrix}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Risk Assessment Matrix</DialogTitle>
            <DialogDescription>
              5x5 risk matrix showing likelihood vs impact with current risk positions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-6 gap-1">
              {/* Header row */}
              <div className="p-2 text-center font-medium">Impact →<br/>Likelihood ↓</div>
              {[1, 2, 3, 4, 5].map(impact => (
                <div key={impact} className="p-2 text-center font-medium bg-gray-100">
                  {impact}
                </div>
              ))}
              
              {/* Matrix rows */}
              {matrixData.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  <div className="p-2 text-center font-medium bg-gray-100">
                    {5 - rowIndex}
                  </div>
                  {row.map((cell, colIndex) => (
                    <div
                      key={colIndex}
                      className="p-2 border border-gray-300 min-h-[60px] relative"
                      style={{ backgroundColor: cell.color + '20' }}
                    >
                      <div className="text-xs font-medium text-center">
                        {cell.level}
                      </div>
                      {cell.risks.length > 0 && (
                        <div className="text-xs mt-1">
                          {cell.risks.slice(0, 2).map((risk, i) => (
                            <div key={i} className="truncate">{risk}</div>
                          ))}
                          {cell.risks.length > 2 && (
                            <div className="text-gray-500">+{cell.risks.length - 2} more</div>
                          )}
                        </div>
                      )}
                      
                      {/* Current assessment position */}
                      {Math.round(assessment.likelihood) === cell.likelihood && 
                       Math.round(assessment.impact) === cell.impact && (
                        <div className="absolute inset-0 border-2 border-red-500 bg-red-500 bg-opacity-20 flex items-center justify-center">
                          <div className="bg-red-500 text-white text-xs px-1 rounded">Current</div>
                        </div>
                      )}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
            
            <div className="flex justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4" style={{ backgroundColor: RiskScoringEngine.getRiskColor('LOW') }}></div>
                <span>Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4" style={{ backgroundColor: RiskScoringEngine.getRiskColor('MEDIUM') }}></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4" style={{ backgroundColor: RiskScoringEngine.getRiskColor('HIGH') }}></div>
                <span>High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4" style={{ backgroundColor: RiskScoringEngine.getRiskColor('CRITICAL') }}></div>
                <span>Critical</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RiskAssessmentMatrix; 