'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  EnhancedControl, 
  AdvancedControlFilters, 
  ControlAnalytics, 
  ControlFramework,
  ControlBulkOperation
} from '@/types/enhanced-control.types';
import { Control } from '@/types';
import { useControls } from '@/context/ControlContext';
import { EnhancedControlService } from '@/services/EnhancedControlService';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

// Icons
import {
  Plus, Search, Filter, Shield, Brain, BarChart3, TestTube, 
  CheckCircle, AlertTriangle, Clock, Users, Eye, Edit, 
  MoreHorizontal, Zap, Network, Calendar, RefreshCw
} from 'lucide-react';

interface EnhancedControlRegistryProps {
  className?: string;
}

export const EnhancedControlRegistry: React.FC<EnhancedControlRegistryProps> = ({ className = '' }) => {
  const { controls: baseControls } = useControls();
  const [enhancedControlService] = useState(() => new EnhancedControlService());

  // State management
  const [enhancedControls, setEnhancedControls] = useState<EnhancedControl[]>([]);
  const [filteredControls, setFilteredControls] = useState<EnhancedControl[]>([]);
  const [selectedControls, setSelectedControls] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<AdvancedControlFilters>({});
  const [sortBy, setSortBy] = useState<'title' | 'effectivenessScore' | 'maturityLevel' | 'framework'>('effectivenessScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState('overview');

  // Modal states
  const [selectedControl, setSelectedControl] = useState<EnhancedControl | null>(null);
  const [showControlDetail, setShowControlDetail] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // Analytics data
  const [analytics, setAnalytics] = useState<ControlAnalytics | null>(null);
  const [frameworks, setFrameworks] = useState<ControlFramework[]>([]);

  // Convert base controls to enhanced controls
  const convertToEnhancedControls = useCallback((controls: Control[]): EnhancedControl[] => {
    return controls.map(control => enhancedControlService.enhanceControl(control));
  }, [enhancedControlService]);

  // Initialize enhanced controls
  useEffect(() => {
    const enhanced = convertToEnhancedControls(baseControls);
    setEnhancedControls(enhanced);
  }, [baseControls, convertToEnhancedControls]);

  // Apply filters and search
  useEffect(() => {
    let filtered = enhancedControls;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(control =>
        control.title.toLowerCase().includes(query) ||
        control.description.toLowerCase().includes(query) ||
        control.framework.name.toLowerCase().includes(query) ||
        control.framework.controlObjective.toLowerCase().includes(query)
      );
    }

    // Apply advanced filters
    filtered = enhancedControlService.filterControls(filtered, filters);

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (sortBy === 'framework') {
        aValue = a.framework.category;
        bValue = b.framework.category;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredControls(filtered);
  }, [enhancedControls, searchQuery, filters, sortBy, sortOrder, enhancedControlService]);

  // Generate analytics
  useEffect(() => {
    const generateAnalytics = async () => {
      if (enhancedControls.length > 0) {
        const analyticsData = await enhancedControlService.generateControlAnalytics(enhancedControls);
        setAnalytics(analyticsData);
      }
    };

    generateAnalytics();
  }, [enhancedControls, enhancedControlService]);

  // Load control frameworks
  useEffect(() => {
    const loadFrameworks = async () => {
      const frameworkList = await enhancedControlService.getControlFrameworks();
      setFrameworks(frameworkList);
    };

    loadFrameworks();
  }, [enhancedControlService]);

  // Handle AI analysis
  const handleAIAnalysis = async (control: EnhancedControl) => {
    setAiAnalyzing(true);
    try {
      const aiAssessment = await enhancedControlService.analyzeControlWithAI(control);
      const effectivenessScore = await enhancedControlService.calculateEffectivenessScore(control);
      
      const updatedControl = {
        ...control,
        aiAssessment,
        effectivenessScore
      };

      setEnhancedControls(prev => 
        prev.map(c => c.id === control.id ? updatedControl : c)
      );

      console.log('AI Assessment completed:', aiAssessment);
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Handle bulk operations
  const handleBulkOperation = async (operation: ControlBulkOperation) => {
    setIsLoading(true);
    try {
      const result = await enhancedControlService.performBulkOperation(operation);
      if (result.success) {
        console.log('Bulk operation completed successfully');
        setSelectedControls([]);
      } else {
        console.error('Bulk operation failed:', result.errors);
      }
    } catch (error) {
      console.error('Bulk operation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Control status/type colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overdue': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMaturityColor = (level: number) => {
    if (level >= 4) return 'bg-green-100 text-green-800 border-green-200';
    if (level >= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getFrameworkColor = (framework: string) => {
    switch (framework) {
      case 'SOC2': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ISO27001': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'NIST': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Control statistics
  const stats = useMemo(() => {
    const total = filteredControls.length;
    const byFramework = filteredControls.reduce((acc, control) => {
      acc[control.framework.category] = (acc[control.framework.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byTestingStatus = filteredControls.reduce((acc, control) => {
      acc[control.testingStatus] = (acc[control.testingStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgEffectiveness = total > 0 ? 
      filteredControls.reduce((sum, control) => sum + control.effectivenessScore, 0) / total : 0;

    const avgMaturity = total > 0 ?
      filteredControls.reduce((sum, control) => sum + control.maturityLevel, 0) / total : 0;

    return { total, byFramework, byTestingStatus, avgEffectiveness, avgMaturity };
  }, [filteredControls]);

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
              Control Registry
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              AI-powered control effectiveness monitoring with industry frameworks and testing workflows
            </p>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-foreground rounded-full"></div>
                <span className="text-muted-foreground">Total: {stats.total}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">Effective: {Math.round(stats.avgEffectiveness)}%</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-muted-foreground">Avg Maturity: {stats.avgMaturity.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TestTube className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Testing: {stats.byTestingStatus.scheduled || 0}</span>
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
            </Button>

            {selectedControls.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="notion-button-outline">
                    <MoreHorizontal className="w-4 h-4 mr-2" />
                    Bulk Actions ({selectedControls.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleBulkOperation({
                    type: 'test',
                    controlIds: selectedControls,
                    data: { testType: 'effectiveness' },
                    userId: 'current-user',
                    timestamp: new Date()
                  })}>
                    <TestTube className="w-4 h-4 mr-2" />
                    Schedule Tests
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkOperation({
                    type: 'approve',
                    controlIds: selectedControls,
                    userId: 'current-user',
                    timestamp: new Date()
                  })}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Controls
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button className="notion-button-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Control
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
                    placeholder="Search controls by title, description, framework, or objective..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 notion-input"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="effectivenessScore">Effectiveness Score</SelectItem>
                    <SelectItem value="maturityLevel">Maturity Level</SelectItem>
                    <SelectItem value="framework">Framework</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
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
          <TabsList className="grid w-full grid-cols-6 bg-secondary">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="controls" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Controls
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              Testing
            </TabsTrigger>
            <TabsTrigger value="frameworks" className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              Frameworks
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
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
                  <CardTitle className="text-sm font-medium">Total Controls</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    Active framework controls
                  </p>
                </CardContent>
              </Card>

              <Card className="notion-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Effectiveness</CardTitle>
                  <Zap className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{Math.round(stats.avgEffectiveness)}%</div>
                  <Progress value={stats.avgEffectiveness} className="w-full mt-2" />
                </CardContent>
              </Card>

              <Card className="notion-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Maturity</CardTitle>
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.avgMaturity.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">
                    Out of 5 levels
                  </p>
                </CardContent>
              </Card>

              <Card className="notion-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tests Due</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.byTestingStatus.scheduled || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Scheduled for testing
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Framework Distribution */}
            <Card className="notion-card">
              <CardHeader>
                <CardTitle>Framework Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.byFramework).map(([framework, count]) => (
                    <div key={framework} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getFrameworkColor(framework)}>
                          {framework}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
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
          </TabsContent>

          {/* Controls Tab */}
          <TabsContent value="controls" className="space-y-6">
            <Card className="notion-card">
              <CardContent className="p-0">
                <div className="divide-y">
                  <AnimatePresence>
                    {filteredControls.map((control) => (
                      <motion.div
                        key={control.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="p-4 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={selectedControls.includes(control.id)}
                            onCheckedChange={(checked) => {
                              setSelectedControls(prev => 
                                checked 
                                  ? [...prev, control.id]
                                  : prev.filter(id => id !== control.id)
                              );
                            }}
                          />
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <h3 className="font-medium text-foreground cursor-pointer hover:underline"
                                    onClick={() => {
                                      setSelectedControl(control);
                                      setShowControlDetail(true);
                                    }}>
                                  {control.title}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {control.framework.controlObjective}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getFrameworkColor(control.framework.category)}>
                                  {control.framework.category}
                                </Badge>
                                <Badge className={getMaturityColor(control.maturityLevel)}>
                                  Level {control.maturityLevel}
                                </Badge>
                                <Badge className={getStatusColor(control.testingStatus)}>
                                  {control.testingStatus.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {control.owner}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {control.frequency}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Network className="w-4 h-4" />
                                  {control.mappedRisks.length} risks
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <div className="text-lg font-bold">{control.effectivenessScore}%</div>
                                  <div className="text-xs text-muted-foreground">Effectiveness</div>
                                </div>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                                      setSelectedControl(control);
                                      setShowControlDetail(true);
                                    }}>
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit Control
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleAIAnalysis(control)}>
                                      <Brain className="w-4 h-4 mr-2" />
                                      AI Assessment
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <TestTube className="w-4 h-4 mr-2" />
                                      Schedule Test
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
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

          {/* Other tabs would be implemented here... */}
          <TabsContent value="testing" className="space-y-6">
            <Card className="notion-card">
              <CardHeader>
                <CardTitle>Control Testing Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <TestTube className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Testing Workflows</h3>
                <p className="text-muted-foreground">
                  Advanced testing workflows with automated scheduling will be available here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Control Detail Modal */}
        <Dialog open={showControlDetail} onOpenChange={setShowControlDetail}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{selectedControl?.title}</span>
                <Badge className={selectedControl ? getFrameworkColor(selectedControl.framework.category) : ''}>
                  {selectedControl?.framework.category}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            
            {selectedControl && (
              <div className="space-y-6">
                {/* Control Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="notion-card-minimal">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">{selectedControl.effectivenessScore}%</div>
                      <div className="text-sm text-muted-foreground">Effectiveness</div>
                    </CardContent>
                  </Card>
                  <Card className="notion-card-minimal">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">{selectedControl.maturityLevel}</div>
                      <div className="text-sm text-muted-foreground">Maturity Level</div>
                    </CardContent>
                  </Card>
                  <Card className="notion-card-minimal">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">{selectedControl.mappedRisks.length}</div>
                      <div className="text-sm text-muted-foreground">Mapped Risks</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Framework Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Framework Details</h3>
                  <Card className="notion-card-minimal">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Framework:</span>
                          <span>{selectedControl.framework.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Domain:</span>
                          <span>{selectedControl.framework.domain}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Control ID:</span>
                          <span>{selectedControl.framework.id}</span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Control Objective</h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedControl.framework.controlObjective}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Assessment */}
                {selectedControl.aiAssessment && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">AI Assessment</h3>
                    <Card className="notion-card-minimal">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Overall Score</div>
                            <div className="text-2xl font-bold">{selectedControl.aiAssessment.overallScore}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Design Effectiveness</div>
                            <div className="text-2xl font-bold">{selectedControl.aiAssessment.designEffectiveness}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
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
                  {aiAnalyzing ? 'Running AI Assessment...' : 'Processing...'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedControlRegistry; 