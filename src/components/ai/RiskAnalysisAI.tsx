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

import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisySwitch } from '@/components/ui/DaisySwitch';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisySeparator } from '@/components/ui/DaisySeparator';

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
    <DaisyCard 
      className={`cursor-pointer transition-all hover:shadow-md ${
        selected ? 'ring-2 ring-primary border-primary' : ''
      }`}
      onClick={onSelect}
    >
      <DaisyCardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-secondary/10 ${info.color}`}>
            {info.icon}
          </div>
          <div>
            <DaisyCardTitle className="text-lg">{info.name}</DaisyCardTitle>
            <DaisyCardDescription>{info.description}</p>
          </div>
        </div>
      
      <DaisyCardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Categories:</p>
          <div className="flex flex-wrap gap-1">
            {info.categories.map(category => (
              <DaisyBadge key={category} variant="outline" className="text-xs">
                {category}
              </DaisyBadge>
            ))}
          </div>
        </div>
      </DaisyCardBody>
    </DaisyCard>
  );
};

const QuantitativeResultsView: React.FC<{ results: QuantitativeResults }> = ({ results }) => {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DaisyCard>
          <DaisyCardHeader className="pb-2">
            <DaisyCardDescription>Expected Value</p>
          
          <DaisyCardContent>
            <div className="text-2xl font-bold">
              {results.expectedValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              σ = {results.standardDeviation.toFixed(2)}
            </p>
          </DaisyCardBody>
        </DaisyCard>

        <DaisyCard>
          <DaisyCardHeader className="pb-2">
            <DaisyCardDescription>95% Confidence Interval</p>
          
          <DaisyCardContent>
            <div className="text-lg font-semibold">
              {results.confidenceIntervals.find(ci => ci.level === 95)?.lower.toFixed(2)} -{' '}
              {results.confidenceIntervals.find(ci => ci.level === 95)?.upper.toFixed(2)}
            </div>
          </DaisyCardBody>
        </DaisyCard>

        <DaisyCard>
          <DaisyCardHeader className="pb-2">
            <DaisyCardDescription>Value at Risk (95%)</p>
          
          <DaisyCardContent>
            <div className="text-lg font-semibold text-red-600">
              {results.valueAtRisk.find(varItem => varItem.confidence === 95)?.value.toFixed(2)}
            </div>
          </DaisyCardBody>
        </DaisyCard>
      </div>

      {/* Distribution Chart Placeholder */}
      <DaisyCard>
        <DaisyCardHeader>
          <DaisyCardTitle>Risk Distribution</DaisyCardTitle>
          <DaisyCardDescription>Monte Carlo simulation results</p>
        
        <DaisyCardContent>
          <div className="h-64 bg-secondary/10 rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
              <p>Distribution chart would be rendered here</p>
              <p className="text-sm">Bins: {results.distribution.bins.length}</p>
            </div>
          </div>
        </DaisyCardBody>
      </DaisyCard>

      {/* Percentiles */}
      <DaisyCard>
        <DaisyCardHeader>
          <DaisyCardTitle>Key Percentiles</DaisyCardTitle>
        
        <DaisyCardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(results.distribution.percentiles).map(([percentile, value]) => (
              <div key={percentile} className="text-center">
                <p className="text-sm text-muted-foreground">{percentile}th</p>
                <p className="text-lg font-semibold">{value.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </DaisyCardBody>
      </DaisyCard>
    </div>
  );
};

const CorrelationAnalysisView: React.FC<{ analysis: RiskCorrelationAnalysis }> = ({ analysis }) => {
  return (
    <div className="space-y-6">
      {/* Network Metrics */}
      <DaisyCard>
        <DaisyCardHeader>
          <DaisyCardTitle>Network Metrics</DaisyCardTitle>
          <DaisyCardDescription>Risk interconnectedness analysis</p>
        
        <DaisyCardContent>
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
        </DaisyCardBody>
      </DaisyCard>

      {/* Systemic Risk Indicators */}
      <DaisyCard>
        <DaisyCardHeader>
          <DaisyCardTitle>Systemic Risk Indicators</DaisyCardTitle>
          <DaisyCardDescription>System-wide risk assessment</p>
        
        <DaisyCardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Contagion Risk</span>
              <div className="flex items-center gap-2">
                <DaisyProgress value={analysis.systemicRisk.contagionRisk * 100} className="w-24" />
                <span className="text-sm">{(analysis.systemicRisk.contagionRisk * 100).toFixed(1)}%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Vulnerability Index</span>
              <div className="flex items-center gap-2">
                <DaisyProgress value={analysis.systemicRisk.vulnerabilityIndex * 100} className="w-24" />
                <span className="text-sm">{(analysis.systemicRisk.vulnerabilityIndex * 100).toFixed(1)}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Resilience</span>
              <div className="flex items-center gap-2">
                <DaisyProgress value={analysis.systemicRisk.resilience * 100} className="w-24" />
                <span className="text-sm">{(analysis.systemicRisk.resilience * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </DaisyCardBody>
      </DaisyCard>

      {/* Risk Clusters */}
      {analysis.clusters.length > 0 && (
        <DaisyCard>
          <DaisyCardHeader>
            <DaisyCardTitle>Risk Clusters</DaisyCardTitle>
            <DaisyCardDescription>Identified risk groupings</p>
          
          <DaisyCardContent>
            <div className="space-y-3">
              {analysis.clusters.map((cluster, index) => (
                <div key={cluster.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{cluster.name}</h4>
                    <DaisyBadge variant="outline">
                      {cluster.riskIds.length} risks
                    </DaisyBadge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Aggregate Risk: {cluster.aggregateRisk.toFixed(2)}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {cluster.commonFactors.map(factor => (
                      <DaisyBadge key={factor} variant="secondary" className="text-xs">
                        {factor}
                      </DaisyBadge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </DaisyCardBody>
        </DaisyCard>
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
      case 'avoidance': return <DaisyAlertTriangle className="h-4 w-4" />;
      case 'acceptance': return <Clock className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {recommendations.map((recommendation) => (
        <DaisyCard key={recommendation.id}>
          <DaisyCardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  {getTypeIcon(recommendation.type)}
                </div>
                <div>
                  <DaisyCardTitle className="text-lg">{recommendation.title}</DaisyCardTitle>
                  <DaisyCardDescription>{recommendation.description}</p>
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
                <DaisyButton variant="outline" size="sm">
                  View Details
                </DaisyButton>
                <DaisyButton size="sm" onClick={() => onApply(recommendation)}>
                  Apply Recommendation
                </DaisyButton>
              </div>
            </div>
          </DaisyCardBody>
        </DaisyCard>
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
      <DaisyCard>
        <DaisyCardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <DaisyCardTitle>AI-Powered Risk Analysis</DaisyCardTitle>
              <DaisyCardDescription>
                Comprehensive risk assessment using industry-standard frameworks
              </p>
            </div>
          </div>
        
      </DaisyCard>

      <DaisyTabs value={activeTab} onValueChange={setActiveTab}>
        <DaisyTabsList className="grid w-full grid-cols-5">
          <DaisyTabsTrigger value="overview">Overview</DaisyTabsTrigger>
          <DaisyTabsTrigger value="framework">Framework</DaisyTabsTrigger>
          <DaisyTabsTrigger value="configuration">Configuration</DaisyTabsTrigger>
          <DaisyTabsTrigger value="report" disabled={!currentReport}>Report</DaisyTabsTrigger>
          <DaisyTabsTrigger value="recommendations" disabled={!currentReport?.recommendations.length}>
            Recommendations
          </DaisyTabsTrigger>
        </DaisyTabsList>

        <DaisyTabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DaisyCard>
              <DaisyCardHeader className="pb-2">
                <DaisyCardDescription>Available Risks</p>
              
              <DaisyCardContent>
                <div className="text-2xl font-bold">{risks.length}</div>
                <p className="text-xs text-muted-foreground">
                  {risks.filter(r => r.riskScore >= 15).length} high risk
                </p>
              </DaisyCardBody>
            </DaisyCard>

            <DaisyCard>
              <DaisyCardHeader className="pb-2">
                <DaisyCardDescription>Associated Controls</p>
              
              <DaisyCardContent>
                <div className="text-2xl font-bold">{controls.length}</div>
                <p className="text-xs text-muted-foreground">
                  {controls.filter(c => c.effectiveness === 'high').length} highly effective
                </p>
              </DaisyCardBody>
            </DaisyCard>

            <DaisyCard>
              <DaisyCardHeader className="pb-2">
                <DaisyCardDescription>Selected Framework</p>
              
              <DaisyCardContent>
                <div className="text-lg font-semibold">{selectedFramework.toUpperCase()}</div>
                <p className="text-xs text-muted-foreground">Industry standard</p>
              </DaisyCardBody>
            </DaisyCard>

            <DaisyCard>
              <DaisyCardHeader className="pb-2">
                <DaisyCardDescription>Analysis Status</p>
              
              <DaisyCardContent>
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
              </DaisyCardBody>
            </DaisyCard>
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="framework">
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
        </DaisyTabsContent>

        <DaisyTabsContent value="configuration">
          <div className="space-y-6">
            <DaisyCard>
              <DaisyCardHeader>
                <DaisyCardTitle>Analysis Configuration</DaisyCardTitle>
                <DaisyCardDescription>Configure analysis parameters and options</p>
              
              <DaisyCardContent className="space-y-6">
                <div>
                  <DaisyLabel htmlFor="risk-select">Select Risk for Analysis</DaisyLabel>
                  <DaisySelect
                    value={selectedRisk?.id || ''}
                    onValueChange={(value) => setSelectedRisk(risks.find(r => r.id === value) || null)}
                  >
                    <DaisySelectTrigger id="risk-select">
                      <DaisySelectValue placeholder="Choose a risk to analyze" />
                    </SelectTrigger>
                    <DaisySelectContent>
                      {risks.map((risk) => (
                        <DaisySelectItem key={risk.id} value={risk.id}>
                          {risk.title} (Score: {risk.riskScore})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </DaisySelect>
                </div>

                <DaisySeparator />

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">Analysis Options</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <DaisyLabel htmlFor="quantitative">Quantitative Analysis</DaisyLabel>
                      <p className="text-sm text-muted-foreground">
                        Include Monte Carlo simulation and statistical analysis
                      </p>
                    </div>
                    <DaisySwitch
                      id="quantitative"
                      checked={includeQuantitative}
                      onCheckedChange={setIncludeQuantitative}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <DaisyLabel htmlFor="correlation">Correlation Analysis</DaisyLabel>
                      <p className="text-sm text-muted-foreground">
                        Analyze relationships between multiple risks
                      </p>
                    </div>
                    <DaisySwitch
                      id="correlation"
                      checked={includeCorrelation}
                      onCheckedChange={setIncludeCorrelation}
                    />
                  </div>
                </div>

                <DaisySeparator />

                <div className="flex justify-end gap-2">
                  <DaisyButton
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
                  </DaisyButton>
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="report">
          {currentReport && (
            <div className="space-y-6">
              <DaisyCard>
                <DaisyCardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <DaisyCardTitle>Risk Assessment Report</DaisyCardTitle>
                      <DaisyCardDescription>
                        Framework: {currentReport.framework.toUpperCase()} | 
                        Generated: {currentReport.assessmentDate.toLocaleDateString()}
                      </p>
                    </div>
                    <DaisyButton onClick={exportReport} variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Export
                    </DaisyButton>
                  </div>
                
                <DaisyCardContent>
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
                </DaisyCardBody>
              </DaisyCard>
            </div>
          )}
        </DaisyTabsContent>

        <DaisyTabsContent value="recommendations">
          {currentReport?.recommendations && currentReport.recommendations.length > 0 && (
            <div className="space-y-6">
              <DaisyCard>
                <DaisyCardHeader>
                  <DaisyCardTitle>AI-Generated Recommendations</DaisyCardTitle>
                  <DaisyCardDescription>
                    Actionable recommendations based on risk analysis
                  </p>
                
                <DaisyCardContent>
                  <RecommendationsView
                    recommendations={currentReport.recommendations}
                    onApply={handleApplyRecommendation}
                  />
                </DaisyCardBody>
              </DaisyCard>
            </div>
          )}
        </DaisyTabsContent>
      </DaisyTabs>
    </div>
  );
}; 