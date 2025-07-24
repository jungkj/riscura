'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { Slider } from '@/components/ui/slider';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import {
  AlertTriangle,
  Brain,
  Target,
  TrendingUp,
  TrendingDown,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Eye,
  Download,
  Share,
  Plus,
  Minus,
  Activity,
  Clock,
  DollarSign,
  Users,
  Shield,
  Server,
  FileText,
  BarChart3,
  PieChart,
  LineChart,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Info,
} from 'lucide-react';

// Types
interface RiskScenario {
  id: string;
  name: string;
  description: string;
  category: 'cybersecurity' | 'operational' | 'financial' | 'compliance' | 'strategic';
  probability: number; // 0-100
  impact: number; // 0-100
  riskScore: number;
  triggers: ScenarioTrigger[];
  consequences: ScenarioConsequence[];
  mitigations: ScenarioMitigation[];
  timeline: string;
  affectedAssets: string[];
  financialImpact: {
    min: number;
    max: number;
    currency: string;
  };
  aiConfidence: number;
  lastUpdated: Date;
  status: 'active' | 'monitoring' | 'resolved' | 'archived';
}

interface ScenarioTrigger {
  id: string;
  event: string;
  probability: number;
  dependencies: string[];
}

interface ScenarioConsequence {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected: string[];
  timeToImpact: string;
}

interface ScenarioMitigation {
  id: string;
  action: string;
  effectiveness: number; // 0-100
  cost: number;
  timeToImplement: string;
  responsible: string;
}

interface ScenarioSimulation {
  id: string;
  scenarioId: string;
  parameters: SimulationParameters;
  results: SimulationResults;
  createdAt: Date;
}

interface SimulationParameters {
  timeframe: number; // days
  iterations: number;
  variables: { [key: string]: number };
}

interface SimulationResults {
  averageImpact: number;
  worstCase: number;
  bestCase: number;
  probability: number;
  timeline: TimelinePoint[];
  recommendations: string[];
}

interface TimelinePoint {
  day: number;
  probability: number;
  impact: number;
  events: string[];
}

// Sample Risk Scenarios
const sampleScenarios: RiskScenario[] = [
  {
    id: 'SCENARIO-001',
    name: 'Advanced Persistent Threat (APT)',
    description: 'Sophisticated cyberattack targeting sensitive data and systems through multiple attack vectors over extended period.',
    category: 'cybersecurity',
    probability: 78,
    impact: 95,
    riskScore: 74,
    triggers: [
      {
        id: 'T1',
        event: 'Phishing email clicked by employee',
        probability: 65,
        dependencies: ['Email security controls', 'User training'],
      },
      {
        id: 'T2',
        event: 'Lateral movement through network',
        probability: 85,
        dependencies: ['Network segmentation', 'Monitoring systems'],
      },
    ],
    consequences: [
      {
        id: 'C1',
        description: 'Customer data exfiltration',
        severity: 'critical',
        affected: ['Customer database', 'PII records'],
        timeToImpact: '2-7 days',
      },
      {
        id: 'C2',
        description: 'System downtime and service disruption',
        severity: 'high',
        affected: ['Production systems', 'Customer services'],
        timeToImpact: '1-3 days',
      },
    ],
    mitigations: [
      {
        id: 'M1',
        action: 'Implement zero-trust architecture',
        effectiveness: 85,
        cost: 250000,
        timeToImplement: '3-6 months',
        responsible: 'IT Security Team',
      },
      {
        id: 'M2',
        action: 'Enhanced employee security training',
        effectiveness: 70,
        cost: 50000,
        timeToImplement: '1-2 months',
        responsible: 'HR Department',
      },
    ],
    timeline: '30-90 days',
    affectedAssets: ['Customer Database', 'Payment Systems', 'Internal Networks'],
    financialImpact: {
      min: 500000,
      max: 5000000,
      currency: 'USD',
    },
    aiConfidence: 87,
    lastUpdated: new Date('2024-01-20'),
    status: 'active',
  },
  {
    id: 'SCENARIO-002',
    name: 'Supply Chain Disruption',
    description: 'Critical supplier failure causing operational disruptions and delivery delays.',
    category: 'operational',
    probability: 45,
    impact: 75,
    riskScore: 34,
    triggers: [
      {
        id: 'T3',
        event: 'Key supplier bankruptcy or closure',
        probability: 25,
        dependencies: ['Supplier financial health', 'Market conditions'],
      },
      {
        id: 'T4',
        event: 'Natural disaster affecting supplier',
        probability: 35,
        dependencies: ['Geographic location', 'Climate factors'],
      },
    ],
    consequences: [
      {
        id: 'C3',
        description: 'Production halt and delivery delays',
        severity: 'high',
        affected: ['Manufacturing', 'Customer orders'],
        timeToImpact: '1-2 weeks',
      },
      {
        id: 'C4',
        description: 'Revenue loss and customer dissatisfaction',
        severity: 'medium',
        affected: ['Sales', 'Customer relationships'],
        timeToImpact: '2-4 weeks',
      },
    ],
    mitigations: [
      {
        id: 'M3',
        action: 'Diversify supplier base',
        effectiveness: 80,
        cost: 150000,
        timeToImplement: '2-4 months',
        responsible: 'Procurement Team',
      },
      {
        id: 'M4',
        action: 'Increase inventory buffers',
        effectiveness: 60,
        cost: 300000,
        timeToImplement: '1 month',
        responsible: 'Operations Team',
      },
    ],
    timeline: '2-8 weeks',
    affectedAssets: ['Production Lines', 'Inventory', 'Customer Orders'],
    financialImpact: {
      min: 200000,
      max: 2000000,
      currency: 'USD',
    },
    aiConfidence: 72,
    lastUpdated: new Date('2024-01-19'),
    status: 'monitoring',
  },
];

// Scenario Card Component
const ScenarioCard: React.FC<{
  scenario: RiskScenario;
  onView: (scenario: RiskScenario) => void;
  onSimulate: (scenario: RiskScenario) => void;
}> = ({ scenario, onView, onSimulate }) => {
  const getCategoryConfig = (category: string) => {
    const configs = {
      'cybersecurity': { color: 'text-red-600', bg: 'bg-red-50', icon: Shield },
      'operational': { color: 'text-blue-600', bg: 'bg-blue-50', icon: Activity },
      'financial': { color: 'text-green-600', bg: 'bg-green-50', icon: DollarSign },
      'compliance': { color: 'text-purple-600', bg: 'bg-purple-50', icon: Target },
      'strategic': { color: 'text-orange-600', bg: 'bg-orange-50', icon: TrendingUp },
    };
    return configs[category as keyof typeof configs] || configs.operational;
  };

  const getRiskLevelConfig = (score: number) => {
    if (score >= 60) return { color: 'text-semantic-error', label: 'Critical' };
    if (score >= 40) return { color: 'text-semantic-warning', label: 'High' };
    if (score >= 20) return { color: 'text-semantic-warning', label: 'Medium' };
    return { color: 'text-semantic-success', label: 'Low' };
  };

  const categoryConfig = getCategoryConfig(scenario.category);
  const riskConfig = getRiskLevelConfig(scenario.riskScore);
  const CategoryIcon = categoryConfig.icon;

  return (
    <DaisyCard className="hover:shadow-notion-sm transition-all duration-200 relative overflow-hidden">
      {/* AI Accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-600"></div>
      
      <DaisyCardHeader className="pb-enterprise-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-enterprise-3">
            <div className={cn("p-enterprise-2 rounded-lg", categoryConfig.bg)}>
              <CategoryIcon className={cn("h-4 w-4", categoryConfig.color)} />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-enterprise-2 mb-enterprise-1">
                <DaisyCardTitle className="text-body-sm">{scenario.name}</DaisyCardTitle>
                <DaisyBadge variant="outline" className={cn("text-caption", riskConfig.color)}>
                  {riskConfig.label}
                </DaisyBadge>
              </div>
              <DaisyCardDescription className="text-caption line-clamp-2">
                {scenario.description}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-enterprise-1">
            <Brain className="h-3 w-3 text-purple-500" />
            <span className="text-caption font-medium text-purple-600">{scenario.aiConfidence}%</span>
          </div>
        </div>
      

      <DaisyCardContent className="space-y-enterprise-4">
        {/* Risk Metrics */}
        <div className="grid grid-cols-2 gap-enterprise-4">
          <div>
            <div className="flex items-center justify-between mb-enterprise-1">
              <span className="text-caption text-text-secondary">Probability</span>
              <span className="text-caption font-medium text-text-primary">{scenario.probability}%</span>
            </div>
            <DaisyProgress value={scenario.probability} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-enterprise-1">
              <span className="text-caption text-text-secondary">Impact</span>
              <span className="text-caption font-medium text-text-primary">{scenario.impact}%</span>
            </div>
            <DaisyProgress value={scenario.impact} className="h-2" />
          </div>
        </div>

        {/* Financial Impact */}
        <div className="flex items-center justify-between p-enterprise-2 bg-surface-secondary rounded-lg">
          <div className="flex items-center space-x-enterprise-2">
            <DollarSign className="h-3 w-3 text-text-tertiary" />
            <span className="text-caption text-text-secondary">Financial Impact</span>
          </div>
          <span className="text-caption font-medium text-text-primary">
            ${(scenario.financialImpact.min / 1000).toFixed(0)}K - ${(scenario.financialImpact.max / 1000).toFixed(0)}K
          </span>
        </div>

        {/* Timeline & Assets */}
        <div className="grid grid-cols-2 gap-enterprise-4 text-caption">
          <div className="flex items-center space-x-enterprise-2">
            <Clock className="h-3 w-3 text-text-tertiary" />
            <span className="text-text-secondary">Timeline:</span>
            <span className="font-medium text-text-primary">{scenario.timeline}</span>
          </div>
          <div className="flex items-center space-x-enterprise-2">
            <Server className="h-3 w-3 text-text-tertiary" />
            <span className="text-text-secondary">Assets:</span>
            <span className="font-medium text-text-primary">{scenario.affectedAssets.length}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-enterprise-3 border-t border-border">
          <div className="flex items-center space-x-enterprise-1">
            <DaisyButton 
              size="sm" 
              className="h-6 px-enterprise-3 bg-purple-600 hover:bg-purple-700"
              onClick={() => onSimulate(scenario)}
            >
              <Play className="h-3 w-3 mr-enterprise-1" />
              Simulate
            </DaisyButton>
            <DaisyButton 
              variant="outline" 
              size="sm" 
              className="h-6 px-enterprise-2"
              onClick={() => onView(scenario)}
            >
              <Eye className="h-3 w-3 mr-enterprise-1" />
              Details
            </DaisyButton>
          </div>
          <span className="text-caption text-text-tertiary">
            {scenario.lastUpdated.toLocaleDateString()}
          </span>
        </div>
      </DaisyCardBody>
    </DaisyCard>
  );
};

// Simulation Interface Component
const SimulationInterface: React.FC<{
  scenario: RiskScenario;
  onClose: () => void;
}> = ({ scenario, onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeframe, setTimeframe] = useState([90]);
  const [iterations, setIterations] = useState([1000]);
  const [results, setResults] = useState<SimulationResults | null>(null);

  const runSimulation = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock results
    const mockResults: SimulationResults = {
      averageImpact: scenario.impact * 0.8,
      worstCase: scenario.impact * 1.2,
      bestCase: scenario.impact * 0.4,
      probability: scenario.probability * 0.9,
      timeline: Array.from({ length: timeframe[0] / 10 }, (_, i) => ({
        day: (i + 1) * 10,
        probability: scenario.probability * (0.8 + Math.random() * 0.4),
        impact: scenario.impact * (0.7 + Math.random() * 0.6),
        events: [`Event ${i + 1}`, `Milestone ${i + 1}`],
      })),
      recommendations: [
        'Immediate implementation of zero-trust security model',
        'Establish incident response team on standby',
        'Increase monitoring frequency by 50%',
        'Conduct employee security awareness training',
      ],
    };

    setResults(mockResults);
    setIsRunning(false);
  };

  return (
    <DaisyDialog open onOpenChange={onClose}>
      <DaisyDialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DaisyDialogHeader className="px-enterprise-6 py-enterprise-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <DaisyDialogTitle className="text-heading-sm">{scenario.name}</DaisyDialogTitle>
              <p className="text-caption text-text-secondary mt-enterprise-1">
                AI-Powered Risk Scenario Simulation
              </p>
            </div>
            <div className="flex items-center space-x-enterprise-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-caption text-purple-600">AI Confidence: {scenario.aiConfidence}%</span>
            </div>
          </div>
        </DaisyDialogHeader>

        <div className="flex-1 overflow-hidden">
          <DaisyTabs defaultValue="parameters" className="h-full flex flex-col">
            <DaisyTabsList className="mx-enterprise-6 mt-enterprise-4">
              <DaisyTabsTrigger value="parameters">Parameters</DaisyTabsTrigger>
              <DaisyTabsTrigger value="results" disabled={!results}>Results</DaisyTabsTrigger>
              <DaisyTabsTrigger value="timeline" disabled={!results}>Timeline</DaisyTabsTrigger>
            </DaisyTabsList>

            <div className="flex-1 overflow-y-auto px-enterprise-6 py-enterprise-4">
              <DaisyTabsContent value="parameters" className="space-y-enterprise-6">
                {/* Simulation Parameters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-enterprise-6">
                  <div className="space-y-enterprise-4">
                    <div>
                      <DaisyLabel className="text-body-sm font-medium mb-enterprise-2">
                        Simulation Timeframe: {timeframe[0]} days
                      </DaisyLabel>
                      <Slider
                        value={timeframe}
                        onValueChange={setTimeframe}
                        max={365}
                        min={30}
                        step={30}
                        className="mt-enterprise-2"
                      />
                    </div>
                    <div>
                      <DaisyLabel className="text-body-sm font-medium mb-enterprise-2">
                        Monte Carlo Iterations: {iterations[0].toLocaleString()}
                      </DaisyLabel>
                      <Slider
                        value={iterations}
                        onValueChange={setIterations}
                        max={10000}
                        min={100}
                        step={100}
                        className="mt-enterprise-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-enterprise-4">
                    <div className="p-enterprise-4 border border-border rounded-lg bg-surface-secondary">
                      <h4 className="text-body-sm font-medium mb-enterprise-2">Base Scenario</h4>
                      <div className="space-y-enterprise-2 text-caption">
                        <div className="flex justify-between">
                          <span>Probability:</span>
                          <span>{scenario.probability}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Impact:</span>
                          <span>{scenario.impact}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Risk Score:</span>
                          <span>{scenario.riskScore}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Run Simulation */}
                <div className="border-t border-border pt-enterprise-4">
                  {isRunning ? (
                    <div className="text-center space-y-enterprise-3">
                      <div className="flex items-center justify-center space-x-enterprise-2">
                        <Brain className="h-5 w-5 text-purple-600 animate-pulse" />
                        <span className="text-body-sm">AI analyzing scenario...</span>
                      </div>
                      <DaisyProgress value={progress} className="w-full max-w-md mx-auto" />
                      <p className="text-caption text-text-secondary">
                        Running {iterations[0].toLocaleString()} iterations over {timeframe[0]} days
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <DaisyButton 
                        onClick={runSimulation}
                        className="bg-purple-600 hover:bg-purple-700"
                        disabled={isRunning}
                      >
                        <Play className="h-4 w-4 mr-enterprise-2" />
                        Run AI Simulation
                      </DaisyButton>
                    </div>
                  )}
                </div>
              </DaisyTabsContent>

              <DaisyTabsContent value="results" className="space-y-enterprise-6">
                {results && (
                  <>
                    {/* Results Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-enterprise-4">
                      <DaisyCard>
                        <DaisyCardHeader className="pb-enterprise-2">
                          <DaisyCardTitle className="text-body-sm">Average Impact</DaisyCardTitle>
                        
                        <DaisyCardContent>
                          <div className="text-heading-base font-bold text-semantic-warning">
                            {results.averageImpact.toFixed(1)}%
                          </div>
                        </DaisyCardBody>
                      </DaisyCard>
                      <DaisyCard>
                        <DaisyCardHeader className="pb-enterprise-2">
                          <DaisyCardTitle className="text-body-sm">Worst Case</DaisyCardTitle>
                        
                        <DaisyCardContent>
                          <div className="text-heading-base font-bold text-semantic-error">
                            {results.worstCase.toFixed(1)}%
                          </div>
                        </DaisyCardBody>
                      </DaisyCard>
                      <DaisyCard>
                        <DaisyCardHeader className="pb-enterprise-2">
                          <DaisyCardTitle className="text-body-sm">Best Case</DaisyCardTitle>
                        
                        <DaisyCardContent>
                          <div className="text-heading-base font-bold text-semantic-success">
                            {results.bestCase.toFixed(1)}%
                          </div>
                        </DaisyCardBody>
                      </DaisyCard>
                    </div>

                    {/* AI Recommendations */}
                    <div>
                      <h4 className="text-heading-sm font-semibold mb-enterprise-3">
                        AI Recommendations
                      </h4>
                      <div className="space-y-enterprise-2">
                        {results.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start space-x-enterprise-2 p-enterprise-3 border border-border rounded-lg">
                            <Zap className="h-4 w-4 text-purple-500 mt-1 flex-shrink-0" />
                            <span className="text-body-sm">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </DaisyTabsContent>

              <DaisyTabsContent value="timeline" className="space-y-enterprise-4">
                {results && (
                  <div>
                    <h4 className="text-heading-sm font-semibold mb-enterprise-4">
                      Risk Evolution Timeline
                    </h4>
                    <div className="space-y-enterprise-3">
                      {results.timeline.map((point, index) => (
                        <div key={index} className="flex items-center space-x-enterprise-4 p-enterprise-3 border border-border rounded-lg">
                          <div className="text-body-sm font-medium text-text-primary w-16">
                            Day {point.day}
                          </div>
                          <div className="flex-1 space-y-enterprise-1">
                            <div className="flex items-center space-x-enterprise-4">
                              <div className="flex items-center space-x-enterprise-2">
                                <span className="text-caption text-text-secondary">Probability:</span>
                                <span className="text-caption font-medium">{point.probability.toFixed(1)}%</span>
                              </div>
                              <div className="flex items-center space-x-enterprise-2">
                                <span className="text-caption text-text-secondary">Impact:</span>
                                <span className="text-caption font-medium">{point.impact.toFixed(1)}%</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-enterprise-2">
                              <span className="text-caption text-text-tertiary">Events:</span>
                              <span className="text-caption text-text-secondary">{point.events.join(', ')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </DaisyTabsContent>
            </div>
          </DaisyTabs>
        </div>

        <div className="px-enterprise-6 py-enterprise-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-enterprise-2">
              <DaisyButton variant="outline" onClick={onClose}>
                Close Simulation
              </DaisyButton>
            </div>
            {results && (
              <div className="flex items-center space-x-enterprise-2">
                <DaisyButton variant="outline" size="sm">
                  <Download className="h-3 w-3 mr-enterprise-1" />
                  Export Results
                </DaisyButton>
                <DaisyButton variant="outline" size="sm">
                  <Share className="h-3 w-3 mr-enterprise-1" />
                  Share
                </DaisyButton>
              </div>
            )}
          </div>
        </div>
      </DaisyDialogContent>
    </DaisyDialog>
  );
};

// Main Risk Scenario Modeling Component
export const RiskScenarioModeling: React.FC = () => {
  const [scenarios] = useState<RiskScenario[]>(sampleScenarios);
  const [selectedScenario, setSelectedScenario] = useState<RiskScenario | null>(null);
  const [showSimulation, setShowSimulation] = useState(false);
  const [viewingScenario, setViewingScenario] = useState<RiskScenario | null>(null);

  const handleSimulate = (scenario: RiskScenario) => {
    setSelectedScenario(scenario);
    setShowSimulation(true);
  };

  const handleView = (scenario: RiskScenario) => {
    setViewingScenario(scenario);
  };

  const activeScenarios = scenarios.filter(s => s.status === 'active').length;
  const avgConfidence = Math.round(scenarios.reduce((sum, s) => sum + s.aiConfidence, 0) / scenarios.length);
  const highRiskScenarios = scenarios.filter(s => s.riskScore >= 60).length;

  return (
    <div className="space-y-enterprise-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-enterprise-4">
        <DaisyCard>
          <DaisyCardHeader className="pb-enterprise-2">
            <div className="flex items-center space-x-enterprise-2">
              <Activity className="h-4 w-4 text-purple-600" />
              <DaisyCardTitle className="text-body-sm">Active Scenarios</DaisyCardTitle>
            </div>
          
          <DaisyCardContent>
            <div className="text-heading-base font-bold">{activeScenarios}</div>
          </DaisyCardBody>
        </DaisyCard>
        <DaisyCard>
          <DaisyCardHeader className="pb-enterprise-2">
            <div className="flex items-center space-x-enterprise-2">
              <DaisyAlertTriangle className="h-4 w-4 text-semantic-error" />
              <DaisyCardTitle className="text-body-sm">High Risk</DaisyCardTitle>
            </div>
          
          <DaisyCardContent>
            <div className="text-heading-base font-bold text-semantic-error">{highRiskScenarios}</div>
          </DaisyCardBody>
        </DaisyCard>
        <DaisyCard>
          <DaisyCardHeader className="pb-enterprise-2">
            <div className="flex items-center space-x-enterprise-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <DaisyCardTitle className="text-body-sm">AI Confidence</DaisyCardTitle>
            </div>
          
          <DaisyCardContent>
            <div className="text-heading-base font-bold text-purple-600">{avgConfidence}%</div>
          </DaisyCardBody>
        </DaisyCard>
        <DaisyCard>
          <DaisyCardHeader className="pb-enterprise-2">
            <div className="flex items-center space-x-enterprise-2">
              <Target className="h-4 w-4 text-text-primary" />
              <DaisyCardTitle className="text-body-sm">Total Scenarios</DaisyCardTitle>
            </div>
          
          <DaisyCardContent>
            <div className="text-heading-base font-bold">{scenarios.length}</div>
          </DaisyCardBody>
        </DaisyCard>
      </div>

      {/* Scenarios Grid */}
      <div>
        <div className="flex items-center justify-between mb-enterprise-4">
          <h3 className="text-heading-sm font-semibold">Risk Scenarios</h3>
          <DaisyButton className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-enterprise-2" />
            Create Scenario
          </DaisyButton>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-enterprise-4">
          {scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onView={handleView}
              onSimulate={handleSimulate}
            />
          ))}
        </div>
      </div>

      {/* Simulation Modal */}
      {showSimulation && selectedScenario && (
        <SimulationInterface
          scenario={selectedScenario}
          onClose={() => {
            setShowSimulation(false);
            setSelectedScenario(null);
          }}
        />
      )}
    </div>
  );
};

export default RiskScenarioModeling;