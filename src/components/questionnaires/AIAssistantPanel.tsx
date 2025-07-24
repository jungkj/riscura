'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisyScrollArea } from '@/components/ui/DaisyScrollArea';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisySeparator } from '@/components/ui/DaisySeparator';

import {
  Brain, Lightbulb, Target, TrendingUp, Shield, AlertTriangle,
  CheckCircle, Star, Zap, Search, Plus, RefreshCw, Send,
  MessageSquare, FileText, BarChart3, Settings, HelpCircle,
  Sparkles, Eye, ThumbsUp, ThumbsDown, Copy, Download,
  ArrowRight, ChevronRight, Info, Clock
} from 'lucide-react';

// Types for AI suggestions and insights
interface QuestionSuggestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'text' | 'rating' | 'boolean';
  category: 'security' | 'compliance' | 'risk' | 'operational';
  relevanceScore: number;
  reasoning: string;
  suggestedAnswers?: string[];
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

interface RiskRecommendation {
  id: string;
  title: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  category: 'cybersecurity' | 'compliance' | 'operational' | 'financial';
  impact: string;
  mitigation: string;
  priority: number;
  estimatedEffort: 'low' | 'medium' | 'high';
}

interface ResponseInsight {
  id: string;
  type: 'pattern' | 'anomaly' | 'trend' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  suggestedAction?: string;
  affectedQuestions: string[];
}

interface OptimizationSuggestion {
  id: string;
  type: 'structure' | 'content' | 'flow' | 'scoring';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  expectedImprovement: string;
  implementation: string;
}

interface ContextualHelp {
  id: string;
  topic: string;
  content: string;
  type: 'tip' | 'best_practice' | 'warning' | 'info';
  relevantFor: string[];
}

// Mock data for AI suggestions
const mockQuestionSuggestions: QuestionSuggestion[] = [
  {
    id: 'qs-001',
    question: 'How frequently are your cybersecurity policies reviewed and updated?',
    type: 'multiple_choice',
    category: 'security',
    relevanceScore: 95,
    reasoning: 'Policy maintenance is critical for cybersecurity maturity assessment',
    suggestedAnswers: ['Annually', 'Bi-annually', 'Quarterly', 'As needed', 'Never'],
    riskLevel: 'high'
  },
  {
    id: 'qs-002',
    question: 'What is your organization\'s incident response time SLA?',
    type: 'text',
    category: 'security',
    relevanceScore: 88,
    reasoning: 'Response time metrics are key indicators of security preparedness',
    riskLevel: 'critical'
  },
  {
    id: 'qs-003',
    question: 'Rate your confidence in your data backup and recovery procedures',
    type: 'rating',
    category: 'risk',
    relevanceScore: 82,
    reasoning: 'Business continuity depends on reliable backup procedures',
    riskLevel: 'high'
  }
];

const mockRiskRecommendations: RiskRecommendation[] = [
  {
    id: 'rr-001',
    title: 'Multi-Factor Authentication Gap',
    description: 'Several critical systems lack MFA implementation',
    riskLevel: 'high',
    category: 'cybersecurity',
    impact: 'Increased vulnerability to account takeover attacks',
    mitigation: 'Implement MFA across all critical systems within 30 days',
    priority: 1,
    estimatedEffort: 'medium'
  },
  {
    id: 'rr-002',
    title: 'Compliance Documentation Gaps',
    description: 'Missing documentation for SOC 2 Type II requirements',
    riskLevel: 'medium',
    category: 'compliance',
    impact: 'Potential audit findings and certification delays',
    mitigation: 'Complete documentation review and update process',
    priority: 2,
    estimatedEffort: 'high'
  },
  {
    id: 'rr-003',
    title: 'Vendor Risk Assessment Outdated',
    description: 'Critical vendor assessments are over 12 months old',
    riskLevel: 'medium',
    category: 'operational',
    impact: 'Unknown risk exposure from third-party services',
    mitigation: 'Conduct quarterly vendor risk assessments',
    priority: 3,
    estimatedEffort: 'medium'
  }
];

const mockResponseInsights: ResponseInsight[] = [
  {
    id: 'ri-001',
    type: 'pattern',
    title: 'Consistent Security Awareness Gaps',
    description: '78% of respondents indicate limited security training',
    confidence: 92,
    actionable: true,
    suggestedAction: 'Implement comprehensive security awareness program',
    affectedQuestions: ['Q1', 'Q3', 'Q7']
  },
  {
    id: 'ri-002',
    type: 'anomaly',
    title: 'Unusual Response Pattern Detected',
    description: 'Department A shows significantly different risk profile',
    confidence: 85,
    actionable: true,
    suggestedAction: 'Conduct targeted assessment for Department A',
    affectedQuestions: ['Q12', 'Q15', 'Q18']
  },
  {
    id: 'ri-003',
    type: 'trend',
    title: 'Improving Compliance Scores',
    description: 'Compliance scores increased 23% over last quarter',
    confidence: 96,
    actionable: false,
    affectedQuestions: ['Q4', 'Q8', 'Q11']
  }
];

const mockOptimizationSuggestions: OptimizationSuggestion[] = [
  {
    id: 'os-001',
    type: 'structure',
    title: 'Reduce Question Fatigue',
    description: 'Current questionnaire is too long, causing 23% abandonment rate',
    impact: 'high',
    effort: 'medium',
    expectedImprovement: '40% reduction in abandonment rate',
    implementation: 'Split into 3 shorter questionnaires with adaptive routing'
  },
  {
    id: 'os-002',
    type: 'scoring',
    title: 'Enhance Risk Scoring Algorithm',
    description: 'Current scoring doesn\'t account for industry-specific risks',
    impact: 'medium',
    effort: 'high',
    expectedImprovement: '25% more accurate risk assessments',
    implementation: 'Implement weighted scoring based on industry benchmarks'
  },
  {
    id: 'os-003',
    type: 'flow',
    title: 'Optimize Question Sequence',
    description: 'Reorder questions to improve logical flow and comprehension',
    impact: 'medium',
    effort: 'low',
    expectedImprovement: '15% faster completion time',
    implementation: 'Group related questions and use progressive disclosure'
  }
];

const mockContextualHelp: ContextualHelp[] = [
  {
    id: 'ch-001',
    topic: 'Question Design Best Practices',
    content: 'Use clear, specific language. Avoid jargon and technical terms unless necessary. Each question should address only one concept.',
    type: 'best_practice',
    relevantFor: ['builder', 'templates']
  },
  {
    id: 'ch-002',
    topic: 'Risk Assessment Scoring',
    content: 'Consider implementing weighted scoring where critical security controls have higher impact on overall risk score.',
    type: 'tip',
    relevantFor: ['builder', 'analytics']
  },
  {
    id: 'ch-003',
    topic: 'Response Rate Optimization',
    content: 'Keep questionnaires under 15 minutes. Use progress indicators and allow saving partial responses.',
    type: 'warning',
    relevantFor: ['builder', 'templates']
  }
];

interface AIAssistantPanelProps {
  className?: string;
  activeTab?: string;
  selectedQuestionnaire?: any;
  onApplySuggestion?: (suggestion: any) => void;
}

export function AIAssistantPanel({ 
  className, 
  activeTab = 'list',
  selectedQuestionnaire,
  onApplySuggestion 
}: AIAssistantPanelProps) {
  const [activeAITab, setActiveAITab] = useState('suggestions');
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate new suggestions or insights
      setIsGenerating(false);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const filteredSuggestions = useMemo(() => {
    return mockQuestionSuggestions.filter(suggestion => {
      const matchesSearch = suggestion.question.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || suggestion.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const getContextualHelp = (tab: string) => {
    return mockContextualHelp.filter(help => help.relevantFor.includes(tab));
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case 'pattern': return BarChart3;
      case 'anomaly': return AlertTriangle;
      case 'trend': return TrendingUp;
      case 'recommendation': return Lightbulb;
      default: return Info;
    }
  };

  const handleGenerateQuestions = async () => {
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  const handleApplySuggestion = (suggestion: any) => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
    }
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-notion-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-notion-text-primary flex items-center">
            <Brain className="w-4 h-4 mr-2 text-purple-600" />
            AI Assistant
          </h3>
          <DaisyButton
            variant="ghost"
            size="sm"
            onClick={handleGenerateQuestions}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
          </DaisyButton>
        </div>
        <p className="text-xs text-notion-text-secondary">
          Intelligent insights and recommendations
        </p>
      </div>

      {/* AI Tabs */}
      <DaisyTabs value={activeAITab} onValueChange={setActiveAITab} className="flex-1 flex flex-col">
        <div className="border-b border-notion-border">
          <DaisyTabsList className="grid w-full grid-cols-4 h-8">
            <DaisyTabsTrigger value="suggestions" className="text-xs">Suggest</DaisyTabsTrigger>
            <DaisyTabsTrigger value="insights" className="text-xs">Insights</DaisyTabsTrigger>
            <DaisyTabsTrigger value="optimize" className="text-xs">Optimize</DaisyTabsTrigger>
            <DaisyTabsTrigger value="help" className="text-xs">Help</DaisyTabsTrigger>
          </DaisyTabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Question Suggestions Tab */}
          <DaisyTabsContent value="suggestions" className="h-full m-0">
            <div className="p-3 space-y-3">
              {/* Search and Filters */}
              <div className="space-y-2">
                <DaisyInput
                  placeholder="Search suggestions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-xs"
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-8 text-xs rounded border border-notion-border bg-white dark:bg-notion-bg-primary"
                >
                  <option value="all">All Categories</option>
                  <option value="security">Security</option>
                  <option value="compliance">Compliance</option>
                  <option value="risk">Risk</option>
                  <option value="operational">Operational</option>
                </select>
              </div>

              <DaisySeparator />

              {/* Question Suggestions */}
              <DaisyScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {isGenerating && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
                    >
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                        <span className="text-xs text-purple-600 font-medium">
                          Generating AI suggestions...
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {filteredSuggestions.map((suggestion, index) => (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white dark:bg-notion-bg-tertiary border border-notion-border rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <DaisyBadge className={getRiskLevelColor(suggestion.riskLevel || 'medium')}>
                              {suggestion.riskLevel}
                            </DaisyBadge>
                            <DaisyBadge variant="outline" className="text-xs">
                              {suggestion.category}
                            </DaisyBadge>
                          </div>
                          <p className="text-xs font-medium text-notion-text-primary mb-1">
                            {suggestion.question}
                          </p>
                          <p className="text-xs text-notion-text-secondary">
                            {suggestion.reasoning}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <span className="text-xs text-notion-text-tertiary">
                            {suggestion.relevanceScore}%
                          </span>
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        </div>
                      </div>

                      {suggestion.suggestedAnswers && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-notion-text-secondary">Suggested answers:</p>
                          <div className="flex flex-wrap gap-1">
                            {suggestion.suggestedAnswers.slice(0, 3).map((answer, i) => (
                              <DaisyBadge key={i} variant="secondary" className="text-xs">
                                {answer}
                              </DaisyBadge>
                            ))}
                            {suggestion.suggestedAnswers.length > 3 && (
                              <DaisyBadge variant="secondary" className="text-xs">
                                +{suggestion.suggestedAnswers.length - 3} more
                              </DaisyBadge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-1">
                          <DaisyButton
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleApplySuggestion(suggestion)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add
                          </DaisyButton>
                          <DaisyButton variant="ghost" size="sm" className="h-6 px-2 text-xs">
                            <Copy className="w-3 h-3" />
                          </DaisyButton>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DaisyButton variant="ghost" size="sm" className="h-6 px-1">
                            <ThumbsUp className="w-3 h-3" />
                          </DaisyButton>
                          <DaisyButton variant="ghost" size="sm" className="h-6 px-1">
                            <ThumbsDown className="w-3 h-3" />
                          </DaisyButton>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </DaisyScrollArea>
            </div>
          </DaisyTabsContent>

          {/* Insights Tab */}
          <DaisyTabsContent value="insights" className="h-full m-0">
            <div className="p-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <DaisyCard className="p-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-notion-text-primary">87%</div>
                    <div className="text-xs text-notion-text-secondary">Response Rate</div>
                  </div>
                </DaisyCard>
                <DaisyCard className="p-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-notion-text-primary">4.2</div>
                    <div className="text-xs text-notion-text-secondary">Avg Risk Score</div>
                  </div>
                </DaisyCard>
              </div>

              <DaisySeparator />

              {/* Risk Recommendations */}
              <div>
                <h4 className="text-sm font-semibold text-notion-text-primary mb-2">Risk Recommendations</h4>
                <DaisyScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {mockRiskRecommendations.map((rec, index) => (
                      <motion.div
                        key={rec.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white dark:bg-notion-bg-tertiary border border-notion-border rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <DaisyBadge className={getRiskLevelColor(rec.riskLevel)}>
                                {rec.riskLevel}
                              </DaisyBadge>
                              <DaisyBadge variant="outline" className="text-xs">
                                {rec.category}
                              </DaisyBadge>
                            </div>
                            <h5 className="text-xs font-medium text-notion-text-primary">
                              {rec.title}
                            </h5>
                          </div>
                          <div className="text-xs text-notion-text-tertiary">
                            #{rec.priority}
                          </div>
                        </div>
                        <p className="text-xs text-notion-text-secondary mb-2">
                          {rec.description}
                        </p>
                        <div className="text-xs text-notion-text-secondary">
                          <span className="font-medium">Impact:</span> {rec.impact}
                        </div>
                        <div className="text-xs text-notion-text-secondary">
                          <span className="font-medium">Mitigation:</span> {rec.mitigation}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </DaisyScrollArea>
              </div>

              <DaisySeparator />

              {/* Response Insights */}
              <div>
                <h4 className="text-sm font-semibold text-notion-text-primary mb-2">Response Insights</h4>
                <DaisyScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {mockResponseInsights.map((insight, index) => {
                      const IconComponent = getInsightTypeIcon(insight.type);
                      return (
                        <motion.div
                          key={insight.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white dark:bg-notion-bg-tertiary border border-notion-border rounded-lg p-2"
                        >
                          <div className="flex items-start space-x-2">
                            <IconComponent className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <h5 className="text-xs font-medium text-notion-text-primary">
                                {insight.title}
                              </h5>
                              <p className="text-xs text-notion-text-secondary">
                                {insight.description}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <div className="flex items-center space-x-2">
                                  <DaisyProgress value={insight.confidence} className="w-12 h-1" />
                                  <span className="text-xs text-notion-text-tertiary">
                                    {insight.confidence}%
                                  </span>
                                </div>
                                {insight.actionable && (
                                  <DaisyButton variant="ghost" size="sm" className="h-5 px-1 text-xs">
                                    <ArrowRight className="w-3 h-3" />
                                  </DaisyButton>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </DaisyScrollArea>
              </div>
            </div>
          </DaisyTabsContent>

          {/* Optimization Tab */}
          <DaisyTabsContent value="optimize" className="h-full m-0">
            <div className="p-3 space-y-3">
              <h4 className="text-sm font-semibold text-notion-text-primary">Optimization Suggestions</h4>
              <DaisyScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {mockOptimizationSuggestions.map((suggestion, index) => (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white dark:bg-notion-bg-tertiary border border-notion-border rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <DaisyBadge variant="outline" className="text-xs">
                              {suggestion.type}
                            </DaisyBadge>
                            <DaisyBadge className={`text-xs ${
                              suggestion.impact === 'high' ? 'bg-green-100 text-green-800' :
                              suggestion.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {suggestion.impact} impact
                            </DaisyBadge>
                          </div>
                          <h5 className="text-xs font-medium text-notion-text-primary mb-1">
                            {suggestion.title}
                          </h5>
                          <p className="text-xs text-notion-text-secondary mb-2">
                            {suggestion.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-medium text-notion-text-secondary">Expected:</span>
                          <span className="text-notion-text-tertiary ml-1">{suggestion.expectedImprovement}</span>
                        </div>
                        <div>
                          <span className="font-medium text-notion-text-secondary">Implementation:</span>
                          <span className="text-notion-text-tertiary ml-1">{suggestion.implementation}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2">
                          <DaisyBadge variant="secondary" className="text-xs">
                            {suggestion.effort} effort
                          </DaisyBadge>
                        </div>
                        <DaisyButton variant="ghost" size="sm" className="h-6 px-2 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Apply
                        </DaisyButton>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </DaisyScrollArea>
            </div>
          </DaisyTabsContent>

          {/* Help Tab */}
          <DaisyTabsContent value="help" className="h-full m-0">
            <div className="p-3 space-y-3">
              <h4 className="text-sm font-semibold text-notion-text-primary">Contextual Help</h4>
              <DaisyScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {getContextualHelp(activeTab).map((help, index) => (
                    <motion.div
                      key={help.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white dark:bg-notion-bg-tertiary border border-notion-border rounded-lg p-3"
                    >
                      <div className="flex items-start space-x-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          help.type === 'tip' ? 'bg-blue-100 dark:bg-blue-900/20' :
                          help.type === 'warning' ? 'bg-orange-100 dark:bg-orange-900/20' :
                          help.type === 'best_practice' ? 'bg-green-100 dark:bg-green-900/20' :
                          'bg-gray-100 dark:bg-gray-900/20'
                        }`}>
                          {help.type === 'tip' && <Lightbulb className="w-3 h-3 text-blue-600" />}
                          {help.type === 'warning' && <DaisyAlertTriangle className="w-3 h-3 text-orange-600" />}
                          {help.type === 'best_practice' && <Star className="w-3 h-3 text-green-600" />}
                          {help.type === 'info' && <Info className="w-3 h-3 text-gray-600" />}
                        </div>
                        <div className="flex-1">
                          <h5 className="text-xs font-medium text-notion-text-primary mb-1">
                            {help.topic}
                          </h5>
                          <p className="text-xs text-notion-text-secondary">
                            {help.content}
                          </p>
                          <DaisyBadge variant="outline" className="text-xs mt-2">
                            {help.type}
                          </DaisyBadge>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Quick Actions */}
                  <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h5 className="text-xs font-medium text-notion-text-primary mb-2">Quick Actions</h5>
                    <div className="space-y-2">
                      <DaisyButton variant="ghost" size="sm" className="w-full justify-start h-7 text-xs">
                        <MessageSquare className="w-3 h-3 mr-2" />
                        Ask AI Assistant
                      </DaisyButton>
                      <DaisyButton variant="ghost" size="sm" className="w-full justify-start h-7 text-xs">
                        <FileText className="w-3 h-3 mr-2" />
                        View Documentation
                      </DaisyButton>
                      <DaisyButton variant="ghost" size="sm" className="w-full justify-start h-7 text-xs">
                        <Settings className="w-3 h-3 mr-2" />
                        AI Settings
                      </DaisyButton>
                    </div>
                  </div>
                </div>
              </DaisyScrollArea>
            </div>
          </DaisyTabsContent>
        </div>
      </DaisyTabs>
    </div>
  );
} 