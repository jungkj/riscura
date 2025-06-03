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

// Components
import { QuestionnaireBuilder } from '@/components/questionnaires/QuestionnaireBuilder';
import { QuestionnaireList } from '@/components/questionnaires/QuestionnaireList';
// TODO: Create these components
// import { ResponseAnalytics } from '@/components/questionnaires/ResponseAnalytics';
// import { TemplateLibrary } from '@/components/questionnaires/TemplateLibrary';
// import { AIQuestionSuggestions } from '@/components/questionnaires/AIQuestionSuggestions';
// import { WorkflowManager } from '@/components/questionnaires/WorkflowManager';
// import { CollaborationPanel } from '@/components/questionnaires/CollaborationPanel';

// Icons
import {
  Plus, FileText, Brain, BarChart3, Settings, Users, Clock, Target,
  CheckCircle, AlertTriangle, Search, Filter, Download, Upload, Copy,
  Play, Pause, Edit, Eye, Trash2, Share, Archive, Star, Tag,
  TrendingUp, Activity, Shield, Zap, Globe
} from 'lucide-react';

// Types
import type { 
  Questionnaire, 
  QuestionnaireResponse, 
  QuestionnaireCategory,
  QuestionnaireStatus 
} from '@/types/questionnaire.types';

interface QuestionnairesPageProps {
  view?: 'list' | 'builder' | 'analytics' | 'templates';
}

export default function QuestionnairesPage({ view = 'list' }: QuestionnairesPageProps) {
  const router = useRouter();
  
  // State Management
  const [activeView, setActiveView] = useState<string>(view);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<QuestionnaireCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<QuestionnaireStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Data
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [responses, setResponses] = useState<QuestionnaireResponse[]>([]);
  const [analytics, setAnalytics] = useState({
    totalQuestionnaires: 0,
    activeResponses: 0,
    completionRate: 0,
    averageScore: 0,
    aiGeneratedQuestions: 0,
    riskAssessments: 0
  });

  // Initialize
  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      setIsLoading(true);
      
      // Load demo data
      const demoQuestionnaires: Questionnaire[] = [
        {
          id: 'q-001',
          title: 'Cybersecurity Risk Assessment',
          description: 'Comprehensive assessment of cybersecurity posture and risk exposure',
          category: 'risk_assessment',
          type: 'adaptive',
          version: '2.1',
          status: 'active',
          config: {
            allowPartialSave: true,
            requiresApproval: true,
            randomizeQuestions: false,
            showProgress: true,
            allowSkipping: false,
            requiredCompletion: 90,
            notificationSettings: {
              enabled: true,
              types: ['response_submitted', 'review_required'],
              channels: ['email', 'in_app'],
              frequency: 'immediate',
              recipients: []
            },
            accessControl: {
              publicAccess: false,
              requiresAuthentication: true,
              allowedRoles: ['analyst', 'auditor'],
              allowedUsers: [],
              restrictions: []
            }
          },
          sections: [],
          scoring: {
            type: 'ai_enhanced',
            maxScore: 100,
            categories: [],
            aggregation: 'weighted_average',
            normalization: true
          },
          createdBy: 'admin',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-20'),
          publishedAt: new Date('2024-01-18'),
          analytics: {
            overview: {
              totalResponses: 42,
              completionRate: 87,
              averageScore: 78,
              averageTime: 35,
              lastUpdated: new Date()
            },
            completion: {
              started: 48,
              completed: 42,
              abandoned: 6,
              averageCompletionTime: 35,
              completionRateBySection: [],
              dropOffPoints: []
            },
            performance: {
              averageResponseTime: 2.3,
              questionDifficulty: [],
              userExperience: {
                satisfactionScore: 4.2,
                usabilityScore: 4.5,
                clarityScore: 4.1,
                feedbackCount: 15,
                commonComplaints: []
              },
              technicalMetrics: {
                loadTime: 1.2,
                errorRate: 0.01,
                crashRate: 0,
                deviceBreakdown: [],
                browserBreakdown: []
              }
            },
            responses: {
              patterns: [],
              distributions: [],
              correlations: [],
              outliers: []
            },
            trends: {
              timeSeriesData: [],
              trendDirection: 'improving',
              seasonality: [],
              forecasts: []
            }
          },
          aiSettings: {
            enabled: true,
            questionGeneration: {
              enabled: true,
              contextSources: [],
              generationRules: [],
              reviewRequired: true,
              maxQuestions: 50
            },
            responseAnalysis: {
              enabled: true,
              patterns: [],
              riskScoring: true,
              anomalyDetection: true,
              sentimentAnalysis: false
            },
            riskAssessment: {
              enabled: true,
              scoringModel: {
                type: 'weighted',
                weights: {},
                rules: [],
                mlModelId: undefined
              },
              riskCategories: [],
              thresholds: [],
              autoPopulate: true
            },
            followUpSuggestions: {
              enabled: true,
              triggerConditions: [],
              suggestionRules: [],
              maxSuggestions: 5
            }
          },
          permissions: {
            read: ['analyst', 'auditor', 'manager'],
            write: ['analyst', 'manager'],
            admin: ['manager'],
            respond: ['all_users'],
            review: ['manager', 'auditor'],
            approve: ['manager'],
            analytics: ['analyst', 'manager']
          }
        },
        {
          id: 'q-002',
          title: 'SOC 2 Compliance Audit',
          description: 'System and Organization Controls (SOC) 2 compliance assessment',
          category: 'compliance_audit',
          type: 'static',
          version: '1.0',
          status: 'published',
          config: {
            allowPartialSave: true,
            requiresApproval: true,
            randomizeQuestions: false,
            showProgress: true,
            allowSkipping: false,
            requiredCompletion: 100,
            notificationSettings: {
              enabled: true,
              types: ['response_submitted', 'review_required'],
              channels: ['email'],
              frequency: 'daily',
              recipients: []
            },
            accessControl: {
              publicAccess: false,
              requiresAuthentication: true,
              allowedRoles: ['auditor'],
              allowedUsers: [],
              restrictions: []
            }
          },
          sections: [],
          scoring: {
            type: 'weighted',
            maxScore: 100,
            categories: [],
            aggregation: 'sum',
            normalization: false
          },
          createdBy: 'auditor',
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-12'),
          publishedAt: new Date('2024-01-12'),
          analytics: {
            overview: {
              totalResponses: 12,
              completionRate: 92,
              averageScore: 85,
              averageTime: 120,
              lastUpdated: new Date()
            },
            completion: {
              started: 13,
              completed: 12,
              abandoned: 1,
              averageCompletionTime: 120,
              completionRateBySection: [],
              dropOffPoints: []
            },
            performance: {
              averageResponseTime: 5.2,
              questionDifficulty: [],
              userExperience: {
                satisfactionScore: 3.8,
                usabilityScore: 4.0,
                clarityScore: 4.3,
                feedbackCount: 8,
                commonComplaints: []
              },
              technicalMetrics: {
                loadTime: 1.8,
                errorRate: 0.02,
                crashRate: 0,
                deviceBreakdown: [],
                browserBreakdown: []
              }
            },
            responses: {
              patterns: [],
              distributions: [],
              correlations: [],
              outliers: []
            },
            trends: {
              timeSeriesData: [],
              trendDirection: 'stable',
              seasonality: [],
              forecasts: []
            }
          },
          aiSettings: {
            enabled: false,
            questionGeneration: {
              enabled: false,
              contextSources: [],
              generationRules: [],
              reviewRequired: true,
              maxQuestions: 0
            },
            responseAnalysis: {
              enabled: false,
              patterns: [],
              riskScoring: false,
              anomalyDetection: false,
              sentimentAnalysis: false
            },
            riskAssessment: {
              enabled: false,
              scoringModel: {
                type: 'weighted',
                weights: {},
                rules: []
              },
              riskCategories: [],
              thresholds: [],
              autoPopulate: false
            },
            followUpSuggestions: {
              enabled: false,
              triggerConditions: [],
              suggestionRules: [],
              maxSuggestions: 0
            }
          },
          permissions: {
            read: ['auditor'],
            write: ['auditor'],
            admin: ['auditor'],
            respond: ['all_users'],
            review: ['auditor'],
            approve: ['auditor'],
            analytics: ['auditor']
          }
        },
        {
          id: 'q-003',
          title: 'Vendor Risk Assessment',
          description: 'Third-party vendor risk evaluation and due diligence',
          category: 'vendor_assessment',
          type: 'branching',
          version: '1.5',
          status: 'draft',
          config: {
            allowPartialSave: true,
            requiresApproval: false,
            randomizeQuestions: false,
            showProgress: true,
            allowSkipping: true,
            requiredCompletion: 80,
            notificationSettings: {
              enabled: true,
              types: ['response_submitted'],
              channels: ['email', 'in_app'],
              frequency: 'weekly',
              recipients: []
            },
            accessControl: {
              publicAccess: false,
              requiresAuthentication: true,
              allowedRoles: ['analyst', 'procurement'],
              allowedUsers: [],
              restrictions: []
            }
          },
          sections: [],
          scoring: {
            type: 'matrix',
            maxScore: 100,
            categories: [],
            aggregation: 'weighted_average',
            normalization: true
          },
          createdBy: 'analyst',
          createdAt: new Date('2024-01-22'),
          updatedAt: new Date('2024-01-25'),
          analytics: {
            overview: {
              totalResponses: 0,
              completionRate: 0,
              averageScore: 0,
              averageTime: 0,
              lastUpdated: new Date()
            },
            completion: {
              started: 0,
              completed: 0,
              abandoned: 0,
              averageCompletionTime: 0,
              completionRateBySection: [],
              dropOffPoints: []
            },
            performance: {
              averageResponseTime: 0,
              questionDifficulty: [],
              userExperience: {
                satisfactionScore: 0,
                usabilityScore: 0,
                clarityScore: 0,
                feedbackCount: 0,
                commonComplaints: []
              },
              technicalMetrics: {
                loadTime: 0,
                errorRate: 0,
                crashRate: 0,
                deviceBreakdown: [],
                browserBreakdown: []
              }
            },
            responses: {
              patterns: [],
              distributions: [],
              correlations: [],
              outliers: []
            },
            trends: {
              timeSeriesData: [],
              trendDirection: 'stable',
              seasonality: [],
              forecasts: []
            }
          },
          aiSettings: {
            enabled: true,
            questionGeneration: {
              enabled: true,
              contextSources: [],
              generationRules: [],
              reviewRequired: false,
              maxQuestions: 30
            },
            responseAnalysis: {
              enabled: true,
              patterns: [],
              riskScoring: true,
              anomalyDetection: false,
              sentimentAnalysis: true
            },
            riskAssessment: {
              enabled: true,
              scoringModel: {
                type: 'ml_model',
                weights: {},
                rules: [],
                mlModelId: 'vendor-risk-v2'
              },
              riskCategories: [],
              thresholds: [],
              autoPopulate: true
            },
            followUpSuggestions: {
              enabled: true,
              triggerConditions: [],
              suggestionRules: [],
              maxSuggestions: 3
            }
          },
          permissions: {
            read: ['analyst', 'procurement', 'manager'],
            write: ['analyst', 'procurement'],
            admin: ['manager'],
            respond: ['vendor_contacts'],
            review: ['manager'],
            approve: ['manager'],
            analytics: ['analyst', 'manager']
          }
        }
      ];

      setQuestionnaires(demoQuestionnaires);
      
      // Calculate analytics
      const totalResponses = demoQuestionnaires.reduce(
        (sum, q) => sum + q.analytics.overview.totalResponses, 0
      );
      const avgCompletion = demoQuestionnaires.reduce(
        (sum, q) => sum + q.analytics.overview.completionRate, 0
      ) / demoQuestionnaires.length;
      const avgScore = demoQuestionnaires.reduce(
        (sum, q) => sum + q.analytics.overview.averageScore, 0
      ) / demoQuestionnaires.length;
      const aiEnabled = demoQuestionnaires.filter(q => q.aiSettings.enabled).length;

      setAnalytics({
        totalQuestionnaires: demoQuestionnaires.length,
        activeResponses: totalResponses,
        completionRate: Math.round(avgCompletion),
        averageScore: Math.round(avgScore),
        aiGeneratedQuestions: aiEnabled * 15, // Estimate
        riskAssessments: demoQuestionnaires.filter(q => 
          q.aiSettings.riskAssessment.enabled
        ).length
      });

      setIsLoading(false);
      
      toast({
        title: 'Questionnaires Loaded',
        description: `${demoQuestionnaires.length} questionnaires ready with AI intelligence`,
      });
    } catch (error) {
      console.error('Failed to load questionnaires:', error);
      setIsLoading(false);
      toast({
        title: 'Loading Failed',
        description: 'Unable to load questionnaires. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Filtering
  const filteredQuestionnaires = questionnaires.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         q.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || q.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || q.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Actions
  const handleCreateQuestionnaire = () => {
    setActiveView('builder');
    setSelectedQuestionnaire(null);
  };

  const handleEditQuestionnaire = (questionnaire: Questionnaire) => {
    setSelectedQuestionnaire(questionnaire);
    setActiveView('builder');
  };

  const handleDuplicateQuestionnaire = async (questionnaire: Questionnaire) => {
    try {
      const duplicate: Questionnaire = {
        ...questionnaire,
        id: `${questionnaire.id}-copy`,
        title: `${questionnaire.title} (Copy)`,
        status: 'draft',
        version: '1.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: undefined,
        analytics: {
          ...questionnaire.analytics,
          overview: {
            ...questionnaire.analytics.overview,
            totalResponses: 0,
            completionRate: 0,
            averageScore: 0,
            lastUpdated: new Date()
          }
        }
      };

      setQuestionnaires(prev => [duplicate, ...prev]);
      
      toast({
        title: 'Questionnaire Duplicated',
        description: `"${duplicate.title}" created successfully`,
      });
    } catch (error) {
      toast({
        title: 'Duplication Failed',
        description: 'Unable to duplicate questionnaire',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteQuestionnaire = async (id: string) => {
    try {
      setQuestionnaires(prev => prev.filter(q => q.id !== id));
      
      toast({
        title: 'Questionnaire Deleted',
        description: 'Questionnaire removed successfully',
      });
    } catch (error) {
      toast({
        title: 'Deletion Failed',
        description: 'Unable to delete questionnaire',
        variant: 'destructive',
      });
    }
  };

  const handlePublishQuestionnaire = async (id: string) => {
    try {
      setQuestionnaires(prev => prev.map(q => 
        q.id === id 
          ? { ...q, status: 'published' as QuestionnaireStatus, publishedAt: new Date() }
          : q
      ));
      
      toast({
        title: 'Questionnaire Published',
        description: 'Questionnaire is now available for responses',
      });
    } catch (error) {
      toast({
        title: 'Publishing Failed',
        description: 'Unable to publish questionnaire',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto"
          />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Loading Intelligent Questionnaires
            </h2>
            <p className="text-muted-foreground">
              Initializing AI-powered assessment system...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border"
      >
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-notion-blue to-notion-purple rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-notion-text-primary">
                  Intelligent Questionnaires
                </h1>
                <p className="text-sm text-notion-text-secondary">
                  AI-powered risk assessments and compliance audits
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAIPanel(!showAIPanel)}
              className={showAIPanel ? "bg-notion-bg-secondary" : ""}
            >
              <Brain className="w-4 h-4 mr-2" />
              AI Assistant
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>

            <Button onClick={handleCreateQuestionnaire}>
              <Plus className="w-4 h-4 mr-2" />
              Create Questionnaire
            </Button>
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-notion-border bg-notion-bg-secondary px-6 py-4"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search questionnaires..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={(value) => 
                  setSelectedCategory(value as QuestionnaireCategory | 'all')
                }>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="risk_assessment">Risk Assessment</SelectItem>
                    <SelectItem value="compliance_audit">Compliance Audit</SelectItem>
                    <SelectItem value="control_testing">Control Testing</SelectItem>
                    <SelectItem value="vendor_assessment">Vendor Assessment</SelectItem>
                    <SelectItem value="security_review">Security Review</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={(value) =>
                  setSelectedStatus(value as QuestionnaireStatus | 'all')
                }>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="review">Under Review</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <div className="flex">
        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Analytics Overview */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6"
          >
            <Card className="border-notion-border bg-white dark:bg-notion-bg-secondary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-notion-text-secondary">Total Questionnaires</p>
                    <p className="text-2xl font-semibold text-notion-text-primary">
                      {analytics.totalQuestionnaires}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-notion-blue" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-notion-border bg-white dark:bg-notion-bg-secondary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-notion-text-secondary">Active Responses</p>
                    <p className="text-2xl font-semibold text-notion-text-primary">
                      {analytics.activeResponses}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-notion-border bg-white dark:bg-notion-bg-secondary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-notion-text-secondary">Completion Rate</p>
                    <p className="text-2xl font-semibold text-notion-text-primary">
                      {analytics.completionRate}%
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-notion-border bg-white dark:bg-notion-bg-secondary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-notion-text-secondary">Average Score</p>
                    <p className="text-2xl font-semibold text-notion-text-primary">
                      {analytics.averageScore}
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-notion-border bg-white dark:bg-notion-bg-secondary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-notion-text-secondary">AI Questions</p>
                    <p className="text-2xl font-semibold text-notion-text-primary">
                      {analytics.aiGeneratedQuestions}
                    </p>
                  </div>
                  <Brain className="w-8 h-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-notion-border bg-white dark:bg-notion-bg-secondary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-notion-text-secondary">Risk Assessments</p>
                    <p className="text-2xl font-semibold text-notion-text-primary">
                      {analytics.riskAssessments}
                    </p>
                  </div>
                  <Shield className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content Tabs */}
          <Tabs value={activeView} onValueChange={setActiveView} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="list">Questionnaires</TabsTrigger>
              <TabsTrigger value="builder">Builder</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-6">
              <QuestionnaireList
                questionnaires={filteredQuestionnaires}
                onEdit={handleEditQuestionnaire}
                onDuplicate={handleDuplicateQuestionnaire}
                onDelete={handleDeleteQuestionnaire}
                onPublish={handlePublishQuestionnaire}
              />
            </TabsContent>

            <TabsContent value="builder" className="space-y-6">
              <QuestionnaireBuilder
                questionnaire={selectedQuestionnaire}
                onSave={(questionnaire) => {
                  if (selectedQuestionnaire) {
                    setQuestionnaires(prev => prev.map(q => 
                      q.id === questionnaire.id ? questionnaire : q
                    ));
                  } else {
                    setQuestionnaires(prev => [questionnaire, ...prev]);
                  }
                  setActiveView('list');
                }}
                onCancel={() => {
                  setActiveView('list');
                  setSelectedQuestionnaire(null);
                }}
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-notion-text-tertiary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-notion-text-primary mb-2">
                  Analytics Dashboard Coming Soon
                </h3>
                <p className="text-notion-text-secondary">
                  Advanced reporting and analytics features will be available here
                </p>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-notion-text-tertiary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-notion-text-primary mb-2">
                  Template Library Coming Soon
                </h3>
                <p className="text-notion-text-secondary">
                  Pre-built questionnaire templates will be available here
                </p>
              </div>
            </TabsContent>

            <TabsContent value="workflow" className="space-y-6">
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-notion-text-tertiary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-notion-text-primary mb-2">
                  Workflow Management Coming Soon
                </h3>
                <p className="text-notion-text-secondary">
                  Automated workflow features will be available here
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </main>

        {/* AI Panel */}
        <AnimatePresence>
          {showAIPanel && (
            <motion.aside
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-80 border-l border-notion-border bg-white dark:bg-notion-bg-secondary"
            >
              <div className="p-4 border-b border-notion-border">
                <h3 className="font-semibold text-notion-text-primary">AI Assistant</h3>
                <p className="text-sm text-notion-text-secondary">
                  Intelligent question suggestions and analysis
                </p>
              </div>
              
              <div className="p-4 text-center">
                <Brain className="w-16 h-16 text-notion-text-tertiary mx-auto mb-4" />
                <h4 className="font-semibold text-notion-text-primary mb-2">
                  AI Suggestions Coming Soon
                </h4>
                <p className="text-sm text-notion-text-secondary">
                  AI-powered question suggestions will be available here
                </p>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 