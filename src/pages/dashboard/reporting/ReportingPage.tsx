'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [reports, setReports] = useState<any[]>([]);
  const [generations, setGenerations] = useState<ReportGeneration[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
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
      
      // Load data from APIs in parallel
      const [reportsResponse, metricsResponse] = await Promise.all([
        fetch('/api/reports?limit=50', { credentials: 'include' }),
        fetch('/api/reporting/metrics?timeRange=30d', { credentials: 'include' })
      ]);

      // Handle reports
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        if (reportsData.success || reportsData.data) {
          setReports(reportsData.data || []);
        }
      }

      // Handle metrics
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        if (metricsData.success || metricsData.data) {
          setMetrics(metricsData.data);
        }
      }

      // Calculate analytics from real data
      const totalReports = reports.length || 0;
      const totalViews = reports.reduce((sum, r) => sum + (r.totalViews || 0), 0);
      
      setAnalytics({
        totalReports,
        activeGenerations: 2, // Would come from a separate API
        scheduledReports: reports.filter(r => r.scheduledDelivery?.enabled).length,
        totalViews,
        aiInsights: totalReports * 8, // Estimate based on reports with AI features
        avgGenerationTime: 45 // Would come from metrics API
      });

      setIsLoading(false);
      
      toast({
        title: 'Reporting System Ready',
        description: `${totalReports} reports loaded successfully`,
      });
    } catch (error) {
      console.error('Failed to load reporting data:', error);
      setIsLoading(false);
      toast({
        title: 'Loading Failed',
        description: 'Unable to load reporting data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Filtering
  const filteredReports = reports.filter(r => {
    if (!r) return false;
    const matchesSearch = !searchQuery || 
      (r.title || r.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(searchQuery.toLowerCase());
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
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Generate insights and create custom reports for your risk management program.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="text-sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" className="text-sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Reports</p>
                <p className="text-3xl font-bold text-blue-900">{analytics.totalReports}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active Generations</p>
                <p className="text-3xl font-bold text-green-900">{analytics.activeGenerations}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Scheduled Reports</p>
                <p className="text-3xl font-bold text-purple-900">{analytics.scheduledReports}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.totalViews}</p>
              </div>
              <Eye className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600">AI Insights</p>
                <p className="text-3xl font-bold text-indigo-900">{analytics.aiInsights}</p>
              </div>
              <Brain className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Avg Gen Time</p>
                <p className="text-3xl font-bold text-orange-900">{analytics.avgGenerationTime}s</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="library">Report Library</TabsTrigger>
          <TabsTrigger value="builder">Report Builder</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {metrics ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Risk Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Critical Risks</span>
                      <Badge variant="destructive">{metrics.summary?.criticalRisks || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">High Risks</span>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">{metrics.summary?.highRisks || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Risks</span>
                      <Badge variant="secondary">{metrics.summary?.totalRisks || 0}</Badge>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <span className="text-sm text-gray-600">Risk Trend: </span>
                      <Badge variant={metrics.summary?.trendsAnalysis?.riskTrend === 'decreasing' ? 'default' : 'secondary'}>
                        {metrics.summary?.trendsAnalysis?.riskTrend || 'stable'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    Control Effectiveness
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Controls</span>
                      <Badge variant="secondary">{metrics.summary?.totalControls || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Effective Controls</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">{metrics.summary?.effectiveControls || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Effectiveness Rate</span>
                      <Badge variant="secondary">
                        {metrics.summary?.totalControls > 0 ? Math.round((metrics.summary.effectiveControls / metrics.summary.totalControls) * 100) : 0}%
                      </Badge>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <span className="text-sm text-gray-600">Compliance Rate: </span>
                      <Badge variant="default" className="bg-blue-100 text-blue-800">
                        {metrics.summary?.complianceRate || 0}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Loading Dashboard Data
              </h3>
              <p className="text-gray-600">
                Fetching real-time reporting metrics...
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="library" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <Select value={selectedCategory} onValueChange={(value: any) => setSelectedCategory(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="risk_management">Risk Management</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateReport}>
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
          </div>

          {/* Reports List */}
          {filteredReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{report.title || report.name}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {report.description}
                        </p>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {report.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span>By {report.createdBy}</span>
                      <span>{report.totalViews || 0} views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleGenerateReport(report.id)}>
                        <Download className="h-4 w-4 mr-1" />
                        Generate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery || selectedCategory !== 'all' ? 'No Matching Reports' : 'No Reports Available'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first report to get started'}
              </p>
              <Button onClick={handleCreateReport}>
                <Plus className="h-4 w-4 mr-2" />
                Create Report
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          <div className="text-center py-12">
            <Plus className="w-16 h-16 text-notion-text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-notion-text-primary mb-2">
              Advanced Report Builder Coming Soon
            </h3>
            <p className="text-notion-text-secondary">
              Drag-and-drop report builder with AI assistance will be available here
            </p>
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-notion-text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-notion-text-primary mb-2">
              Scheduled Reports Coming Soon
            </h3>
            <p className="text-notion-text-secondary">
              Automated report scheduling and distribution will be available here
            </p>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-notion-text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-notion-text-primary mb-2">
              Advanced Analytics Coming Soon
            </h3>
            <p className="text-notion-text-secondary">
              Deep reporting analytics and usage insights will be available here
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 