'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  Line,
  LineChart,
  Area,
  AreaChart
} from 'recharts';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisySwitch } from '@/components/ui/DaisySwitch';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { 
  RiskManagementIcons, 
  DataIcons, 
  ActionIcons,
  StatusIcons 
} from '@/components/icons/IconLibrary';
import { format, subDays, subMonths } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  Target,
  TrendingUp,
  Download,
  Settings,
  Maximize2,
  Filter
} from 'lucide-react';

// Enhanced interfaces for compliance tracking
interface ComplianceFramework {
  id: string;
  name: string;
  shortName: string;
  description: string;
  totalControls: number;
  implementedControls: number;
  inProgressControls: number;
  notStartedControls: number;
  overallScore: number;
  lastAssessment: Date;
  nextAssessment: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: 'compliant' | 'partial' | 'non-compliant' | 'not-assessed';
  category: 'security' | 'privacy' | 'financial' | 'operational' | 'regulatory';
  requirements: ComplianceRequirement[];
  partialControls: number;
  notImplementedControls: number;
  categories: ComplianceCategory[];
}

interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  status: 'compliant' | 'partial' | 'non-compliant' | 'not-assessed';
  evidence: string[];
  lastReview: Date;
  nextReview: Date;
  owner: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  effort: number; // hours
  cost: number; // dollars
}

interface ComplianceCategory {
  id: string;
  name: string;
  controls: number;
  implemented: number;
  score: number;
  trend: 'improving' | 'stable' | 'declining';
}

interface ComplianceProgressData {
  date: string;
  timestamp: number;
  frameworks: {
    [frameworkId: string]: {
      score: number;
      implemented: number;
      inProgress: number;
      notStarted: number;
    };
  };
  overallScore: number;
  totalControls: number;
  implementedControls: number;
  gapCount: number;
  riskScore: number;
}

interface ComplianceProgressChartProps {
  frameworks?: ComplianceFramework[];
  progressData?: ComplianceProgressData[];
  title?: string;
  description?: string;
  enableDrillDown?: boolean;
  enableExport?: boolean;
  enablePrediction?: boolean;
  height?: number;
  className?: string;
  onFrameworkClick?: (framework: ComplianceFramework) => void;
  onRequirementClick?: (requirement: ComplianceRequirement) => void;
  onExport?: (data: any) => void;
}

// Sample compliance frameworks data
const defaultFrameworks: ComplianceFramework[] = [
  {
    id: 'soc2',
    name: 'SOC 2 Type II',
    shortName: 'SOC 2',
    description: 'Service Organization Control 2 - Security, Availability, Processing Integrity, Confidentiality, Privacy',
    totalControls: 64,
    implementedControls: 52,
    inProgressControls: 8,
    notStartedControls: 4,
    overallScore: 81.3,
    lastAssessment: subDays(new Date(), 30),
    nextAssessment: subDays(new Date(), -335),
    riskLevel: 'medium',
    status: 'partial',
    category: 'security',
    requirements: [],
    partialControls: 0,
    notImplementedControls: 0,
    categories: []
  },
  {
    id: 'gdpr',
    name: 'General Data Protection Regulation',
    shortName: 'GDPR',
    description: 'EU data protection and privacy regulation',
    totalControls: 47,
    implementedControls: 42,
    inProgressControls: 3,
    notStartedControls: 2,
    overallScore: 89.4,
    lastAssessment: subDays(new Date(), 15),
    nextAssessment: subDays(new Date(), -350),
    riskLevel: 'low',
    status: 'compliant',
    category: 'privacy',
    requirements: [],
    partialControls: 0,
    notImplementedControls: 0,
    categories: []
  },
  {
    id: 'iso27001',
    name: 'ISO 27001:2013',
    shortName: 'ISO 27001',
    description: 'Information Security Management System',
    totalControls: 114,
    implementedControls: 78,
    inProgressControls: 24,
    notStartedControls: 12,
    overallScore: 68.4,
    lastAssessment: subDays(new Date(), 45),
    nextAssessment: subDays(new Date(), -320),
    riskLevel: 'high',
    status: 'partial',
    category: 'security',
    requirements: [],
    partialControls: 0,
    notImplementedControls: 0,
    categories: []
  },
  {
    id: 'hipaa',
    name: 'Health Insurance Portability and Accountability Act',
    shortName: 'HIPAA',
    description: 'US healthcare data protection regulation',
    totalControls: 78,
    implementedControls: 65,
    inProgressControls: 10,
    notStartedControls: 3,
    overallScore: 83.3,
    lastAssessment: subDays(new Date(), 20),
    nextAssessment: subDays(new Date(), -345),
    riskLevel: 'medium',
    status: 'partial',
    category: 'privacy',
    requirements: [],
    partialControls: 0,
    notImplementedControls: 0,
    categories: []
  },
  {
    id: 'pci-dss',
    name: 'Payment Card Industry Data Security Standard',
    shortName: 'PCI DSS',
    description: 'Payment card data security requirements',
    totalControls: 200,
    implementedControls: 180,
    inProgressControls: 15,
    notStartedControls: 5,
    overallScore: 90.0,
    lastAssessment: subDays(new Date(), 10),
    nextAssessment: subDays(new Date(), -355),
    riskLevel: 'low',
    status: 'compliant',
    category: 'financial',
    requirements: [],
    partialControls: 0,
    notImplementedControls: 0,
    categories: []
  },
  {
    id: 'sox',
    name: 'Sarbanes-Oxley Act',
    shortName: 'SOX',
    description: 'Financial reporting and corporate governance',
    totalControls: 156,
    implementedControls: 134,
    inProgressControls: 18,
    notStartedControls: 4,
    overallScore: 85.9,
    lastAssessment: subDays(new Date(), 25),
    nextAssessment: subDays(new Date(), -340),
    riskLevel: 'medium',
    status: 'partial',
    category: 'financial',
    requirements: [],
    partialControls: 0,
    notImplementedControls: 0,
    categories: []
  }
];

// Generate sample progress data
const generateProgressData = (frameworks: ComplianceFramework[]): ComplianceProgressData[] => {
  const data: ComplianceProgressData[] = [];
  const startDate = subMonths(new Date(), 6);
  
  for (let i = 0; i < 180; i++) {
    const date = subDays(startDate, -i);
    const timestamp = date.getTime();
    
    const frameworkData: { [key: string]: any } = {};
    let totalControls = 0;
    let implementedControls = 0;
    let overallScoreSum = 0;
    
    frameworks.forEach(framework => {
      // Simulate gradual improvement over time
      const baseProgress = framework.implementedControls / framework.totalControls;
      const progressGrowth = (i / 180) * 0.1; // 10% improvement over 6 months
      const randomVariation = (Math.random() - 0.5) * 0.02; // ±1% random variation
      
      const currentProgress = Math.min(1, baseProgress + progressGrowth + randomVariation);
      const implemented = Math.round(framework.totalControls * currentProgress);
      const inProgress = Math.round(framework.totalControls * 0.1 * (1 - currentProgress));
      const notStarted = framework.totalControls - implemented - inProgress;
      
      frameworkData[framework.id] = {
        score: Math.round(currentProgress * 100 * 10) / 10,
        implemented,
        inProgress,
        notStarted
      };
      
      totalControls += framework.totalControls;
      implementedControls += implemented;
      overallScoreSum += currentProgress * 100;
    });
    
    const overallScore = overallScoreSum / frameworks.length;
    const gapCount = totalControls - implementedControls;
    const riskScore = Math.max(0, 100 - overallScore + Math.random() * 10);
    
    data.push({
      date: format(date, 'yyyy-MM-dd'),
      timestamp,
      frameworks: frameworkData,
      overallScore: Math.round(overallScore * 10) / 10,
      totalControls,
      implementedControls,
      gapCount,
      riskScore: Math.round(riskScore * 10) / 10
    });
  }
  
  return data.sort((a, b) => a.timestamp - b.timestamp);
};

// Color schemes
const frameworkColors = {
  'soc2': '#3b82f6',
  'gdpr': '#10b981',
  'iso27001': '#8b5cf6',
  'hipaa': '#f59e0b',
  'pci-dss': '#ef4444',
  'sox': '#06b6d4'
};

const statusColors = {
  compliant: '#10b981',
  partial: '#f59e0b',
  'non-compliant': '#ef4444',
  'not-assessed': '#6b7280'
};

const riskColors = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#7c2d12'
};

export const ComplianceProgressChart: React.FC<ComplianceProgressChartProps> = ({
  frameworks = defaultFrameworks,
  progressData = generateProgressData(defaultFrameworks),
  title = 'Compliance Progress Dashboard',
  description = 'Track compliance framework implementation and progress over time',
  enableDrillDown = true,
  enableExport = true,
  enablePrediction = true,
  height = 400,
  className = '',
  onFrameworkClick,
  onRequirementClick,
  onExport
}) => {
  const { toast } = useToast();
  
  // State management
  const [selectedFramework, setSelectedFramework] = useState<string>('all');
  const [chartType, setChartType] = useState<'progress' | 'trend' | 'comparison' | 'radial'>('progress');
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '6m' | '1y'>('90d');
  const [showPrediction, setShowPrediction] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filter progress data based on time range
  const filteredProgressData = useMemo(() => {
    const now = new Date();
    let cutoffDate: Date;
    
    switch (timeRange) {
      case '30d':
        cutoffDate = subDays(now, 30);
        break;
      case '90d':
        cutoffDate = subDays(now, 90);
        break;
      case '6m':
        cutoffDate = subMonths(now, 6);
        break;
      case '1y':
        cutoffDate = subMonths(now, 12);
        break;
      default:
        cutoffDate = subDays(now, 90);
    }
    
    return progressData.filter(item => new Date(item.date) >= cutoffDate);
  }, [progressData, timeRange]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalControls = frameworks.reduce((sum, f) => sum + f.totalControls, 0);
    const implementedControls = frameworks.reduce((sum, f) => sum + f.implementedControls, 0);
    const inProgressControls = frameworks.reduce((sum, f) => sum + f.inProgressControls, 0);
    const notStartedControls = frameworks.reduce((sum, f) => sum + f.notStartedControls, 0);
    
    const overallProgress = (implementedControls / totalControls) * 100;
    const compliantFrameworks = frameworks.filter(f => f.status === 'compliant').length;
    const criticalGaps = frameworks.filter(f => f.riskLevel === 'critical').length;
    
    return {
      totalControls,
      implementedControls,
      inProgressControls,
      notStartedControls,
      overallProgress: Math.round(overallProgress * 10) / 10,
      compliantFrameworks,
      totalFrameworks: frameworks.length,
      criticalGaps,
      averageScore: frameworks.reduce((sum, f) => sum + f.overallScore, 0) / frameworks.length
    };
  }, [frameworks]);

  // Prepare chart data
  const chartData = useMemo(() => {
    switch (chartType) {
      case 'progress':
        return frameworks.map(framework => ({
          name: framework.shortName,
          implemented: framework.implementedControls,
          inProgress: framework.inProgressControls,
          notStarted: framework.notStartedControls,
          score: framework.overallScore,
          total: framework.totalControls,
          status: framework.status,
          riskLevel: framework.riskLevel
        }));
        
      case 'trend':
        return filteredProgressData.map(item => ({
          date: item.date,
          overallScore: item.overallScore,
          implementedControls: item.implementedControls,
          gapCount: item.gapCount,
          riskScore: item.riskScore,
          ...Object.keys(item.frameworks).reduce((acc, key) => {
            acc[key] = item.frameworks[key].score;
            return acc;
          }, {} as any)
        }));
        
      case 'comparison':
        return frameworks.map(framework => ({
          framework: framework.shortName,
          current: framework.overallScore,
          target: 95,
          gap: 95 - framework.overallScore,
          category: framework.category
        }));
        
      case 'radial':
        return frameworks.map(framework => ({
          name: framework.shortName,
          value: framework.overallScore,
          fill: frameworkColors[framework.id as keyof typeof frameworkColors] || '#3b82f6'
        }));
        
      default:
        return [];
    }
  }, [frameworks, filteredProgressData, chartType]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            {entry.name.includes('Score') && '%'}
          </p>
        ))}
      </div>
    );
  };

  // Handle framework click
  const handleFrameworkClick = useCallback((framework: ComplianceFramework) => {
    setSelectedFramework(framework.id);
    onFrameworkClick?.(framework);
  }, [onFrameworkClick]);

  // Export functionality
  const handleExport = useCallback(() => {
    const exportData = {
      title,
      description,
      frameworks,
      progressData: filteredProgressData,
      summaryStats,
      chartType,
      timeRange,
      exportDate: new Date().toISOString()
    };
    
    onExport?.(exportData);
    
    toast({
      title: 'Export Complete',
      description: 'Compliance progress data has been exported successfully.',
    });
  }, [title, description, frameworks, filteredProgressData, summaryStats, chartType, timeRange, onExport]);

  // Render chart based on type
  const renderChart = () => {
    switch (chartType) {
      case 'progress':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <DaisyTooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="implemented" stackId="a" fill="#10b981" name="Implemented" />
              <Bar dataKey="inProgress" stackId="a" fill="#f59e0b" name="In Progress" />
              <Bar dataKey="notStarted" stackId="a" fill="#ef4444" name="Not Started" />
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'trend':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value) => format(new Date(value), 'MMM dd')} />
              <YAxis />
              <DaisyTooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="overallScore" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Overall Score"
              />
              {frameworks.map(framework => (
                <Line
                  key={framework.id}
                  type="monotone"
                  dataKey={framework.id}
                  stroke={frameworkColors[framework.id as keyof typeof frameworkColors] || '#6b7280'}
                  strokeWidth={2}
                  name={framework.shortName}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'comparison':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} layout="horizontal" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="framework" type="category" />
              <DaisyTooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="current" fill="#3b82f6" name="Current Score" />
              <Bar dataKey="target" fill="#10b981" name="Target Score" />
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'radial':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" data={chartData}>
              <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
              <DaisyTooltip content={<CustomTooltip />} />
              <Legend />
            </RadialBarChart>
          </ResponsiveContainer>
        );
        
      default:
        return null;
    }
  };

  return (
    <DaisyCard className={`${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <DaisyCardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <DaisyCardTitle className="flex items-center space-x-2">
              <RiskManagementIcons.Audit className="h-5 w-5" />
              <span>{title}</span>
            </DaisyCardTitle>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {enableExport && (
              <DaisyButton variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </DaisyButton>
            )}
            
            <DaisyButton
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2"
            >
              <Maximize2 className="w-4 h-4" />
            </DaisyButton>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <DaisySelect value={chartType} onValueChange={(value: any) => setChartType(value)}>
            <DaisySelectTrigger>
              <DaisySelectValue placeholder="Chart Type" />
            </DaisySelectTrigger>
            <DaisySelectContent>
              <DaisySelectItem value="progress">Progress Overview</SelectItem>
              <DaisySelectItem value="trend">Trend Analysis</SelectItem>
              <DaisySelectItem value="comparison">Target Comparison</SelectItem>
              <DaisySelectItem value="radial">Radial Progress</SelectItem>
            </SelectContent>
          </DaisySelect>
          
          <DaisySelect value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <DaisySelectTrigger>
              <DaisySelectValue placeholder="Time Range" />
            </DaisySelectTrigger>
            <DaisySelectContent>
              <DaisySelectItem value="30d">Last 30 Days</SelectItem>
              <DaisySelectItem value="90d">Last 90 Days</SelectItem>
              <DaisySelectItem value="6m">Last 6 Months</SelectItem>
              <DaisySelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </DaisySelect>
          
          <div className="flex items-center space-x-2">
            <DaisySwitch 
              id="prediction" 
              checked={showPrediction} 
              onCheckedChange={setShowPrediction}
            />
            <DaisyLabel htmlFor="prediction" className="text-sm">Show Prediction</DaisyLabel>
          </div>
        </div>
      

      <DaisyCardContent>
        <DaisyTabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <DaisyTabsList className="grid w-full grid-cols-4">
            <DaisyTabsTrigger value="overview">Overview</DaisyTabsTrigger>
            <DaisyTabsTrigger value="frameworks">Frameworks</DaisyTabsTrigger>
            <DaisyTabsTrigger value="gaps">Gaps Analysis</DaisyTabsTrigger>
            <DaisyTabsTrigger value="roadmap">Roadmap</DaisyTabsTrigger>
          </DaisyTabsList>
          
          <DaisyTabsContent value="overview" className="space-y-6">
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <DaisyCard>
                <DaisyCardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Overall Progress</p>
                      <p className="text-2xl font-bold">{summaryStats.overallProgress}%</p>
                    </div>
                    <div className="w-16 h-16">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { value: summaryStats.overallProgress },
                              { value: 100 - summaryStats.overallProgress }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={20}
                            outerRadius={30}
                            startAngle={90}
                            endAngle={450}
                            dataKey="value"
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#e5e7eb" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </DaisyCardContent>
              </DaisyCard>
              
              <DaisyCard>
                <DaisyCardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Compliant Frameworks</p>
                      <p className="text-2xl font-bold">
                        {summaryStats.compliantFrameworks}/{summaryStats.totalFrameworks}
                      </p>
                    </div>
                    <StatusIcons.CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </DaisyCardContent>
              </DaisyCard>
              
              <DaisyCard>
                <DaisyCardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Critical Gaps</p>
                      <p className="text-2xl font-bold">{summaryStats.criticalGaps}</p>
                    </div>
                    <StatusIcons.AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </DaisyCardContent>
              </DaisyCard>
              
              <DaisyCard>
                <DaisyCardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Avg Score</p>
                      <p className="text-2xl font-bold">{summaryStats.averageScore.toFixed(1)}%</p>
                    </div>
                    <DataIcons.BarChart3 className="h-8 w-8 text-blue-600" />
                  </div>
                </DaisyCardContent>
              </DaisyCard>
            </div>
            
            {/* Main Chart */}
            <div className="w-full">
              {renderChart()}
            </div>
          </DaisyTabsContent>
          
          <DaisyTabsContent value="frameworks" className="space-y-4">
            <div className="grid gap-4">
              {frameworks.map(framework => (
                <DaisyCard 
                  key={framework.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleFrameworkClick(framework)}
                >
                  <DaisyCardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{framework.name}</h4>
                          <DaisyBadge variant={
                            framework.status === 'compliant' ? 'success' :
                            framework.status === 'partial' ? 'warning' :
                            framework.status === 'non-compliant' ? 'destructive' : 'secondary'
                          }>
                            {framework.status}
                          </DaisyBadge>
                          <DaisyBadge variant={
                            framework.riskLevel === 'low' ? 'success' :
                            framework.riskLevel === 'medium' ? 'warning' :
                            framework.riskLevel === 'high' ? 'destructive' : 'destructive'
                          }>
                            {framework.riskLevel} risk
                          </DaisyBadge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{framework.description}</p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span>{framework.overallScore}%</span>
                          </div>
                          <DaisyProgress value={framework.overallScore} className="h-2" />
                          
                          <div className="grid grid-cols-3 gap-4 text-xs text-gray-500">
                            <div>
                              <span className="font-medium text-green-600">
                                {framework.implementedControls}
                              </span> Implemented
                            </div>
                            <div>
                              <span className="font-medium text-yellow-600">
                                {framework.inProgressControls}
                              </span> In Progress
                            </div>
                            <div>
                              <span className="font-medium text-red-600">
                                {framework.notStartedControls}
                              </span> Not Started
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold">{framework.overallScore}%</div>
                        <div className="text-xs text-gray-500">
                          {framework.implementedControls}/{framework.totalControls} controls
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Next: {format(framework.nextAssessment, 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                  </DaisyCardContent>
                </DaisyCard>
              ))}
            </div>
          </DaisyTabsContent>
          
          <DaisyTabsContent value="gaps" className="space-y-4">
            <div className="grid gap-4">
              <DaisyCard>
                <DaisyCardContent className="p-4">
                  <h4 className="font-medium mb-4">Compliance Gaps by Framework</h4>
                  <div className="space-y-3">
                    {frameworks
                      .filter(f => f.status !== 'compliant')
                      .sort((a, b) => (b.totalControls - b.implementedControls) - (a.totalControls - a.implementedControls))
                      .map(framework => {
                        const gapCount = framework.totalControls - framework.implementedControls;
                        const gapPercentage = (gapCount / framework.totalControls) * 100;
                        
                        return (
                          <div key={framework.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{framework.shortName}</span>
                                <DaisyBadge variant={
                                  framework.riskLevel === 'critical' ? 'destructive' :
                                  framework.riskLevel === 'high' ? 'destructive' :
                                  framework.riskLevel === 'medium' ? 'warning' : 'secondary'
                                }>
                                  {framework.riskLevel}
                                </DaisyBadge>
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {gapCount} controls need attention ({gapPercentage.toFixed(1)}% gap)
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-red-600">{gapCount}</div>
                              <div className="text-xs text-gray-500">gaps</div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </DaisyCardContent>
              </DaisyCard>
            </div>
          </DaisyTabsContent>
          
          <DaisyTabsContent value="roadmap" className="space-y-4">
            <div className="grid gap-4">
              <DaisyCard>
                <DaisyCardContent className="p-4">
                  <h4 className="font-medium mb-4">Compliance Roadmap</h4>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        1
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Address Critical Gaps</div>
                        <div className="text-sm text-gray-600">
                          Focus on {summaryStats.criticalGaps} critical compliance gaps
                        </div>
                      </div>
                      <DaisyBadge variant="outline">Q1 2024</DaisyBadge>
                    </div>
                    
                    <div className="flex items-center space-x-4 p-3 bg-yellow-50 rounded-lg">
                      <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        2
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Complete In-Progress Controls</div>
                        <div className="text-sm text-gray-600">
                          Finish {summaryStats.inProgressControls} controls currently in progress
                        </div>
                      </div>
                      <DaisyBadge variant="outline">Q2 2024</DaisyBadge>
                    </div>
                    
                    <div className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        3
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Achieve Full Compliance</div>
                        <div className="text-sm text-gray-600">
                          Implement remaining {summaryStats.notStartedControls} controls
                        </div>
                      </div>
                      <DaisyBadge variant="outline">Q3 2024</DaisyBadge>
                    </div>
                  </div>
                </DaisyCardContent>
              </DaisyCard>
            </div>
          </DaisyTabsContent>
        </DaisyTabs>
      </DaisyCardBody>
    </DaisyCard>
  );
};

export default ComplianceProgressChart; 