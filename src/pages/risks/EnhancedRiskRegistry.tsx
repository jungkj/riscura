'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

export const EnhancedRiskRegistry: React.FC<EnhancedRiskRegistryProps> = ({ className = '' }) => {
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
      console.log('AI Analysis completed:', aiSuggestions);
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
        console.log('Bulk operation completed successfully');
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

  // Risk status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'identified': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'assessed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'mitigated': return 'bg-green-100 text-green-800 border-green-200';
      case 'monitored': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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
    <div className={`min-h-screen bg-background ${className}`}>
      <div className="container mx-auto py-8 space-y-6">
        {/* Header Section */}
        <motion.div 
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">
              Risk Registry
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Comprehensive risk management with AI-powered insights and analytics
            </p>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-foreground rounded-full"></div>
                <span className="text-muted-foreground">Total: {stats.total}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-muted-foreground">Critical: {stats.byPriority.critical || 0}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">Mitigated: {stats.byStatus.mitigated || 0}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Avg Score: {stats.avgScore.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
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

            <Button
              onClick={() => setShowCreateModal(true)}
              className="notion-button-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Risk
            </Button>
          </div>
        </motion.div>

        {/* Search and Filters Bar */}
        <Card className="notion-card">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search risks by title, description, owner, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 notion-input"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-40">
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
                  className="notion-button-outline"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-secondary">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Risk List
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="workflows" className="flex items-center gap-2">
              <Workflow className="w-4 h-4" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="ai-insights" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="notion-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Risks</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="notion-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Critical Risks</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.byPriority.critical || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Require immediate attention
                  </p>
                </CardContent>
              </Card>

              <Card className="notion-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.avgScore.toFixed(1)}</div>
                  <Progress value={(stats.avgScore / 25) * 100} className="w-full mt-2" />
                </CardContent>
              </Card>

              <Card className="notion-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Mitigated</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.byStatus.mitigated || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.total > 0 ? Math.round(((stats.byStatus.mitigated || 0) / stats.total) * 100) : 0}% of total
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Risk Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="notion-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Risk Distribution by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics?.risksByCategory || {}).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{category}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${(count / stats.total) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="notion-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Workflow Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.byStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${getStatusColor(status)}`}>
                            {status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${(count / stats.total) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Risks Table */}
            <Card className="notion-card">
              <CardHeader>
                <CardTitle>Top Risks by Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredRisks
                    .sort((a, b) => b.riskScore - a.riskScore)
                    .slice(0, 5)
                    .map((risk) => (
                      <div 
                        key={risk.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedRisk(risk);
                          setShowRiskDetail(true);
                        }}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{risk.title}</h4>
                          <p className="text-sm text-muted-foreground truncate">{risk.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getPriorityColor(risk.priority)}>
                            {risk.priority}
                          </Badge>
                          <div className="text-right">
                            <div className="text-lg font-bold">{risk.riskScore}</div>
                            <div className="text-xs text-muted-foreground">{risk.likelihood}×{risk.impact}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
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
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="p-4 hover:bg-accent/50 transition-colors"
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
                                <Badge className={getPriorityColor(risk.priority)}>
                                  {risk.priority}
                                </Badge>
                                <Badge className={getStatusColor(risk.workflowState)}>
                                  {risk.workflowState}
                                </Badge>
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
                              
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <div className="text-lg font-bold">{risk.riskScore}</div>
                                  <div className="text-xs text-muted-foreground">
                                    L:{risk.likelihood} × I:{risk.impact}
                                  </div>
                                </div>
                                
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
                                    <DropdownMenuItem>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit Risk
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleAIAnalysis(risk)}>
                                      <Brain className="w-4 h-4 mr-2" />
                                      AI Analysis
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
                            
                            {/* AI Confidence Indicator */}
                            {risk.aiConfidence > 0 && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Brain className="w-3 h-3" />
                                <span>AI Confidence: {Math.round(risk.aiConfidence * 100)}%</span>
                                <Progress value={risk.aiConfidence * 100} className="w-16 h-1" />
                              </div>
                            )}
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

        {/* Loading overlay */}
        {(isLoading || aiAnalyzing) && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <Card className="notion-card">
              <CardContent className="p-6 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-lg font-medium">
                  {aiAnalyzing ? 'Running AI Analysis...' : 'Processing...'}
                </p>
                <p className="text-sm text-muted-foreground">
                  This may take a few moments
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}; 