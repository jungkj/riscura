'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

// Icons
import {
  BarChart3, PieChart, TrendingUp, Download, Calendar, Filter, Search,
  Plus, Brain, Zap, FileText, Users, Clock, Target, AlertTriangle,
  Eye, Edit, Copy, Share, Archive, Trash2, Play, Settings, ChevronDown,
  LineChart, Activity, DollarSign, Shield, Globe, Layers, Database
} from 'lucide-react';

// Types
import type { 
  ReportTemplate,
  ReportCategory,
  ReportType,
  ReportGeneration,
  GenerationStatus,
  ExportFormat
} from '@/types/reporting.types';

interface ReportingPageProps {
  view?: 'dashboard' | 'builder' | 'library' | 'scheduled' | 'analytics';
}

export default function ReportingPage({ view = 'dashboard' }: ReportingPageProps) {
  const router = useRouter();
  
  // State Management
  const [activeView, setActiveView] = useState<string>(view);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | 'all'>('all');
  const [selectedType, setSelectedType] = useState<ReportType | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportTemplate | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Data
  const [reports, setReports] = useState<ReportTemplate[]>([]);
  const [generations, setGenerations] = useState<ReportGeneration[]>([]);
  const [analytics, setAnalytics] = useState({
    totalReports: 0,
    activeGenerations: 0,
    scheduledReports: 0,
    totalViews: 0,
    aiInsights: 0,
    avgGenerationTime: 0
  });

  // Initialize
  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      setIsLoading(true);
      
      // Load demo data
      const demoReports: ReportTemplate[] = [
        {
          id: 'rpt-001',
          name: 'Executive Risk Dashboard',
          description: 'High-level risk overview for executives and board members',
          category: 'executive',
          type: 'dashboard',
          version: '2.1',
          config: {
            refreshFrequency: 'daily',
            autoRefresh: true,
            cacheEnabled: true,
            cacheDuration: 60,
            maxDataPoints: 1000,
            dateRange: {
              type: 'relative',
              relative: { unit: 'months', value: 3, includeToday: true }
            },
            aggregationLevel: 'daily',
            includeHistorical: true,
            realTimeUpdates: false
          },
          layout: {
            orientation: 'landscape',
            pageSize: 'A4',
            columns: 3,
            gridTemplate: {
              rows: ['auto', '1fr', '1fr'],
              columns: ['1fr', '1fr', '1fr'],
              areas: [
                ['header', 'header', 'header'],
                ['kpi1', 'kpi2', 'kpi3'],
                ['chart1', 'chart2', 'chart3']
              ],
              gap: { row: 16, column: 16 }
            },
            responsiveBreakpoints: []
          },
          sections: [],
          dataSources: [],
          filters: [],
          parameters: [],
          styling: {} as any,
          permissions: {
            view: [{ type: 'role', identifier: 'executive' }],
            edit: [{ type: 'role', identifier: 'admin' }],
            delete: [{ type: 'role', identifier: 'admin' }],
            export: [{ type: 'role', identifier: 'executive' }],
            schedule: [{ type: 'role', identifier: 'admin' }],
            share: [{ type: 'role', identifier: 'executive' }]
          },
          aiFeatures: {
            narrativeGeneration: {
              enabled: true,
              sections: ['executive-summary'],
              style: 'executive_summary',
              length: 'medium',
              language: 'en',
              tone: 'executive',
              includeInsights: true,
              includeRecommendations: true
            },
            insightGeneration: {
              enabled: true,
              types: ['trend', 'anomaly', 'threshold_breach'],
              confidence: 80,
              priority: ['critical', 'high'],
              categories: ['risk', 'compliance'],
              maxInsights: 5
            },
            recommendationEngine: {
              enabled: true,
              types: ['risk_mitigation', 'process_improvement'],
              context: {
                organizationProfile: {
                  industry: 'financial',
                  size: 'large',
                  region: 'us',
                  riskProfile: 'medium',
                  maturityLevel: 3
                },
                userRole: 'executive',
                historicalData: true,
                industryBenchmarks: true,
                regulatoryRequirements: true
              },
              personalization: {
                enabled: true,
                userPreferences: true,
                roleBasedFiltering: true,
                historicalInteractions: false,
                learningEnabled: true
              },
              maxRecommendations: 3
            },
            anomalyDetection: {
              enabled: true,
              algorithms: ['statistical', 'isolation_forest'],
              sensitivity: 0.7,
              seasonality: true,
              trendFiltering: true,
              minDataPoints: 30
            },
            predictiveAnalytics: {
              enabled: true,
              models: [{
                id: 'risk-forecast-1',
                name: 'Risk Trend Forecaster',
                type: 'prophet',
                features: ['risk_score', 'control_effectiveness'],
                target: 'risk_level',
                accuracy: 0.85,
                lastTrained: new Date('2024-01-15')
              }],
              horizon: 90,
              confidence: 0.8,
              scenarios: []
            },
            naturalLanguageQuery: {
              enabled: true,
              supportedLanguages: ['en'],
              contextAware: true,
              suggestionsEnabled: true,
              maxTokens: 2000
            }
          },
          createdBy: 'admin',
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-20'),
          lastUsed: new Date('2024-01-25'),
          usageCount: 147,
          isPublic: false,
          isSystem: true,
          tags: ['executive', 'risk', 'dashboard'],
          organizationId: 'org-1'
        },
        {
          id: 'rpt-002',
          name: 'SOC 2 Compliance Report',
          description: 'Detailed SOC 2 compliance status and control effectiveness report',
          category: 'compliance',
          type: 'detailed_report',
          version: '1.5',
          config: {
            refreshFrequency: 'weekly',
            autoRefresh: false,
            cacheEnabled: true,
            cacheDuration: 240,
            maxDataPoints: 5000,
            dateRange: {
              type: 'relative',
              relative: { unit: 'quarters', value: 1, includeToday: true }
            },
            aggregationLevel: 'weekly',
            includeHistorical: true,
            realTimeUpdates: false
          },
          layout: {
            orientation: 'portrait',
            pageSize: 'A4',
            columns: 2,
            gridTemplate: {
              rows: ['auto', '1fr'],
              columns: ['1fr', '1fr'],
              areas: [
                ['header', 'header'],
                ['content', 'sidebar']
              ],
              gap: { row: 20, column: 20 }
            },
            responsiveBreakpoints: []
          },
          sections: [],
          dataSources: [],
          filters: [],
          parameters: [],
          styling: {} as any,
          permissions: {
            view: [{ type: 'role', identifier: 'auditor' }],
            edit: [{ type: 'role', identifier: 'auditor' }],
            delete: [{ type: 'role', identifier: 'admin' }],
            export: [{ type: 'role', identifier: 'auditor' }],
            schedule: [{ type: 'role', identifier: 'auditor' }],
            share: [{ type: 'role', identifier: 'auditor' }]
          },
          aiFeatures: {
            narrativeGeneration: {
              enabled: true,
              sections: ['compliance-summary', 'findings'],
              style: 'detailed_analysis',
              length: 'long',
              language: 'en',
              tone: 'formal',
              includeInsights: true,
              includeRecommendations: true
            },
            insightGeneration: {
              enabled: true,
              types: ['trend', 'pattern', 'benchmark_comparison'],
              confidence: 85,
              priority: ['critical', 'high', 'medium'],
              categories: ['compliance', 'controls'],
              maxInsights: 10
            },
            recommendationEngine: {
              enabled: true,
              types: ['compliance_improvement', 'process_improvement'],
              context: {
                organizationProfile: {
                  industry: 'technology',
                  size: 'medium',
                  region: 'us',
                  riskProfile: 'medium',
                  maturityLevel: 4
                },
                userRole: 'auditor',
                historicalData: true,
                industryBenchmarks: true,
                regulatoryRequirements: true
              },
              personalization: {
                enabled: false,
                userPreferences: false,
                roleBasedFiltering: true,
                historicalInteractions: false,
                learningEnabled: false
              },
              maxRecommendations: 5
            },
            anomalyDetection: {
              enabled: false,
              algorithms: [],
              sensitivity: 0.5,
              seasonality: false,
              trendFiltering: false,
              minDataPoints: 0
            },
            predictiveAnalytics: {
              enabled: false,
              models: [],
              horizon: 0,
              confidence: 0,
              scenarios: []
            },
            naturalLanguageQuery: {
              enabled: false,
              supportedLanguages: [],
              contextAware: false,
              suggestionsEnabled: false,
              maxTokens: 0
            }
          },
          createdBy: 'auditor',
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-01-18'),
          lastUsed: new Date('2024-01-23'),
          usageCount: 43,
          isPublic: false,
          isSystem: false,
          tags: ['compliance', 'soc2', 'audit'],
          organizationId: 'org-1'
        },
        {
          id: 'rpt-003',
          name: 'Monthly Risk Trend Analysis',
          description: 'AI-powered risk trend analysis with predictive insights',
          category: 'risk_management',
          type: 'trend_analysis',
          version: '3.0',
          config: {
            refreshFrequency: 'monthly',
            autoRefresh: true,
            cacheEnabled: true,
            cacheDuration: 1440,
            maxDataPoints: 2000,
            dateRange: {
              type: 'relative',
              relative: { unit: 'months', value: 12, includeToday: true }
            },
            aggregationLevel: 'monthly',
            includeHistorical: true,
            realTimeUpdates: true
          },
          layout: {
            orientation: 'landscape',
            pageSize: 'A3',
            columns: 4,
            gridTemplate: {
              rows: ['auto', '1fr', '1fr'],
              columns: ['1fr', '1fr', '1fr', '1fr'],
              areas: [
                ['header', 'header', 'header', 'ai-panel'],
                ['trends', 'trends', 'forecast', 'forecast'],
                ['insights', 'insights', 'recommendations', 'recommendations']
              ],
              gap: { row: 16, column: 16 }
            },
            responsiveBreakpoints: []
          },
          sections: [],
          dataSources: [],
          filters: [],
          parameters: [],
          styling: {} as any,
          permissions: {
            view: [{ type: 'role', identifier: 'analyst' }],
            edit: [{ type: 'role', identifier: 'analyst' }],
            delete: [{ type: 'role', identifier: 'admin' }],
            export: [{ type: 'role', identifier: 'analyst' }],
            schedule: [{ type: 'role', identifier: 'analyst' }],
            share: [{ type: 'role', identifier: 'analyst' }]
          },
          aiFeatures: {
            narrativeGeneration: {
              enabled: true,
              sections: ['trend-summary', 'prediction-summary'],
              style: 'detailed_analysis',
              length: 'long',
              language: 'en',
              tone: 'technical',
              includeInsights: true,
              includeRecommendations: true
            },
            insightGeneration: {
              enabled: true,
              types: ['trend', 'anomaly', 'correlation', 'forecast'],
              confidence: 75,
              priority: ['critical', 'high', 'medium'],
              categories: ['risk', 'trends', 'prediction'],
              maxInsights: 15
            },
            recommendationEngine: {
              enabled: true,
              types: ['risk_mitigation', 'process_improvement', 'automation_opportunity'],
              context: {
                organizationProfile: {
                  industry: 'financial',
                  size: 'large',
                  region: 'us',
                  riskProfile: 'high',
                  maturityLevel: 4
                },
                userRole: 'analyst',
                historicalData: true,
                industryBenchmarks: true,
                regulatoryRequirements: true
              },
              personalization: {
                enabled: true,
                userPreferences: true,
                roleBasedFiltering: true,
                historicalInteractions: true,
                learningEnabled: true
              },
              maxRecommendations: 8
            },
            anomalyDetection: {
              enabled: true,
              algorithms: ['statistical', 'isolation_forest', 'lstm_autoencoder'],
              sensitivity: 0.8,
              seasonality: true,
              trendFiltering: true,
              minDataPoints: 50
            },
            predictiveAnalytics: {
              enabled: true,
              models: [
                {
                  id: 'risk-forecast-advanced',
                  name: 'Advanced Risk Forecaster',
                  type: 'lstm',
                  features: ['risk_score', 'control_effectiveness', 'incident_count', 'threat_level'],
                  target: 'risk_trend',
                  accuracy: 0.92,
                  lastTrained: new Date('2024-01-20')
                },
                {
                  id: 'control-performance',
                  name: 'Control Performance Predictor',
                  type: 'xgboost',
                  features: ['test_results', 'effectiveness_score', 'maturity_level'],
                  target: 'control_health',
                  accuracy: 0.88,
                  lastTrained: new Date('2024-01-18')
                }
              ],
              horizon: 180,
              confidence: 0.85,
              scenarios: [
                {
                  name: 'Baseline',
                  description: 'Current trajectory continues',
                  parameters: [],
                  probability: 0.6
                },
                {
                  name: 'Increased Threat',
                  description: 'External threat level increases by 25%',
                  parameters: [{ field: 'threat_level', adjustment: 25, type: 'increase' }],
                  probability: 0.3
                }
              ]
            },
            naturalLanguageQuery: {
              enabled: true,
              supportedLanguages: ['en'],
              contextAware: true,
              suggestionsEnabled: true,
              maxTokens: 4000
            }
          },
          createdBy: 'analyst',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-25'),
          lastUsed: new Date('2024-01-26'),
          usageCount: 89,
          isPublic: false,
          isSystem: false,
          tags: ['risk', 'trends', 'ai', 'predictive'],
          organizationId: 'org-1'
        }
      ];

      setReports(demoReports);
      
      // Calculate analytics
      const totalViews = demoReports.reduce((sum, r) => sum + r.usageCount, 0);
      const aiEnabled = demoReports.filter(r => r.aiFeatures.narrativeGeneration.enabled).length;

      setAnalytics({
        totalReports: demoReports.length,
        activeGenerations: 2,
        scheduledReports: 5,
        totalViews,
        aiInsights: aiEnabled * 12, // Estimate
        avgGenerationTime: 45 // seconds
      });

      setIsLoading(false);
      
      toast({
        title: 'Reporting System Ready',
        description: `${demoReports.length} report templates loaded with AI intelligence`,
      });
    } catch (error) {
      console.error('Failed to load reports:', error);
      setIsLoading(false);
      toast({
        title: 'Loading Failed',
        description: 'Unable to load reports. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Filtering
  const filteredReports = reports.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;
    const matchesType = selectedType === 'all' || r.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  // Actions
  const handleCreateReport = () => {
    setActiveView('builder');
    setSelectedReport(null);
  };

  const handleEditReport = (report: ReportTemplate) => {
    setSelectedReport(report);
    setActiveView('builder');
  };

  const handleGenerateReport = async (reportId: string, format: ExportFormat = 'pdf') => {
    try {
      toast({
        title: 'Generating Report',
        description: 'AI is analyzing data and creating your report...',
      });
      
      // Simulate report generation
      const generation: ReportGeneration = {
        id: `gen-${Date.now()}`,
        templateId: reportId,
        status: 'processing',
        progress: 0,
        parameters: {},
        filters: {},
        dateRange: { start: new Date(), end: new Date() },
        format: [format],
        outputs: [],
        requestedBy: 'current-user',
        requestedAt: new Date()
      };
      
      setGenerations(prev => [generation, ...prev]);
      
      // Simulate progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          setGenerations(prev => prev.map(g => 
            g.id === generation.id 
              ? { 
                  ...g, 
                  status: 'completed', 
                  progress: 100,
                  completedAt: new Date(),
                  outputs: [{
                    format,
                    url: `/reports/${generation.id}.${format}`,
                    size: 2048576,
                    generatedAt: new Date(),
                    metadata: { pageCount: 15, chartCount: 8, processingTime: 45000 }
                  }]
                }
              : g
          ));
          
          toast({
            title: 'Report Generated',
            description: 'Your report is ready for download',
          });
        } else {
          setGenerations(prev => prev.map(g => 
            g.id === generation.id ? { ...g, progress } : g
          ));
        }
      }, 1000);
      
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Unable to generate report',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {

  return (
    <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Generate insights and create custom reports for your risk management program.</p>
        </div>
        <div className="flex items-center gap-3">
          <DaisyButton variant="outline" className="text-sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </DaisyButton>
          <DaisyButton variant="outline" className="text-sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </DaisyButton>
          <DaisyButton>
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </DaisyButton>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <DaisyCard className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <DaisyCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Reports</p>
                <p className="text-3xl font-bold text-blue-900">{analytics.totalReports}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </DaisyCardContent>
        </DaisyCard>

        <DaisyCard className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <DaisyCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active Generations</p>
                <p className="text-3xl font-bold text-green-900">{analytics.activeGenerations}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </DaisyCardContent>
        </DaisyCard>

        <DaisyCard className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <DaisyCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Scheduled Reports</p>
                <p className="text-3xl font-bold text-purple-900">{analytics.scheduledReports}</p>
              </div>
              <DaisyCalendar className="h-8 w-8 text-purple-600" />
            </div>
          </DaisyCardContent>
        </DaisyCard>

        <DaisyCard className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <DaisyCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.totalViews}</p>
              </div>
              <Eye className="h-8 w-8 text-gray-600" />
            </div>
          </DaisyCardContent>
        </DaisyCard>

        <DaisyCard className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <DaisyCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600">AI Insights</p>
                <p className="text-3xl font-bold text-indigo-900">{analytics.aiInsights}</p>
              </div>
              <Brain className="h-8 w-8 text-indigo-600" />
            </div>
          </DaisyCardContent>
        </DaisyCard>

        <DaisyCard className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <DaisyCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Avg Gen Time</p>
                <p className="text-3xl font-bold text-orange-900">{analytics.avgGenerationTime}s</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </DaisyCardContent>
        </DaisyCard>
      </div>

      {/* Main Content Tabs */}
      <DaisyTabs value={activeView} onValueChange={setActiveView} className="space-y-6">
        <DaisyTabsList className="grid w-full grid-cols-5">
          <DaisyTabsTrigger value="dashboard">Dashboard</DaisyTabsTrigger>
          <DaisyTabsTrigger value="library">Report Library</DaisyTabsTrigger>
          <DaisyTabsTrigger value="builder">Report Builder</DaisyTabsTrigger>
          <DaisyTabsTrigger value="scheduled">Scheduled Reports</DaisyTabsTrigger>
          <DaisyTabsTrigger value="analytics">Analytics</DaisyTabsTrigger>
        </DaisyTabsList>

        <DaisyTabsContent value="dashboard" className="space-y-6">
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-notion-text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-notion-text-primary mb-2">
              Interactive Dashboard Coming Soon
            </h3>
            <p className="text-notion-text-secondary">
              Real-time reporting dashboard will be available here
            </p>
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="library" className="space-y-6">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-notion-text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-notion-text-primary mb-2">
              Report Library Coming Soon
            </h3>
            <p className="text-notion-text-secondary">
              Comprehensive report templates library will be available here
            </p>
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="builder" className="space-y-6">
          <div className="text-center py-12">
            <Plus className="w-16 h-16 text-notion-text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-notion-text-primary mb-2">
              Advanced Report Builder Coming Soon
            </h3>
            <p className="text-notion-text-secondary">
              Drag-and-drop report builder with AI assistance will be available here
            </p>
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="scheduled" className="space-y-6">
          <div className="text-center py-12">
            <DaisyCalendar className="w-16 h-16 text-notion-text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-notion-text-primary mb-2">
              Scheduled Reports Coming Soon
            </h3>
            <p className="text-notion-text-secondary">
              Automated report scheduling and distribution will be available here
            </p>
          </div>
        </DaisyTabsContent>

        <DaisyTabsContent value="analytics" className="space-y-6">
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-notion-text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-notion-text-primary mb-2">
              Advanced Analytics Coming Soon
            </h3>
            <p className="text-notion-text-secondary">
              Deep reporting analytics and usage insights will be available here
            </p>
          </div>
        </DaisyTabsContent>
      </DaisyTabs>
    </div>
  );
} 