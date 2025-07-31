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

// Components
import { EnhancedQuestionnaireBuilder } from '@/components/questionnaires/EnhancedQuestionnaireBuilder';
import { QuestionnaireList } from '@/components/questionnaires/QuestionnaireList';
import { EnhancedQuestionnaireList } from '@/components/questionnaires/EnhancedQuestionnaireList';
import CollaborativeQuestionnairePage from './CollaborativeQuestionnairePage';
import { WorkflowProgress } from '@/components/questionnaires/WorkflowProgress';
import { AnalyticsCards, AnalyticsCardsSkeleton } from '@/components/questionnaires/AnalyticsCards';
import { AnalyticsDashboard } from '@/components/questionnaires/AnalyticsDashboard';
import { TemplateLibrary } from '@/components/questionnaires/TemplateLibrary';
import { WorkflowManagement } from '@/components/questionnaires/WorkflowManagement';
import { AIAssistantPanel } from '@/components/questionnaires/AIAssistantPanel';
// TODO: Create these components
// import { ResponseAnalytics } from '@/components/questionnaires/ResponseAnalytics';
// import { CollaborationPanel } from '@/components/questionnaires/CollaborationPanel';

// Icons
import {
  Plus, FileText, Brain, BarChart3, Users, 
  Filter, Search, Eye, Star, 
  Activity
} from 'lucide-react';

// Types
import type { 
  Questionnaire, 
  QuestionnaireResponse, 
  QuestionnaireCategory,
  QuestionnaireStatus 
} from '@/types/questionnaire.types';

interface QuestionnairesPageProps {
  view?: 'list' | 'enhanced-search' | 'builder' | 'analytics' | 'templates' | 'collaboration';
}

export default function QuestionnairesPage({ view = 'list' }: QuestionnairesPageProps) {
  const router = useRouter();
  
  // State Management
  const [activeView, setActiveView] = useState<string>(view);
  const [questionnaireViewMode, setQuestionnaireViewMode] = useState<'grid' | 'list'>('grid');
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

  const handleWorkflowStepClick = (step: string) => {
    setActiveView(step);
    
    // Clear selected questionnaire when switching away from builder
    if (step !== 'builder') {
      setSelectedQuestionnaire(null);
    }
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
  };

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
              <div className="w-10 h-10 bg-gradient-to-br from-[#191919] to-[#191919] rounded-lg flex items-center justify-center">
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
            <DaisyButton
              variant="ghost"
              size="sm"
              onClick={() => setShowAIPanel(!showAIPanel)}
              className={showAIPanel ? "bg-notion-bg-secondary" : ""}
            >
              <Brain className="w-4 h-4 mr-2" />
              AI Assistant
            </DaisyButton>
            
            <DaisyButton
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </DaisyButton>

            <DaisyButton onClick={handleCreateQuestionnaire}>
              <Plus className="w-4 h-4 mr-2" />
              Create Questionnaire
            </DaisyButton>
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
                  <DaisyInput
                    placeholder="Search questionnaires..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                  />
                </div>
                
                <DaisySelect value={selectedCategory} onValueChange={(value) => 
                  setSelectedCategory(value as QuestionnaireCategory | 'all')
                }>
                  <DaisySelectTrigger className="w-48">
                    <DaisySelectValue placeholder="Category" />
                  </DaisySelectTrigger>
                  <DaisySelectContent>
                    <DaisySelectItem value="all">All Categories</DaisySelectItem>
                    <DaisySelectItem value="risk_assessment">Risk Assessment</DaisySelectItem>
                    <DaisySelectItem value="compliance_audit">Compliance Audit</DaisySelectItem>
                    <DaisySelectItem value="control_testing">Control Testing</DaisySelectItem>
                    <DaisySelectItem value="vendor_assessment">Vendor Assessment</DaisySelectItem>
                    <DaisySelectItem value="security_review">Security Review</DaisySelectItem>
                  </DaisySelectContent>
                </DaisySelect>

                <DaisySelect value={selectedStatus} onValueChange={(value) =>
                  setSelectedStatus(value as QuestionnaireStatus | 'all')
                }>
                  <DaisySelectTrigger className="w-48">
                    <DaisySelectValue placeholder="Status" />
                  </DaisySelectTrigger>
                  <DaisySelectContent>
                    <DaisySelectItem value="all">All Status</DaisySelectItem>
                    <DaisySelectItem value="draft">Draft</DaisySelectItem>
                    <DaisySelectItem value="review">Under Review</DaisySelectItem>
                    <DaisySelectItem value="published">Published</DaisySelectItem>
                    <DaisySelectItem value="active">Active</DaisySelectItem>
                    <DaisySelectItem value="archived">Archived</DaisySelectItem>
                  </DaisySelectContent>
                </DaisySelect>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <div className="flex">
        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Analytics Overview */}
          {isLoading ? (
            <AnalyticsCardsSkeleton className="mb-6" />
          ) : (
            <AnalyticsCards analytics={analytics} className="mb-6" />
          )}

          {/* Workflow Progress */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <WorkflowProgress 
              activeStep={activeView}
              onStepClick={handleWorkflowStepClick}
              className="bg-white dark:bg-notion-bg-secondary rounded-lg border border-notion-border shadow-sm"
            />
          </motion.div>

          {/* Main Content Tabs */}
          <DaisyTabs value={activeView} onValueChange={setActiveView} className="space-y-6">
            <DaisyTabsList className="grid w-full grid-cols-7">
              <DaisyTabsTrigger value="list">Questionnaires</DaisyTabsTrigger>
              <DaisyTabsTrigger value="enhanced-search">Advanced Search</DaisyTabsTrigger>
              <DaisyTabsTrigger value="builder">Builder</DaisyTabsTrigger>
              <DaisyTabsTrigger value="analytics">Analytics</DaisyTabsTrigger>
              <DaisyTabsTrigger value="templates">Templates</DaisyTabsTrigger>
              <DaisyTabsTrigger value="workflow">Workflow</DaisyTabsTrigger>
              <DaisyTabsTrigger value="collaboration">Collaboration</DaisyTabsTrigger>
            </DaisyTabsList>

            <DaisyTabsContent value="list" className="space-y-6">
              <QuestionnaireList
                questionnaires={filteredQuestionnaires}
                onEdit={handleEditQuestionnaire}
                onDuplicate={handleDuplicateQuestionnaire}
                onDelete={handleDeleteQuestionnaire}
                onPublish={handlePublishQuestionnaire}
                viewMode={questionnaireViewMode}
                onViewModeChange={setQuestionnaireViewMode}
              />
            </DaisyTabsContent>

            <DaisyTabsContent value="enhanced-search" className="space-y-6">
              <EnhancedQuestionnaireList />
            </DaisyTabsContent>

            <DaisyTabsContent value="builder" className="space-y-6">
              <EnhancedQuestionnaireBuilder
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
            </DaisyTabsContent>

            <DaisyTabsContent value="analytics" className="space-y-6">
              <AnalyticsDashboard />
            </DaisyTabsContent>

            <DaisyTabsContent value="templates" className="space-y-6">
              <TemplateLibrary />
            </DaisyTabsContent>

            <DaisyTabsContent value="workflow" className="space-y-6">
              <WorkflowManagement />
            </DaisyTabsContent>

            <DaisyTabsContent value="collaboration" className="space-y-6">
              <CollaborativeQuestionnairePage mode="collaborate" />
            </DaisyTabsContent>
          </DaisyTabs>
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
              <AIAssistantPanel 
                activeTab={activeView}
                selectedQuestionnaire={selectedQuestionnaire}
                onApplySuggestion={(suggestion) => {
                  // Handle applying AI suggestions
                  console.log('Applying suggestion:', suggestion);
                  // Could navigate to builder or update questionnaire
                }}
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 