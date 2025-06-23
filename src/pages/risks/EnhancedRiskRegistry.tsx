'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { EnhancedRisk, AdvancedRiskFilters, RiskAnalytics, RiskTemplate, BulkOperation } from '@/types/enhanced-risk.types';
import { Risk } from '@/types';
import { useRisks } from '@/context/RiskContext';
import { EnhancedRiskService } from '@/services/EnhancedRiskService';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Enhanced Dashboard Components
import { EnhancedMetricCard } from '@/components/dashboard/EnhancedMetricCard';
import { EnhancedChartCard } from '@/components/dashboard/EnhancedChartCard';
import { EnhancedListCard } from '@/components/dashboard/EnhancedListCard';
import { 
  EnhancedStatusBadge, 
  EnhancedRiskLevelIndicator,
  EnhancedProgressRing,
  EnhancedTrendIndicator 
} from '@/components/ui/enhanced-status-indicator';
import { colorClasses } from '@/lib/design-system/colors';
import { 
  EnhancedPageContainer,
  EnhancedContentSection,
  EnhancedGrid,
  EnhancedCardContainer,
  EnhancedFlex,
  EnhancedSectionHeader,
  EnhancedSpacer,
  EnhancedDivider 
} from '@/components/layout/enhanced-layout';
import { spacingClasses, layoutClasses } from '@/lib/design-system/spacing';
import { cn } from '@/lib/utils';
import { 
  EnhancedInteractiveButton, 
  EnhancedSkeleton
} from '@/components/ui/enhanced-interactive';
import { 
  variants, 
  interactions, 
  feedbackAnimations,
  timings,
  easings 
} from '@/lib/design-system/micro-interactions';
import { 
  ToastProvider, 
  useToastHelpers 
} from '@/components/ui/toast-system';

// Enhanced Typography Components
import { 
  EnhancedPageHeader, 
  EnhancedSection, 
  EnhancedContentGroup,
  EnhancedHeading,
  EnhancedBodyText,
  EnhancedStatsDisplay 
} from '@/components/ui/enhanced-typography';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

// Icons
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  Brain,
  TrendingUp,
  BarChart3,
  Shield,
  AlertTriangle,
  Target,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Copy,
  Star,
  Zap,
  Workflow,
  MessageSquare,
  Tag,
  Calendar,
  RefreshCw,
  Settings,
  FileText,
  PieChart,
  Activity
} from 'lucide-react';

interface EnhancedRiskRegistryProps {
  className?: string;
}

const EnhancedRiskRegistry: React.FC<EnhancedRiskRegistryProps> = ({ className = '' }) => {
  const router = useRouter();
  const { success, error, info } = useToastHelpers();
  const { risks: baseRisks, getRiskStats, createRisk, updateRisk, deleteRisk } = useRisks();
  const [enhancedRiskService] = useState(() => new EnhancedRiskService());

  // State management
  const [enhancedRisks, setEnhancedRisks] = useState<EnhancedRisk[]>([]);
  const [filteredRisks, setFilteredRisks] = useState<EnhancedRisk[]>([]);
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<AdvancedRiskFilters>({});
  const [sortBy, setSortBy] = useState<'title' | 'riskScore' | 'createdAt' | 'priority'>('riskScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'matrix' | 'analytics'>('list');
  const [activeTab, setActiveTab] = useState('overview');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setBulkModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<EnhancedRisk | null>(null);
  const [showRiskDetail, setShowRiskDetail] = useState(false);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // Analytics data
  const [analytics, setAnalytics] = useState<RiskAnalytics | null>(null);
  const [riskTemplates, setRiskTemplates] = useState<RiskTemplate[]>([]);

  // Convert base risks to enhanced risks
  const convertToEnhancedRisks = useCallback((risks: Risk[]): EnhancedRisk[] => {
    return risks.map(risk => enhancedRiskService.enhanceRisk(risk));
  }, [enhancedRiskService]);

  // Initialize enhanced risks
  useEffect(() => {
    const enhanced = convertToEnhancedRisks(baseRisks);
    setEnhancedRisks(enhanced);
  }, [baseRisks, convertToEnhancedRisks]);

  // Apply filters and search
  useEffect(() => {
    let filtered = enhancedRisks;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(risk =>
        risk.title.toLowerCase().includes(query) ||
        risk.description.toLowerCase().includes(query) ||
        risk.riskOwner.toLowerCase().includes(query) ||
        risk.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply advanced filters
    filtered = enhancedRiskService.filterRisks(filtered, filters);

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (sortBy === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredRisks(filtered);
  }, [enhancedRisks, searchQuery, filters, sortBy, sortOrder, enhancedRiskService]);

  // Generate analytics
  useEffect(() => {
    const generateAnalytics = async () => {
      if (enhancedRisks.length > 0) {
        const analyticsData = await enhancedRiskService.generateRiskAnalytics(enhancedRisks);
        setAnalytics(analyticsData);
      }
    };

    generateAnalytics();
  }, [enhancedRisks, enhancedRiskService]);

  // Load risk templates
  useEffect(() => {
    const loadTemplates = async () => {
      const templates = await enhancedRiskService.getRiskTemplates();
      setRiskTemplates(templates);
    };

    loadTemplates();
  }, [enhancedRiskService]);

  // Handle risk selection
  const handleRiskSelection = (riskId: string, selected: boolean) => {
    setSelectedRisks(prev => 
      selected 
        ? [...prev, riskId]
        : prev.filter(id => id !== riskId)
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    const allSelected = selectedRisks.length === filteredRisks.length;
    setSelectedRisks(allSelected ? [] : filteredRisks.map(risk => risk.id));
  };

  // Handle AI analysis
  const handleAIAnalysis = async (risk: EnhancedRisk) => {
    setAiAnalyzing(true);
    try {
      const aiSuggestions = await enhancedRiskService.analyzeRiskWithAI(risk);
      
      // Update risk with AI suggestions
      const updatedRisk = {
        ...risk,
        aiSuggestions,
        aiLastAnalyzed: new Date(),
        aiConfidence: aiSuggestions.confidenceScore
      };

      // Update in the list
      setEnhancedRisks(prev => 
        prev.map(r => r.id === risk.id ? updatedRisk : r)
      );

      // Show suggestions in a modal or notification
      success('AI analysis completed successfully');
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Handle bulk operations
  const handleBulkOperation = async (operation: BulkOperation) => {
    setIsLoading(true);
    try {
      const result = await enhancedRiskService.performBulkOperation(operation);
      if (result.success) {
        success('Bulk operation completed successfully');
        setSelectedRisks([]);
      } else {
        console.error('Bulk operation failed:', result.errors);
      }
    } catch (error) {
      console.error('Bulk operation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced status and priority color functions using the new color system
  const getStatusColor = (status: string) => {
    return colorClasses.status[status as keyof typeof colorClasses.status] || colorClasses.status.neutral;
  };

  const getPriorityColor = (priority: string) => {
    return colorClasses.status[priority as keyof typeof colorClasses.status] || colorClasses.status.neutral;
  };

  // Navigation handlers
  const handleNavigateToCriticalRisks = useCallback(() => {
    setFilters({ priority: ['critical', 'high'] });
    setActiveTab('list');
    success('Filtered to show critical and high priority risks');
  }, [success]);

  const handleNavigateToScoreAnalytics = useCallback(() => {
    setActiveTab('analytics');
    setViewMode('analytics');
    info('Switched to risk score analytics view');
  }, [info]);

  const handleNavigateToMitigatedRisks = useCallback(() => {
    setFilters({ status: ['mitigated'] });
    setActiveTab('list');
    success('Filtered to show mitigated risks');
  }, [success]);

  // Filtering handlers
  const handleFilterByCategory = useCallback((category: string) => {
    setFilters(prev => ({
      ...prev,
      category: [category]
    }));
    setActiveTab('list');
    success(`Filtered risks by category: ${category}`);
  }, [success]);

  const handleFilterByStatus = useCallback((status: string) => {
    setFilters(prev => ({
      ...prev,
      status: [status]
    }));
    setActiveTab('list');
    success(`Filtered risks by status: ${status}`);
  }, [success]);

  // Risk statistics
  const stats = useMemo(() => {
    const total = filteredRisks.length;
    const byStatus = filteredRisks.reduce((acc, risk) => {
      acc[risk.workflowState] = (acc[risk.workflowState] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byPriority = filteredRisks.reduce((acc, risk) => {
      acc[risk.priority] = (acc[risk.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgScore = total > 0 ? filteredRisks.reduce((sum, risk) => sum + risk.riskScore, 0) / total : 0;

    return { total, byStatus, byPriority, avgScore };
  }, [filteredRisks]);

  return (
    <EnhancedPageContainer maxWidth="xl" padding="md" className={className}>
      <EnhancedContentSection spacing="normal">
        {/* Header Section */}
        <EnhancedPageHeader
          title="Risk Registry"
          subtitle="Comprehensive risk management with AI-powered insights and analytics"
          breadcrumbs={[
            { label: 'Dashboard' },
            { label: 'Risk Management' },
            { label: 'Registry' }
          ]}
          stats={[
            {
              label: 'Total',
              value: stats.total,
              description: 'All risks',
              color: 'default',
              icon: <Shield className="w-4 h-4 text-slate-600" />
            },
            {
              label: 'Critical',
              value: stats.byPriority.critical || 0,
              description: 'High priority',
              color: 'danger',
              icon: <AlertTriangle className="w-4 h-4 text-red-600" />
            },
            {
              label: 'Mitigated',
              value: stats.byStatus.mitigated || 0,
              description: `${stats.total > 0 ? Math.round(((stats.byStatus.mitigated || 0) / stats.total) * 100) : 0}% resolved`,
              color: 'success',
              icon: <CheckCircle className="w-4 h-4 text-green-600" />
            },
            {
              label: 'Score',
              value: stats.avgScore.toFixed(1),
              description: 'Average risk level',
              color: 'info',
              icon: <TrendingUp className="w-4 h-4 text-blue-600" />
            }
          ]}
          actions={
            <>
              <Button
                onClick={() => setShowFiltersModal(true)}
                variant="outline"
                className="notion-button-outline"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {Object.keys(filters).length > 0 && (
                  <Badge className="ml-2 h-5 w-5 p-0 text-xs">
                    {Object.keys(filters).length}
                  </Badge>
                )}
              </Button>
              
              <Button
                onClick={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')}
                variant="outline"
                className="notion-button-outline"
              >
                {viewMode === 'list' ? <BarChart3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>

              {selectedRisks.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="notion-button-outline">
                      <MoreHorizontal className="w-4 h-4 mr-2" />
                      Bulk Actions ({selectedRisks.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Bulk Operations</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleBulkOperation({
                      type: 'update',
                      riskIds: selectedRisks,
                      data: { status: 'assessed' },
                      userId: 'current-user',
                      timestamp: new Date()
                    })}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Assessed
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkOperation({
                      type: 'assign',
                      riskIds: selectedRisks,
                      data: { assignee: 'current-user' },
                      userId: 'current-user',
                      timestamp: new Date()
                    })}>
                      <Users className="w-4 h-4 mr-2" />
                      Assign to Me
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkOperation({
                      type: 'export',
                      riskIds: selectedRisks,
                      data: { format: 'csv' },
                      userId: 'current-user',
                      timestamp: new Date()
                    })}>
                      <Download className="w-4 h-4 mr-2" />
                      Export Selected
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => handleBulkOperation({
                        type: 'delete',
                        riskIds: selectedRisks,
                        userId: 'current-user',
                        timestamp: new Date()
                      })}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <EnhancedInteractiveButton
                onClick={() => setShowCreateModal(true)}
                variant="primary"
                className="notion-button-primary"
              >
                <motion.div
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: timings.quick, ease: easings.snappy }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                </motion.div>
                Add Risk
              </EnhancedInteractiveButton>
            </>
          }
        />

        {/* Search and Filters Bar */}
        <EnhancedSection background="card" spacing="tight">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search risks by title, description, owner, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSearchQuery('');
                    }
                  }}
                  className="pl-10 text-base placeholder:text-slate-400 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                  aria-label="Search risks"
                  role="searchbox"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <EnhancedBodyText variant="small" className="text-slate-500 font-medium">
                  Sort by:
                </EnhancedBodyText>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-40 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="riskScore">Risk Score</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="createdAt">Created Date</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  variant="outline"
                  size="sm"
                  className="border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>
          </div>
        </EnhancedSection>

        {/* Main Content Tabs */}
        <EnhancedSection spacing="small">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-slate-100/80 p-1 rounded-lg border border-slate-200/60">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 font-medium text-slate-600 data-[state=active]:text-slate-900 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 hover:bg-slate-200/50"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Shield className="w-4 h-4" />
                </motion.div>
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="list" 
                className="flex items-center gap-2 font-medium text-slate-600 data-[state=active]:text-slate-900 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Risk List</span>
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="flex items-center gap-2 font-medium text-slate-600 data-[state=active]:text-slate-900 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger 
                value="workflows" 
                className="flex items-center gap-2 font-medium text-slate-600 data-[state=active]:text-slate-900 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Workflow className="w-4 h-4" />
                <span className="hidden sm:inline">Workflows</span>
              </TabsTrigger>
              <TabsTrigger 
                value="ai-insights" 
                className="flex items-center gap-2 font-medium text-slate-600 data-[state=active]:text-slate-900 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">AI Insights</span>
              </TabsTrigger>
            </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
            {/* Key Metrics Section */}
            <EnhancedSection 
              title="Key Risk Metrics" 
              subtitle="Real-time overview of your risk portfolio"
              spacing="tight"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <style jsx>{`
                  .metric-card-container > div {
                    height: 100%;
                    min-height: 200px;
                  }
                `}</style>
                {isLoading ? (
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <EnhancedSkeleton
                          lines={3}
                          height="h-20"
                          animated={true}
                          className="p-6 bg-white rounded-xl border border-slate-200"
                        />
                      </motion.div>
                    ))}
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="metric-card-container h-full"
                    >
                      <EnhancedMetricCard
                        title="Total Risks"
                        value={stats.total}
                        icon={Shield}
                        variant="default"
                        trend={{
                          value: 12,
                          isPositive: true,
                          period: "from last month"
                        }}
                        sparkline={{
                          values: [8, 12, 15, 18, 22, 25, stats.total],
                          trend: 'up'
                        }}
                        onClick={() => window.location.href = '/dashboard/risks'}
                        className="h-full"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="metric-card-container h-full"
                    >
                      <EnhancedMetricCard
                        title="Critical Risks"
                        value={stats.byPriority.critical || 0}
                        icon={AlertTriangle}
                        variant="danger"
                        subtitle="Require immediate attention"
                        badge={{
                          text: "High Priority",
                          variant: "danger"
                        }}
                        onClick={handleNavigateToCriticalRisks}
                        className="h-full"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="metric-card-container h-full"
                    >
                      <EnhancedMetricCard
                        title="Average Score"
                        value={stats.avgScore.toFixed(1)}
                        icon={TrendingUp}
                        variant="info"
                        progress={{
                          value: stats.avgScore,
                          max: 25,
                          showProgress: true
                        }}
                        trend={{
                          value: 5,
                          isPositive: false,
                          period: "this quarter"
                        }}
                        onClick={handleNavigateToScoreAnalytics}
                        className="h-full"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="metric-card-container h-full"
                    >
                      <EnhancedMetricCard
                        title="Mitigated Risks"
                        value={stats.byStatus.mitigated || 0}
                        icon={CheckCircle}
                        variant="success"
                        subtitle={`${stats.total > 0 ? Math.round(((stats.byStatus.mitigated || 0) / stats.total) * 100) : 0}% of total`}
                        sparkline={{
                          values: [2, 4, 6, 8, 10, 12, stats.byStatus.mitigated || 0],
                          trend: 'up'
                        }}
                        onClick={handleNavigateToMitigatedRisks}
                        className="h-full"
                      />
                    </motion.div>
                  </>
                )}
              </div>
            </EnhancedSection>
            
            {/* Risk Distribution Charts */}
            <EnhancedSection 
              title="Risk Distribution Analysis"
              subtitle="Detailed breakdown of risks by category and workflow status"
              spacing="tight"
              separator="subtle"
            >
              <EnhancedGrid cols={2} gap="lg" responsive={true}>
              <EnhancedChartCard
                title="Risk Distribution by Category"
                subtitle="Breakdown of risks across different categories"
                icon={PieChart}
                data={Object.entries(analytics?.risksByCategory || {}).map(([category, count]) => ({
                  label: category,
                  value: count,
                  percentage: stats.total > 0 ? (count / stats.total) * 100 : 0,
                  trend: {
                    value: Math.floor(Math.random() * 10) + 1,
                    isPositive: Math.random() > 0.5
                  }
                }))}
                totalValue={stats.total}
                onItemClick={(item) => handleFilterByCategory(item.label)}
              />

              <EnhancedChartCard
                title="Workflow Status Distribution"
                subtitle="Current status of risk management workflows"
                icon={Activity}
                data={Object.entries(stats.byStatus).map(([status, count]) => ({
                  label: status,
                  value: count,
                  percentage: stats.total > 0 ? (count / stats.total) * 100 : 0,
                  color: status === 'mitigated' ? 'bg-green-500' : 
                         status === 'critical' ? 'bg-red-500' :
                         status === 'assessed' ? 'bg-blue-500' : 'bg-amber-500',
                  trend: {
                    value: Math.floor(Math.random() * 15) + 1,
                    isPositive: status === 'mitigated' || status === 'assessed'
                  }
                }))}
                totalValue={stats.total}
                onItemClick={(item) => handleFilterByStatus(item.label)}
              />
              </EnhancedGrid>
            </EnhancedSection>

            {/* Risk Status Overview - Notion/Vanta Style */}
            <EnhancedSection 
              title="Risk Status Overview"
              subtitle="Simple, clean overview of risk statuses and priorities"
              spacing="tight"
              separator="subtle"
            >
              <div className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Priority Levels */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-900">Priority Levels</h4>
                      <span className="text-sm text-slate-500">{stats.total} total</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { level: 'critical', count: stats.byPriority.critical || 0, color: 'red' },
                        { level: 'high', count: stats.byPriority.high || 0, color: 'red' },
                        { level: 'medium', count: stats.byPriority.medium || 0, color: 'yellow' },
                        { level: 'low', count: stats.byPriority.low || 0, color: 'green' }
                      ].map(({ level, count, color }) => (
                        <div key={level} className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              color === 'red' ? 'bg-red-500' :
                              color === 'yellow' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`} />
                            <span className="text-sm font-medium text-slate-700 uppercase tracking-wider">
                              {level}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold text-slate-900">{count}</span>
                            <span className="text-xs text-slate-500">
                              {stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Workflow Status */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-900">Workflow Status</h4>
                      <span className="text-sm text-slate-500">Current progress</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { status: 'identified', count: stats.byStatus.identified || 0, color: 'blue', description: 'Newly identified' },
                        { status: 'assessed', count: stats.byStatus.assessed || 0, color: 'blue', description: 'Under assessment' },
                        { status: 'mitigated', count: stats.byStatus.mitigated || 0, color: 'green', description: 'Successfully mitigated' },
                        { status: 'monitoring', count: stats.byStatus.monitoring || 0, color: 'slate', description: 'Being monitored' }
                      ].map(({ status, count, color, description }) => (
                        <div key={status} className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              color === 'blue' ? 'bg-blue-500' :
                              color === 'green' ? 'bg-green-500' :
                              'bg-slate-400'
                            }`} />
                            <div>
                              <span className="text-sm font-medium text-slate-700 uppercase tracking-wider block">
                                {status}
                              </span>
                              <span className="text-xs text-slate-500">{description}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold text-slate-900">{count}</span>
                            <span className="text-xs text-slate-500">
                              {stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </EnhancedSection>

            {/* Top Risks Table */}
            <EnhancedSection 
              title="Priority Risk Review"
              subtitle="Top risks requiring immediate attention"
              spacing="tight"
              separator="subtle"
            >
              <EnhancedListCard
              title="Top Risks by Score"
              subtitle="Highest priority risks requiring attention"
              icon={Target}
              items={filteredRisks
                .sort((a, b) => b.riskScore - a.riskScore)
                .slice(0, 8)
                .map((risk) => ({
                  id: risk.id,
                  title: risk.title,
                  description: risk.description,
                  value: risk.riskScore,
                  subValue: `${risk.likelihood}×${risk.impact}`,
                  priority: risk.priority as 'low' | 'medium' | 'high' | 'critical',
                  status: risk.workflowState,
                  metadata: { risk }
                }))}
              maxItems={5}
              onItemClick={(item) => {
                if (item.metadata?.risk) {
                  setSelectedRisk(item.metadata.risk);
                  setShowRiskDetail(true);
                }
              }}
              onViewAll={() => setActiveTab('list')}
              emptyMessage="No risks found"
              />
            </EnhancedSection>
            </motion.div>
          </TabsContent>

          {/* Risk List Tab */}
          <TabsContent value="list" className="space-y-6">
            <Card className="notion-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle>Risk Registry</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {filteredRisks.length} of {enhancedRisks.length} risks shown
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedRisks.length === filteredRisks.length && filteredRisks.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">Select All</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  <AnimatePresence>
                    {filteredRisks.map((risk) => (
                      <motion.div
                        key={risk.id}
                        layout
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        whileHover={{ 
                          y: -2, 
                          scale: 1.01,
                          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
                          backgroundColor: "rgba(59, 130, 246, 0.02)"
                        }}
                        whileTap={{ scale: 0.98 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 24,
                          layout: { duration: 0.3 }
                        }}
                        className="p-6 rounded-lg border border-transparent hover:border-blue-200/50 cursor-pointer"
                      >
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={selectedRisks.includes(risk.id)}
                            onCheckedChange={(checked) => handleRiskSelection(risk.id, checked as boolean)}
                          />
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <h3 className="font-medium text-foreground cursor-pointer hover:underline"
                                    onClick={() => {
                                      setSelectedRisk(risk);
                                      setShowRiskDetail(true);
                                    }}>
                                  {risk.title}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {risk.description}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <EnhancedStatusBadge 
                                  status={risk.priority}
                                  size="sm"
                                  showIcon={true}
                                  animated={true}
                                />
                                <EnhancedStatusBadge 
                                  status={risk.workflowState}
                                  size="sm"
                                  variant="outline"
                                  animated={true}
                                />
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {risk.riskOwner}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Tag className="w-4 h-4" />
                                  {risk.category}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(risk.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className="text-lg font-bold">{risk.riskScore}</div>
                                  <div className="text-xs text-muted-foreground">
                                    L:{risk.likelihood} × I:{risk.impact}
                                  </div>
                                </div>
                                <EnhancedRiskLevelIndicator 
                                  level={risk.riskScore}
                                  confidence={risk.aiConfidence || 0.7}
                                  showConfidence={false}
                                  size="sm"
                                  orientation="vertical"
                                  animated={true}
                                />
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                                      setSelectedRisk(risk);
                                      setShowRiskDetail(true);
                                    }}>
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                      // Navigate to edit risk page
                                      window.location.href = `/dashboard/risks/${risk.id}/edit`;
                                    }}>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit Risk
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleAIAnalysis(risk)}>
                                      <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="flex items-center"
                                      >
                                        <motion.div
                                          animate={aiAnalyzing ? { rotate: 360 } : { rotate: 0 }}
                                          transition={{ duration: 2, repeat: aiAnalyzing ? Infinity : 0 }}
                                        >
                                          <Brain className="w-4 h-4 mr-2" />
                                        </motion.div>
                                        AI Analysis
                                      </motion.div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Copy className="w-4 h-4 mr-2" />
                                      Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600">
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            
                            {/* Tags */}
                            {risk.tags.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                {risk.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            
                            {/* Enhanced Status Indicators */}
                            <div className="flex items-center justify-between">
                              {/* AI Confidence Indicator */}
                              {risk.aiConfidence > 0 && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Brain className="w-3 h-3" />
                                  <span>AI Confidence: {Math.round(risk.aiConfidence * 100)}%</span>
                                  <EnhancedProgressRing 
                                    progress={risk.aiConfidence * 100}
                                    size={24}
                                    strokeWidth={3}
                                    status="info"
                                    showPercentage={false}
                                    animated={true}
                                  />
                                </div>
                              )}
                              
                              {/* Trend Indicator */}
                              <EnhancedTrendIndicator 
                                trend={risk.riskScore > 15 ? 'up' : risk.riskScore < 10 ? 'down' : 'stable'}
                                value={Math.floor(Math.random() * 20) - 10}
                                showValue={true}
                                size="sm"
                                animated={true}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="notion-card">
                <CardHeader>
                  <CardTitle>Risk Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Risk trend chart will be implemented here
                  </div>
                </CardContent>
              </Card>
              
              <Card className="notion-card">
                <CardHeader>
                  <CardTitle>Mitigation Effectiveness</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Mitigation effectiveness chart will be implemented here
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="ai-insights" className="space-y-6">
            <Card className="notion-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI-Powered Risk Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">AI Insights Coming Soon</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Advanced AI-powered risk correlation analysis, predictive modeling, and 
                    intelligent recommendations will be available here.
                  </p>
                  <Button 
                    className="mt-4"
                    onClick={() => {
                      if (enhancedRisks.length > 0) {
                        handleAIAnalysis(enhancedRisks[0]);
                      }
                    }}
                    disabled={aiAnalyzing}
                  >
                    {aiAnalyzing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                    Generate AI Insights
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </EnhancedSection>

        {/* Risk Detail Modal */}
        <Dialog open={showRiskDetail} onOpenChange={setShowRiskDetail}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{selectedRisk?.title}</span>
                <Badge className={selectedRisk ? getPriorityColor(selectedRisk.priority) : ''}>
                  {selectedRisk?.priority}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Risk ID: {selectedRisk?.id} | Created: {selectedRisk ? new Date(selectedRisk.createdAt).toLocaleDateString() : ''}
              </DialogDescription>
            </DialogHeader>
            
            {selectedRisk && (
              <div className="space-y-6">
                {/* Risk Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="notion-card-minimal">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{selectedRisk.riskScore}</div>
                        <div className="text-sm text-muted-foreground">Risk Score</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="notion-card-minimal">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{selectedRisk.likelihood}</div>
                        <div className="text-sm text-muted-foreground">Likelihood</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="notion-card-minimal">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{selectedRisk.impact}</div>
                        <div className="text-sm text-muted-foreground">Impact</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Risk Description */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{selectedRisk.description}</p>
                </div>

                {/* Risk Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Risk Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category:</span>
                        <span className="capitalize">{selectedRisk.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge className={getStatusColor(selectedRisk.workflowState)}>
                          {selectedRisk.workflowState}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Owner:</span>
                        <span>{selectedRisk.riskOwner}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{new Date(selectedRisk.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">AI Analysis</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">AI Confidence:</span>
                        <span>{Math.round(selectedRisk.aiConfidence * 100)}%</span>
                      </div>
                      {selectedRisk.aiLastAnalyzed && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Analyzed:</span>
                          <span>{new Date(selectedRisk.aiLastAnalyzed).toLocaleDateString()}</span>
                        </div>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleAIAnalysis(selectedRisk)}
                        disabled={aiAnalyzing}
                        className="w-full mt-2"
                      >
                        {aiAnalyzing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                        Run AI Analysis
                      </Button>
                    </div>
                  </div>
                </div>

                {/* AI Suggestions */}
                {selectedRisk.aiSuggestions && (
                  <div>
                    <h4 className="font-medium mb-2">AI Suggestions</h4>
                    <Card className="notion-card-minimal">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          {selectedRisk.aiSuggestions.reasoningExplanation}
                        </p>
                        
                        {selectedRisk.aiSuggestions.suggestedMitigations.length > 0 && (
                          <div className="mt-4">
                            <h5 className="font-medium text-sm mb-2">Suggested Mitigations:</h5>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {selectedRisk.aiSuggestions.suggestedMitigations.map((mitigation, index) => (
                                <li key={index}>{mitigation}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowRiskDetail(false)}>
                    Close
                  </Button>
                  <Button>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Risk
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Enhanced Loading overlay with micro-interactions */}
        {(isLoading || aiAnalyzing) && (
          <motion.div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 0.4, 
                ease: [0.23, 1, 0.32, 1],
                type: "spring",
                stiffness: 300,
                damping: 24
              }}
            >
              <Card className="notion-card">
                <CardContent className="p-6 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "linear" 
                    }}
                    className="mx-auto mb-4"
                  >
                    <RefreshCw className="w-8 h-8 text-blue-600" />
                  </motion.div>
                  <motion.p 
                    className="text-lg font-medium"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {aiAnalyzing ? 'Running AI Analysis...' : 'Processing...'}
                  </motion.p>
                  <motion.p 
                    className="text-sm text-muted-foreground"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    This may take a few moments
                  </motion.p>
                  {/* Progress dots animation */}
                  <motion.div 
                    className="flex justify-center gap-1 mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-blue-600 rounded-full"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                      />
                    ))}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </EnhancedContentSection>
    </EnhancedPageContainer>
  );
};

export { EnhancedRiskRegistry };
export default EnhancedRiskRegistry; 