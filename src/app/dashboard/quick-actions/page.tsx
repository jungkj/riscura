'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import GuidedTour from '@/components/help/GuidedTour';

import {
  Shield,
  CheckCircle,
  AlertTriangle,
  FileText,
  Users,
  TrendingUp,
  ArrowRight,
  Plus,
  Search,
  Clock,
  Target,
  Brain,
  Zap,
  BookOpen,
  HelpCircle,
  Play,
  Filter,
  Star,
  History,
  Workflow,
  Settings,
  Upload,
  Download,
  Eye,
  Edit,
  Calendar,
  Bell,
  ChevronRight,
  Home,
  Lightbulb,
  CheckSquare,
  BarChart3,
  PieChart,
  Activity,
  Database,
  Globe,
  Lock,
  Unlock,
  RefreshCw,
  Send,
  Archive,
  Trash2,
  Copy,
  ExternalLink,
  Pause,
  RotateCcw,
  TrendingDown,
  Video,
  Minus
} from 'lucide-react';

import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { HighContrastToggle } from '@/components/ui/HighContrastToggle';

// Types
interface WorkflowAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  tags: string[];
  isNew?: boolean;
  isFavorite?: boolean;
  lastUsed?: Date;
  completionRate?: number;
}

interface WorkflowCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  actions: WorkflowAction[];
  estimatedTotalTime: string;
  completionStatus: 'not-started' | 'in-progress' | 'completed';
}

interface QuickStat {
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
}

export default function QuickActionsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [recentActions, setRecentActions] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showTour, setShowTour] = useState(false);

  // Load user preferences
  useEffect(() => {
    const savedFavorites = localStorage.getItem('riscura-favorite-actions');
    const savedRecent = localStorage.getItem('riscura-recent-actions');
    
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    if (savedRecent) {
      setRecentActions(JSON.parse(savedRecent));
    }
  }, []);

  // Quick stats for context
  const quickStats: QuickStat[] = [
    {
      label: 'Pending Actions',
      value: 7,
      change: '+2 from yesterday',
      trend: 'up',
      icon: Clock,
      color: '#F57C00'
    },
    {
      label: 'Active Workflows',
      value: 3,
      change: 'On track',
      trend: 'neutral',
      icon: Workflow,
      color: '#1976D2'
    },
    {
      label: 'Completion Rate',
      value: '94%',
      change: '+5% this week',
      trend: 'up',
      icon: Target,
      color: '#2E7D32'
    },
    {
      label: 'Time Saved',
      value: '2.5h',
      change: 'This week',
      trend: 'up',
      icon: Zap,
      color: '#512DA8'
    }
  ];

  // Workflow-based action categories
  const workflowCategories: WorkflowCategory[] = [
    {
      id: 'risk-assessment',
      title: 'Risk Assessment Workflow',
      description: 'Identify, assess, and manage organizational risks',
      icon: Shield,
      color: '#ef4444',
      estimatedTotalTime: '45-90 min',
      completionStatus: 'in-progress',
      actions: [
        {
          id: 'new-risk',
          title: 'New Risk Assessment',
          description: 'Document and assess a new risk with guided workflow',
          icon: Plus,
          href: '/dashboard/workflows/risk-assessment/new',
          estimatedTime: '15-20 min',
          difficulty: 'beginner',
          tags: ['risk', 'assessment', 'new'],
          isNew: true,
          completionRate: 85
        },
        {
          id: 'update-assessment',
          title: 'Update Risk Assessment',
          description: 'Review and update existing risk assessments',
          icon: Edit,
          href: '/dashboard/workflows/risk-assessment/update',
          estimatedTime: '10-15 min',
          difficulty: 'beginner',
          tags: ['risk', 'update', 'review'],
          completionRate: 92
        },
        {
          id: 'review-controls',
          title: 'Review Risk Controls',
          description: 'Evaluate effectiveness of current risk controls',
          icon: CheckSquare,
          href: '/dashboard/workflows/risk-assessment/controls',
          estimatedTime: '20-30 min',
          difficulty: 'intermediate',
          prerequisites: ['Risk assessment completed'],
          tags: ['controls', 'review', 'effectiveness'],
          completionRate: 78
        },
        {
          id: 'risk-report',
          title: 'Generate Risk Report',
          description: 'Create comprehensive risk assessment reports',
          icon: FileText,
          href: '/dashboard/workflows/risk-assessment/report',
          estimatedTime: '10-15 min',
          difficulty: 'beginner',
          tags: ['report', 'documentation', 'export'],
          completionRate: 96
        }
      ]
    },
    {
      id: 'compliance-management',
      title: 'Compliance Management',
      description: 'Ensure regulatory compliance and audit readiness',
      icon: CheckCircle,
      color: '#10b981',
      estimatedTotalTime: '60-120 min',
      completionStatus: 'not-started',
      actions: [
        {
          id: 'framework-check',
          title: 'Framework Compliance Check',
          description: 'Assess compliance against regulatory frameworks',
          icon: CheckCircle,
          href: '/dashboard/workflows/compliance-review/framework',
          estimatedTime: '25-35 min',
          difficulty: 'intermediate',
          tags: ['compliance', 'framework', 'assessment'],
          completionRate: 88
        },
        {
          id: 'gap-analysis',
          title: 'Compliance Gap Analysis',
          description: 'Identify gaps in current compliance posture',
          icon: Target,
          href: '/dashboard/workflows/compliance-review/gaps',
          estimatedTime: '30-45 min',
          difficulty: 'advanced',
          prerequisites: ['Framework assessment completed'],
          tags: ['gap-analysis', 'compliance', 'review'],
          completionRate: 73
        },
        {
          id: 'audit-prep',
          title: 'Audit Preparation',
          description: 'Prepare documentation and evidence for audits',
          icon: BookOpen,
          href: '/dashboard/workflows/compliance-review/audit-prep',
          estimatedTime: '45-60 min',
          difficulty: 'advanced',
          tags: ['audit', 'preparation', 'documentation'],
          completionRate: 82
        },
        {
          id: 'evidence-collection',
          title: 'Evidence Collection',
          description: 'Gather and organize compliance evidence',
          icon: Archive,
          href: '/dashboard/workflows/compliance-review/evidence',
          estimatedTime: '20-30 min',
          difficulty: 'intermediate',
          tags: ['evidence', 'collection', 'organization'],
          completionRate: 91
        }
      ]
    },
    {
      id: 'monitoring-reporting',
      title: 'Monitoring & Reporting',
      description: 'Track performance and generate insights',
      icon: BarChart3,
      color: '#3b82f6',
      estimatedTotalTime: '30-60 min',
      completionStatus: 'completed',
      actions: [
        {
          id: 'dashboard-review',
          title: 'Dashboard Review',
          description: 'Analyze key metrics and performance indicators',
          icon: PieChart,
          href: '/dashboard/analytics',
          estimatedTime: '10-15 min',
          difficulty: 'beginner',
          tags: ['dashboard', 'metrics', 'analysis'],
          completionRate: 95
        },
        {
          id: 'trend-analysis',
          title: 'Trend Analysis',
          description: 'Identify patterns and trends in risk data',
          icon: TrendingUp,
          href: '/dashboard/analytics/trends',
          estimatedTime: '15-25 min',
          difficulty: 'intermediate',
          tags: ['trends', 'analysis', 'patterns'],
          completionRate: 87
        },
        {
          id: 'custom-report',
          title: 'Custom Report Builder',
          description: 'Create tailored reports for stakeholders',
          icon: FileText,
          href: '/dashboard/reporting/custom',
          estimatedTime: '20-30 min',
          difficulty: 'intermediate',
          tags: ['reporting', 'custom', 'stakeholders'],
          completionRate: 79
        },
        {
          id: 'schedule-reports',
          title: 'Schedule Automated Reports',
          description: 'Set up recurring reports and notifications',
          icon: Calendar,
          href: '/dashboard/reporting/schedule',
          estimatedTime: '10-15 min',
          difficulty: 'beginner',
          tags: ['automation', 'scheduling', 'notifications'],
          completionRate: 93
        }
      ]
    },
    {
      id: 'ai-insights',
      title: 'AI-Powered Insights',
      description: 'Leverage artificial intelligence for risk intelligence',
      icon: Brain,
      color: '#8b5cf6',
      estimatedTotalTime: '20-40 min',
      completionStatus: 'in-progress',
      actions: [
        {
          id: 'ask-aria',
          title: 'Ask ARIA Assistant',
          description: 'Get AI-powered insights and recommendations',
          icon: Brain,
          href: '/dashboard/aria',
          estimatedTime: '5-10 min',
          difficulty: 'beginner',
          tags: ['ai', 'insights', 'recommendations'],
          isNew: true,
          completionRate: 89
        },
        {
          id: 'risk-prediction',
          title: 'Risk Prediction Analysis',
          description: 'Predict future risk scenarios using AI models',
          icon: Eye,
          href: '/dashboard/aria/predictions',
          estimatedTime: '15-20 min',
          difficulty: 'advanced',
          tags: ['prediction', 'ai', 'modeling'],
          completionRate: 76
        },
        {
          id: 'smart-recommendations',
          title: 'Smart Recommendations',
          description: 'Receive AI-generated control recommendations',
          icon: Lightbulb,
          href: '/dashboard/aria/recommendations',
          estimatedTime: '10-15 min',
          difficulty: 'intermediate',
          tags: ['recommendations', 'ai', 'controls'],
          completionRate: 84
        }
      ]
    },
    {
      id: 'data-management',
      title: 'Data Management',
      description: 'Import, export, and manage risk data',
      icon: Database,
      color: '#f59e0b',
      estimatedTotalTime: '25-50 min',
      completionStatus: 'not-started',
      actions: [
        {
          id: 'import-data',
          title: 'Import Risk Data',
          description: 'Upload and import risk data from external sources',
          icon: Upload,
          href: '/dashboard/data/import',
          estimatedTime: '15-25 min',
          difficulty: 'intermediate',
          tags: ['import', 'data', 'upload'],
          completionRate: 91
        },
        {
          id: 'export-data',
          title: 'Export Data & Reports',
          description: 'Export risk data and reports in various formats',
          icon: Download,
          href: '/dashboard/data/export',
          estimatedTime: '5-10 min',
          difficulty: 'beginner',
          tags: ['export', 'data', 'reports'],
          completionRate: 97
        },
        {
          id: 'data-validation',
          title: 'Data Quality Check',
          description: 'Validate and clean imported risk data',
          icon: CheckSquare,
          href: '/dashboard/data/validation',
          estimatedTime: '10-20 min',
          difficulty: 'intermediate',
          tags: ['validation', 'quality', 'cleaning'],
          completionRate: 83
        },
        {
          id: 'backup-restore',
          title: 'Backup & Restore',
          description: 'Manage data backups and restoration',
          icon: RefreshCw,
          href: '/dashboard/data/backup',
          estimatedTime: '5-15 min',
          difficulty: 'advanced',
          tags: ['backup', 'restore', 'management'],
          completionRate: 88
        }
      ]
    }
  ];

  // Filter actions based on search and category
  const filteredCategories = workflowCategories.map(category => ({
    ...category,
    actions: category.actions.filter(action => {
      const matchesSearch = searchQuery === '' || 
        action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || category.id === selectedCategory;
      const matchesFavorites = !showFavoritesOnly || favorites.includes(action.id);
      
      return matchesSearch && matchesCategory && matchesFavorites;
    })
  })).filter(category => category.actions.length > 0);

  // Handle action click
  const handleActionClick = (action: WorkflowAction) => {
    if (action.id === 'guided-tour') {
      setShowTour(true);
      return;
    }
    
    // Handle other actions
    if (action.href.startsWith('#')) {
      toast({
        title: "Feature Coming Soon",
        description: `${action.title} is currently under development.`,
      });
    } else {
      router.push(action.href);
    }
  };

  const handleTourComplete = () => {
    setShowTour(false);
    localStorage.setItem('hasSeenQuickActionsTour', 'true');
    toast({
      title: "Tour Complete!",
      description: "You're ready to start using quick actions effectively.",
    });
  };

  const handleTourSkip = () => {
    setShowTour(false);
    localStorage.setItem('hasSeenQuickActionsTour', 'true');
  };

  const startGuidedTour = () => {
    setShowTour(true);
  };

  // Toggle favorite
  const toggleFavorite = (actionId: string) => {
    const updatedFavorites = favorites.includes(actionId)
      ? favorites.filter(id => id !== actionId)
      : [...favorites, actionId];
    
    setFavorites(updatedFavorites);
    localStorage.setItem('riscura-favorite-actions', JSON.stringify(updatedFavorites));
    
    toast({
      title: favorites.includes(actionId) ? 'Removed from favorites' : 'Added to favorites',
      description: 'Your preferences have been saved.',
    });
  };

  // Get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Get completion status color
  const getCompletionStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in-progress': return 'text-blue-600';
      case 'not-started': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="px-8 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 font-inter">
            <Home className="w-4 h-4" />
            <ChevronRight className="w-3 h-3" />
            <span className="text-contrast-low">Dashboard</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-contrast-medium font-medium">Quick Actions</span>
          </div>

          {/* Main Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-contrast-medium font-inter mb-2">
                Quick Actions Hub
              </h1>
              <p className="text-contrast-low font-inter">
                Streamlined workflows to help you complete tasks efficiently and effectively.
              </p>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center gap-4">
              <HighContrastToggle variant="badge" size="sm" showLabel={false} />
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={startGuidedTour}
                      className="flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Getting Started
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Take a guided tour of the platform</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-8 py-8" role="main">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-contrast-low">{stat.label}</p>
                      <p className="text-2xl font-bold text-contrast-medium mt-1">{stat.value}</p>
                      <p className="text-xs text-contrast-low mt-1">{stat.change}</p>
                    </div>
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: stat.color + '20' }}
                    >
                      <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Search and Filters */}
        <Card className="bg-white border-gray-200 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search workflows, actions, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-50 border-gray-200 focus:border-interactive-primary focus:ring-interactive-primary/20 rounded-lg font-inter"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-4">
                <Button
                  variant={showFavoritesOnly ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className="flex items-center gap-2"
                >
                  <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                  Favorites Only
                </Button>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-inter focus:border-interactive-primary focus:ring-interactive-primary/20"
                >
                  <option value="all">All Categories</option>
                  {workflowCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workflow Categories */}
        <div className="space-y-8">
          <AnimatePresence>
            {filteredCategories.map((category, categoryIndex) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: categoryIndex * 0.1 }}
              >
                <Card className="bg-white border-gray-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: category.color + '20' }}
                        >
                          <category.icon className="w-6 h-6" style={{ color: category.color }} />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold text-contrast-medium font-inter">
                            {category.title}
                          </CardTitle>
                          <p className="text-contrast-low font-inter mt-1">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-contrast-low">{category.estimatedTotalTime}</span>
                        </div>
                        <StatusIndicator
                          status={category.completionStatus === 'completed' ? 'success' : 
                                 category.completionStatus === 'in-progress' ? 'in-progress' : 'neutral'}
                          label={category.completionStatus.replace('-', ' ')}
                          size="sm"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {category.actions.map((action, actionIndex) => (
                        <motion.div
                          key={action.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: (categoryIndex * 0.1) + (actionIndex * 0.05) }}
                          className="group"
                        >
                          <Card className="h-full bg-gray-50 border-gray-200 hover:shadow-md hover:border-interactive-primary/30 transition-all duration-200 cursor-pointer">
                            <CardContent className="p-4 h-full flex flex-col">
                              {/* Action Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div 
                                  className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
                                  style={{ backgroundColor: category.color + '20' }}
                                >
                                  <action.icon className="w-5 h-5" style={{ color: category.color }} />
                                </div>
                                <div className="flex items-center gap-1">
                                  {action.isNew && (
                                    <Badge className="bg-blue-100 text-blue-700 text-xs">New</Badge>
                                  )}
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFavorite(action.id);
                                          }}
                                          className="w-8 h-8 p-0"
                                        >
                                          <Star 
                                            className={`w-4 h-4 ${
                                              favorites.includes(action.id) 
                                                ? 'fill-yellow-400 text-yellow-400' 
                                                : 'text-gray-400'
                                            }`} 
                                          />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{favorites.includes(action.id) ? 'Remove from favorites' : 'Add to favorites'}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </div>

                              {/* Action Content */}
                              <div className="flex-1" onClick={() => handleActionClick(action)}>
                                <h4 className="font-semibold text-contrast-medium font-inter mb-2 group-hover:text-interactive-primary transition-colors">
                                  {action.title}
                                </h4>
                                <p className="text-sm text-contrast-low font-inter leading-relaxed mb-3">
                                  {action.description}
                                </p>

                                {/* Action Metadata */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-gray-400" />
                                      <span className="text-contrast-low">{action.estimatedTime}</span>
                                    </div>
                                    <Badge className={`text-xs ${getDifficultyColor(action.difficulty)}`}>
                                      {action.difficulty}
                                    </Badge>
                                  </div>

                                  {action.completionRate && (
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-contrast-low">Success Rate</span>
                                        <span className="text-contrast-medium font-medium">{action.completionRate}%</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div 
                                          className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                                          style={{ width: `${action.completionRate}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {action.prerequisites && (
                                    <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                                      <strong>Prerequisites:</strong> {action.prerequisites.join(', ')}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Action Footer */}
                              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                                <div className="flex flex-wrap gap-1">
                                  {action.tags.slice(0, 2).map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {action.tags.length > 2 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{action.tags.length - 2}
                                    </Badge>
                                  )}
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-interactive-primary group-hover:translate-x-1 transition-all" />
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* No Results */}
        {filteredCategories.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-contrast-medium mb-2">No actions found</h3>
            <p className="text-contrast-low mb-4">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setShowFavoritesOnly(false);
              }}
            >
              Clear Filters
            </Button>
          </motion.div>
        )}

        {/* Help Section */}
        <Card className="bg-blue-50 border-blue-200 mt-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-contrast-medium font-inter mb-2">
                  Need Help Getting Started?
                </h3>
                <p className="text-contrast-low font-inter mb-4">
                  Take our guided tour to learn how to use workflows effectively, or browse our help documentation for detailed instructions.
                </p>
                <div className="flex items-center gap-3">
                                      <Button
                      variant="primary"
                      size="sm"
                      onClick={startGuidedTour}
                      className="flex items-center gap-2"
                    >
                    <Play className="w-4 h-4" />
                    Start Guided Tour
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push('/dashboard/help')}
                    className="flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    View Documentation
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {showTour && (
        <GuidedTour
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      )}
    </div>
  );
} 