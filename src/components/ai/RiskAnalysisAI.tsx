import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  Settings,
  Play,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Zap,
  Brain,
  Activity
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

import { Risk, Control } from '@/types';
import { 
  riskAnalysisAIService, 
  RiskAssessmentReport, 
  RiskCorrelationAnalysis,
  QuantitativeResults,
  RiskRecommendation
} from '@/services/RiskAnalysisAIService';

interface RiskAnalysisAIProps {
  risks: Risk[];
  controls?: Control[];
  onReportGenerated?: (report: RiskAssessmentReport) => void;
  onRecommendationApplied?: (recommendation: RiskRecommendation) => void;
  className?: string;
}

const FrameworkCard: React.FC<{
  framework: 'coso' | 'iso31000' | 'nist';
  selected: boolean;
  onSelect: () => void;
}> = ({ framework, selected, onSelect }) => {
  const frameworkInfo = {
    coso: {
      name: 'COSO ERM',
      description: 'Enterprise Risk Management Framework',
      icon: <Target className="h-6 w-6" />,
      color: 'text-blue-600',
      categories: ['Strategic', 'Operations', 'Reporting', 'Compliance']
    },
    iso31000: {
      name: 'ISO 31000',
      description: 'International Risk Management Standard',
      icon: <Activity className="h-6 w-6" />,
      color: 'text-green-600',
      categories: ['Strategic', 'Operational', 'Financial', 'Hazard', 'Compliance']
    },
    nist: {
      name: 'NIST RMF',
      description: 'Cybersecurity Risk Management Framework',
      icon: <Zap className="h-6 w-6" />,
      color: 'text-[#191919]',
      categories: ['Technical', 'Operational', 'Management']
    }
  };

  const info = frameworkInfo[framework];

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        selected ? 'ring-2 ring-primary border-primary' : ''
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-secondary/10 ${info.color}`}>
            {info.icon}
          </div>
          <div>
            <CardTitle className="text-lg">{info.name}</CardTitle>
            <CardDescription>{info.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Categories:</p>
          <div className="flex flex-wrap gap-1">
            {info.categories.map(category => (
              <Badge key={category} variant="outline" className="text-xs">
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const QuantitativeResultsView: React.FC<{ results: QuantitativeResults }> = ({ results }) => {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Expected Value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {results.expectedValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              σ = {results.standardDeviation.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>95% Confidence Interval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {results.confidenceIntervals.find(ci => ci.level === 95)?.lower.toFixed(2)} -{' '}
              {results.confidenceIntervals.find(ci => ci.level === 95)?.upper.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Value at Risk (95%)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-red-600">
              {results.valueAtRisk.find(varItem => varItem.confidence === 95)?.value.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Distribution</CardTitle>
          <CardDescription>Monte Carlo simulation results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-secondary/10 rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
              <p>Distribution chart would be rendered here</p>
              <p className="text-sm">Bins: {results.distribution.bins.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Percentiles */}
      <Card>
        <CardHeader>
          <CardTitle>Key Percentiles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(results.distribution.percentiles).map(([percentile, value]) => (
              <div key={percentile} className="text-center">
                <p className="text-sm text-muted-foreground">{percentile}th</p>
                <p className="text-lg font-semibold">{value.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const CorrelationAnalysisView: React.FC<{ analysis: RiskCorrelationAnalysis }> = ({ analysis }) => {
  return (
    <div className="space-y-6">
      {/* Network Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Network Metrics</CardTitle>
          <CardDescription>Risk interconnectedness analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Density</p>
              <p className="text-2xl font-bold">{(analysis.networkMetrics.density * 100).toFixed(1)}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Clustering</p>
              <p className="text-2xl font-bold">{(analysis.networkMetrics.clustering * 100).toFixed(1)}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Avg Path Length</p>
              <p className="text-2xl font-bold">{analysis.networkMetrics.averagePathLength.toFixed(1)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Critical Paths</p>
              <p className="text-2xl font-bold">{analysis.networkMetrics.criticalPaths.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Systemic Risk Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Systemic Risk Indicators</CardTitle>
          <CardDescription>System-wide risk assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Contagion Risk</span>
              <div className="flex items-center gap-2">
                <Progress value={analysis.systemicRisk.contagionRisk * 100} className="w-24" />
                <span className="text-sm">{(analysis.systemicRisk.contagionRisk * 100).toFixed(1)}%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Vulnerability Index</span>
              <div className="flex items-center gap-2">
                <Progress value={analysis.systemicRisk.vulnerabilityIndex * 100} className="w-24" />
                <span className="text-sm">{(analysis.systemicRisk.vulnerabilityIndex * 100).toFixed(1)}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Resilience</span>
              <div className="flex items-center gap-2">
                <Progress value={analysis.systemicRisk.resilience * 100} className="w-24" />
                <span className="text-sm">{(analysis.systemicRisk.resilience * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Clusters */}
      {analysis.clusters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Risk Clusters</CardTitle>
            <CardDescription>Identified risk groupings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.clusters.map((cluster, index) => (
                <div key={cluster.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{cluster.name}</h4>
                    <Badge variant="outline">
                      {cluster.riskIds.length} risks
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Aggregate Risk: {cluster.aggregateRisk.toFixed(2)}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {cluster.commonFactors.map(factor => (
                      <Badge key={factor} variant="secondary" className="text-xs">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const RecommendationsView: React.FC<{
  recommendations: RiskRecommendation[];
  onApply: (recommendation: RiskRecommendation) => void;
}> = ({ recommendations, onApply }) => {
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
      case 'mitigation': return <CheckCircle className="h-4 w-4" />;
      case 'transfer': return <TrendingUp className="h-4 w-4" />;
      case 'avoidance': return <AlertTriangle className="h-4 w-4" />;
      case 'acceptance': return <Clock className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {recommendations.map((recommendation) => (
        <Card key={recommendation.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  {getTypeIcon(recommendation.type)}
                </div>
                <div>
                  <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                  <CardDescription>{recommendation.description}</CardDescription>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Expected Cost</p>
                  <p className="font-semibold">${recommendation.estimatedCost.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Implementation Time</p>
                  <p className="font-semibold">{recommendation.implementationTime} days</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-semibold capitalize">{recommendation.type}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Rationale</p>
                <p className="text-sm text-muted-foreground">{recommendation.rationale}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Expected Benefit</p>
                <p className="text-sm text-muted-foreground">{recommendation.expectedBenefit}</p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                <Button size="sm" onClick={() => onApply(recommendation)}>
                  Apply Recommendation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export const RiskAnalysisAI: React.FC<RiskAnalysisAIProps> = ({
  risks,
  controls = [],
  onReportGenerated,
  onRecommendationApplied,
  className = ''
}) => {
  const [selectedFramework, setSelectedFramework] = useState<'coso' | 'iso31000' | 'nist'>('coso');
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(risks[0] || null);
  const [includeQuantitative, setIncludeQuantitative] = useState(true);
  const [includeCorrelation, setIncludeCorrelation] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentReport, setCurrentReport] = useState<RiskAssessmentReport | null>(null);
  const [correlationAnalysis, setCorrelationAnalysis] = useState<RiskCorrelationAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const handleAnalyzeRisk = async () => {
    if (!selectedRisk) return;

    setIsAnalyzing(true);
    try {
      const report = await riskAnalysisAIService.assessRisk(
        selectedRisk,
        selectedFramework,
        {
          includeQuantitative,
          includeCorrelation,
          controls,
          assessor: 'ARIA AI Assistant'
        }
      );

      setCurrentReport(report);
      onReportGenerated?.(report);

      if (includeCorrelation && risks.length > 1) {
        const correlation = await riskAnalysisAIService.analyzeRiskCorrelations(risks);
        setCorrelationAnalysis(correlation);
      }

      setActiveTab('report');
    } catch (error) {
      console.error('Risk analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyRecommendation = (recommendation: RiskRecommendation) => {
    onRecommendationApplied?.(recommendation);
  };

  const exportReport = async () => {
    if (!currentReport) return;
    
    // Implementation for report export
    console.log('Exporting report:', currentReport.id);
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
              <CardTitle>AI-Powered Risk Analysis</CardTitle>
              <CardDescription>
                Comprehensive risk assessment using industry-standard frameworks
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="framework">Framework</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="report" disabled={!currentReport}>Report</TabsTrigger>
          <TabsTrigger value="recommendations" disabled={!currentReport?.recommendations.length}>
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Available Risks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{risks.length}</div>
                <p className="text-xs text-muted-foreground">
                  {risks.filter(r => r.riskScore >= 15).length} high risk
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Associated Controls</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{controls.length}</div>
                <p className="text-xs text-muted-foreground">
                  {controls.filter(c => c.effectiveness === 'high').length} highly effective
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Selected Framework</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{selectedFramework.toUpperCase()}</div>
                <p className="text-xs text-muted-foreground">Industry standard</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Analysis Status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {currentReport ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="text-sm font-medium">
                    {currentReport ? 'Complete' : 'Pending'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="framework">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Select Risk Framework</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FrameworkCard
                  framework="coso"
                  selected={selectedFramework === 'coso'}
                  onSelect={() => setSelectedFramework('coso')}
                />
                <FrameworkCard
                  framework="iso31000"
                  selected={selectedFramework === 'iso31000'}
                  onSelect={() => setSelectedFramework('iso31000')}
                />
                <FrameworkCard
                  framework="nist"
                  selected={selectedFramework === 'nist'}
                  onSelect={() => setSelectedFramework('nist')}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="configuration">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analysis Configuration</CardTitle>
                <CardDescription>Configure analysis parameters and options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="risk-select">Select Risk for Analysis</Label>
                  <Select
                    value={selectedRisk?.id || ''}
                    onValueChange={(value) => setSelectedRisk(risks.find(r => r.id === value) || null)}
                  >
                    <SelectTrigger id="risk-select">
                      <SelectValue placeholder="Choose a risk to analyze" />
                    </SelectTrigger>
                    <SelectContent>
                      {risks.map((risk) => (
                        <SelectItem key={risk.id} value={risk.id}>
                          {risk.title} (Score: {risk.riskScore})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">Analysis Options</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="quantitative">Quantitative Analysis</Label>
                      <p className="text-sm text-muted-foreground">
                        Include Monte Carlo simulation and statistical analysis
                      </p>
                    </div>
                    <Switch
                      id="quantitative"
                      checked={includeQuantitative}
                      onCheckedChange={setIncludeQuantitative}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="correlation">Correlation Analysis</Label>
                      <p className="text-sm text-muted-foreground">
                        Analyze relationships between multiple risks
                      </p>
                    </div>
                    <Switch
                      id="correlation"
                      checked={includeCorrelation}
                      onCheckedChange={setIncludeCorrelation}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end gap-2">
                  <Button
                    onClick={handleAnalyzeRisk}
                    disabled={!selectedRisk || isAnalyzing}
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
                        Start Analysis
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="report">
          {currentReport && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Risk Assessment Report</CardTitle>
                      <CardDescription>
                        Framework: {currentReport.framework.toUpperCase()} | 
                        Generated: {currentReport.assessmentDate.toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Button onClick={exportReport} variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Executive Summary</h4>
                      <p className="text-sm text-muted-foreground">
                        {currentReport.executiveSummary}
                      </p>
                    </div>

                    {currentReport.quantitativeAnalysis && (
                      <div>
                        <h4 className="font-semibold mb-4">Quantitative Analysis</h4>
                        <QuantitativeResultsView results={currentReport.quantitativeAnalysis.results} />
                      </div>
                    )}

                    {correlationAnalysis && (
                      <div>
                        <h4 className="font-semibold mb-4">Correlation Analysis</h4>
                        <CorrelationAnalysisView analysis={correlationAnalysis} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations">
          {currentReport?.recommendations && currentReport.recommendations.length > 0 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI-Generated Recommendations</CardTitle>
                  <CardDescription>
                    Actionable recommendations based on risk analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecommendationsView
                    recommendations={currentReport.recommendations}
                    onApply={handleApplyRecommendation}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}; 