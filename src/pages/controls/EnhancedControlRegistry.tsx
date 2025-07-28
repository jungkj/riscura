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
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyDialog, DaisyDialogContent, DaisyDialogHeader, DaisyDialogTitle } from '@/components/ui/DaisyDialog';
import { DaisyDropdownMenu, DaisyDropdownMenuContent, DaisyDropdownMenuItem, DaisyDropdownMenuTrigger } from '@/components/ui/DaisyDropdown';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyProgress } from '@/components/ui/DaisyProgress';

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
      default: return 'bg-secondary/20 text-foreground border-border';
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
      case 'ISO27001': return 'bg-secondary/20 text-foreground border-border';
      case 'NIST': return 'bg-secondary/20 text-foreground border-border';
      default: return 'bg-secondary/20 text-foreground border-border';
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
            <DaisyButton
              onClick={() => setShowFiltersModal(true)}
              variant="outline"
              className="notion-button-outline"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </DaisyButton>

            {selectedControls.length > 0 && (
              <DaisyDropdownMenu>
                <DaisyDropdownMenuTrigger asChild>
                  <DaisyButton variant="outline" className="notion-button-outline">
                    <MoreHorizontal className="w-4 h-4 mr-2" />
                    Bulk Actions ({selectedControls.length})
                  </DaisyButton>
                </DaisyDropdownMenuTrigger>
                <DaisyDropdownMenuContent align="end">
                  <DaisyDropdownMenuItem onClick={() => handleBulkOperation({
                    type: 'test',
                    controlIds: selectedControls,
                    data: { testType: 'effectiveness' },
                    userId: 'current-user',
                    timestamp: new Date()
                  })}>
                    <TestTube className="w-4 h-4 mr-2" />
                    Schedule Tests
                  </DaisyDropdownMenuItem>
                  <DaisyDropdownMenuItem onClick={() => handleBulkOperation({
                    type: 'approve',
                    controlIds: selectedControls,
                    userId: 'current-user',
                    timestamp: new Date()
                  })}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Controls
                  </DaisyDropdownMenuItem>
                </DaisyDropdownMenuContent>
              </DaisyDropdownMenu>
            )}

            <DaisyButton className="notion-button-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Control
            </DaisyButton>
          </div>
        </motion.div>

        {/* Search and Filters Bar */}
        <DaisyCard className="notion-card">
          <DaisyCardBody className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <DaisyInput
                    placeholder="Search controls by title, description, framework, or objective..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 notion-input"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <DaisySelect value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <DaisySelectTrigger className="w-48">
                    <DaisySelectValue />
                  </SelectTrigger>
                  <DaisySelectContent>
                    <DaisySelectItem value="effectivenessScore">Effectiveness Score</SelectItem>
                    <DaisySelectItem value="maturityLevel">Maturity Level</SelectItem>
                    <DaisySelectItem value="framework">Framework</SelectItem>
                    <DaisySelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </DaisySelect>
                
                <DaisyButton
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  variant="outline"
                  size="sm"
                  className="notion-button-outline"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </DaisyButton>
              </div>
            </div>
          </DaisyCardBody>
        </DaisyCard>

        {/* Main Content Tabs */}
        <DaisyTabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <DaisyTabsList className="grid w-full grid-cols-6 bg-secondary">
            <DaisyTabsTrigger value="overview" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Overview
            </DaisyTabsTrigger>
            <DaisyTabsTrigger value="controls" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Controls
            </DaisyTabsTrigger>
            <DaisyTabsTrigger value="testing" className="flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              Testing
            </DaisyTabsTrigger>
            <DaisyTabsTrigger value="frameworks" className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              Frameworks
            </DaisyTabsTrigger>
            <DaisyTabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </DaisyTabsTrigger>
            <DaisyTabsTrigger value="ai-insights" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Insights
            </DaisyTabsTrigger>
          </DaisyTabsList>

          {/* Overview Tab */}
          <DaisyTabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <DaisyCard className="notion-card">
                <DaisyCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <DaisyCardTitle className="text-sm font-medium">Total Controls</DaisyCardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                
                <DaisyCardBody>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    Active framework controls
                  </p>
                </DaisyCardBody>
              </DaisyCard>

              <DaisyCard className="notion-card">
                <DaisyCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <DaisyCardTitle className="text-sm font-medium">Avg Effectiveness</DaisyCardTitle>
                  <Zap className="h-4 w-4 text-green-500" />
                
                <DaisyCardBody>
                  <div className="text-2xl font-bold text-green-600">{Math.round(stats.avgEffectiveness)}%</div>
                  <DaisyProgress value={stats.avgEffectiveness} className="w-full mt-2" />
                </DaisyCardBody>
              </DaisyCard>

              <DaisyCard className="notion-card">
                <DaisyCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <DaisyCardTitle className="text-sm font-medium">Avg Maturity</DaisyCardTitle>
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                
                <DaisyCardBody>
                  <div className="text-2xl font-bold text-blue-600">{stats.avgMaturity.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">
                    Out of 5 levels
                  </p>
                </DaisyCardBody>
              </DaisyCard>

              <DaisyCard className="notion-card">
                <DaisyCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <DaisyCardTitle className="text-sm font-medium">Tests Due</DaisyCardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                
                <DaisyCardBody>
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.byTestingStatus.scheduled || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Scheduled for testing
                  </p>
                </DaisyCardBody>
              </DaisyCard>
            </div>

            {/* Framework Distribution */}
            <DaisyCard className="notion-card">
              <DaisyCardHeader>
                <DaisyCardTitle>Framework Distribution</DaisyCardTitle>
              
              <DaisyCardBody>
                <div className="space-y-3">
                  {Object.entries(stats.byFramework).map(([framework, count]) => (
                    <div key={framework} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DaisyBadge className={getFrameworkColor(framework)}>
                          {framework}
                        </DaisyBadge>
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
              </DaisyCardBody>
            </DaisyCard>
          </DaisyTabsContent>

          {/* Controls Tab */}
          <DaisyTabsContent value="controls" className="space-y-6">
            <DaisyCard className="notion-card">
              <DaisyCardBody className="p-0">
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
                          <DaisyCheckbox
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
                                <DaisyBadge className={getFrameworkColor(control.framework.category)}>
                                  {control.framework.category}
                                </DaisyBadge>
                                <DaisyBadge className={getMaturityColor(control.maturityLevel)}>
                                  Level {control.maturityLevel}
                                </DaisyBadge>
                                <DaisyBadge className={getStatusColor(control.testingStatus)}>
                                  {control.testingStatus.replace('_', ' ')}
                                </DaisyBadge>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {control.owner}
                                </span>
                                <span className="flex items-center gap-1">
                                  <DaisyCalendar className="w-4 h-4" />
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
                                
                                <DaisyDropdownMenu>
                                  <DaisyDropdownMenuTrigger asChild>
                                    <DaisyButton variant="ghost" size="sm">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </DaisyButton>
                                  </DaisyDropdownMenuTrigger>
                                  <DaisyDropdownMenuContent align="end">
                                    <DaisyDropdownMenuItem onClick={() => {
                                      setSelectedControl(control);
                                      setShowControlDetail(true);
                                    }}>
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Details
                                    </DaisyDropdownMenuItem>
                                    <DaisyDropdownMenuItem>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit Control
                                    </DaisyDropdownMenuItem>
                                    <DaisyDropdownMenuItem onClick={() => handleAIAnalysis(control)}>
                                      <Brain className="w-4 h-4 mr-2" />
                                      AI Assessment
                                    </DaisyDropdownMenuItem>
                                    <DaisyDropdownMenuItem>
                                      <TestTube className="w-4 h-4 mr-2" />
                                      Schedule Test
                                    </DaisyDropdownMenuItem>
                                  </DaisyDropdownMenuContent>
                                </DaisyDropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </DaisyCardBody>
            </DaisyCard>
          </DaisyTabsContent>

          {/* Other tabs would be implemented here... */}
          <DaisyTabsContent value="testing" className="space-y-6">
            <DaisyCard className="notion-card">
              <DaisyCardHeader>
                <DaisyCardTitle>Control Testing Dashboard</DaisyCardTitle>
              
              <DaisyCardBody className="text-center py-8">
                <TestTube className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Testing Workflows</h3>
                <p className="text-muted-foreground">
                  Advanced testing workflows with automated scheduling will be available here.
                </p>
              </DaisyCardBody>
            </DaisyCard>
          </DaisyTabsContent>
        </DaisyTabs>

        {/* Control Detail Modal */}
        <DaisyDialog open={showControlDetail} onOpenChange={setShowControlDetail}>
          <DaisyDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DaisyDialogHeader>
              <DaisyDialogTitle className="flex items-center justify-between">
                <span>{selectedControl?.title}</span>
                <DaisyBadge className={selectedControl ? getFrameworkColor(selectedControl.framework.category) : ''}>
                  {selectedControl?.framework.category}
                </DaisyBadge>
              </DaisyDialogTitle>
            </DaisyDialogHeader>
            
            {selectedControl && (
              <div className="space-y-6">
                {/* Control Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DaisyCard className="notion-card-minimal">
                    <DaisyCardBody className="p-4 text-center">
                      <div className="text-2xl font-bold">{selectedControl.effectivenessScore}%</div>
                      <div className="text-sm text-muted-foreground">Effectiveness</div>
                    </DaisyCardBody>
                  </DaisyCard>
                  <DaisyCard className="notion-card-minimal">
                    <DaisyCardBody className="p-4 text-center">
                      <div className="text-2xl font-bold">{selectedControl.maturityLevel}</div>
                      <div className="text-sm text-muted-foreground">Maturity Level</div>
                    </DaisyCardBody>
                  </DaisyCard>
                  <DaisyCard className="notion-card-minimal">
                    <DaisyCardBody className="p-4 text-center">
                      <div className="text-2xl font-bold">{selectedControl.mappedRisks.length}</div>
                      <div className="text-sm text-muted-foreground">Mapped Risks</div>
                    </DaisyCardBody>
                  </DaisyCard>
                </div>

                {/* Framework Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Framework Details</h3>
                  <DaisyCard className="notion-card-minimal">
                    <DaisyCardBody className="p-4">
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
                    </DaisyCardBody>
                  </DaisyCard>
                </div>

                {/* AI Assessment */}
                {selectedControl.aiAssessment && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">AI Assessment</h3>
                    <DaisyCard className="notion-card-minimal">
                      <DaisyCardBody className="p-4">
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
                      </DaisyCardBody>
                    </DaisyCard>
                  </div>
                )}
              </div>
            )}
          </DaisyDialogContent>
        </DaisyDialog>

        {/* Loading overlay */}
        {(isLoading || aiAnalyzing) && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <DaisyCard className="notion-card">
              <DaisyCardBody className="p-6 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-lg font-medium">
                  {aiAnalyzing ? 'Running AI Assessment...' : 'Processing...'}
                </p>
              </DaisyCardBody>
            </DaisyCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedControlRegistry; 