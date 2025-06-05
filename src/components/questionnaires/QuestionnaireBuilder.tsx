'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';

import {
  Plus, Trash2, GripVertical, Settings, Brain, Save, X, 
  FileText, Type, Hash, ToggleLeft, Calendar, Upload,
  List, Star, Gauge, CheckSquare, AlertCircle, Info,
  Eye, Code, Target, Zap, Layers, Move, Copy
} from 'lucide-react';

import type { 
  Questionnaire, 
  Question, 
  QuestionnaireSection,
  QuestionType,
  QuestionConfig,
  QuestionOption,
  ValidationRule,
  QuestionnaireCategory
} from '@/types/questionnaire.types';
import { generateId } from '@/lib/utils';

interface QuestionnaireBuilderProps {
  questionnaire: Questionnaire | null;
  onSave: (questionnaire: Questionnaire) => void;
  onCancel: () => void;
}

interface QuestionFormData {
  text: string;
  type: QuestionType;
  required: boolean;
  description?: string;
  config: QuestionConfig;
  validation?: ValidationRule[];
}

export function QuestionnaireBuilder({ 
  questionnaire, 
  onSave, 
  onCancel 
}: QuestionnaireBuilderProps) {
  // Form state
  const [title, setTitle] = useState(questionnaire?.title || '');
  const [description, setDescription] = useState(questionnaire?.description || '');
  const [category, setCategory] = useState<QuestionnaireCategory>(questionnaire?.category || 'risk_assessment');
  const [sections, setSections] = useState<QuestionnaireSection[]>(
    questionnaire?.sections || []
  );
  const [aiEnabled, setAiEnabled] = useState(questionnaire?.aiSettings.enabled || false);
  
  // UI state
  const [activeTab, setActiveTab] = useState('builder');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ type: 'section' | 'question'; id: string } | null>(null);

  // Question editor state
  const [questionForm, setQuestionForm] = useState<QuestionFormData>({
    text: '',
    type: 'text',
    required: false,
    description: '',
    config: {},
    validation: []
  });

  const getQuestionTypeIcon = (type: QuestionType) => {
    switch (type) {
      case 'text': return <Type className="w-4 h-4" />;
      case 'textarea': return <FileText className="w-4 h-4" />;
      case 'number': return <Hash className="w-4 h-4" />;
      case 'single_choice': return <CheckSquare className="w-4 h-4" />;
      case 'multiple_choice': return <List className="w-4 h-4" />;
      case 'scale': return <Gauge className="w-4 h-4" />;
      case 'boolean': return <ToggleLeft className="w-4 h-4" />;
      case 'date': return <Calendar className="w-4 h-4" />;
      case 'file_upload': return <Upload className="w-4 h-4" />;
      default: return <Type className="w-4 h-4" />;
    }
  };

  const addSection = () => {
    const newSection: QuestionnaireSection = {
      id: generateId('section'),
      title: 'New Section',
      description: '',
      order: sections.length,
      required: false,
      questions: []
    };
    setSections([...sections, newSection]);
    setSelectedSection(newSection.id);
  };

  const updateSection = (sectionId: string, updates: Partial<QuestionnaireSection>) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId ? { ...section, ...updates } : section
    ));
  };

  const deleteSection = (sectionId: string) => {
    setSections(prev => prev.filter(section => section.id !== sectionId));
    if (selectedSection === sectionId) {
      setSelectedSection(null);
    }
  };

  const addQuestion = (sectionId: string, questionData?: Partial<Question>) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const newQuestion: Question = {
      id: generateId('question'),
      sectionId,
      type: questionData?.type || 'text',
      text: questionData?.text || 'New Question',
      description: questionData?.description || '',
      required: questionData?.required || false,
      order: section.questions.length,
      config: questionData?.config || {},
      aiGenerated: false,
      tags: [],
      ...questionData
    };

    setSections(prev => prev.map(s => 
      s.id === sectionId 
        ? { ...s, questions: [...s.questions, newQuestion] }
        : s
    ));

    setSelectedQuestion(newQuestion.id);
    setQuestionForm({
      text: newQuestion.text,
      type: newQuestion.type,
      required: newQuestion.required,
      description: newQuestion.description,
      config: newQuestion.config,
      validation: newQuestion.validation
    });
    setShowQuestionEditor(true);
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setSections(prev => prev.map(section => ({
      ...section,
      questions: section.questions.map(question =>
        question.id === questionId ? { ...question, ...updates } : question
      )
    })));
  };

  const deleteQuestion = (questionId: string) => {
    setSections(prev => prev.map(section => ({
      ...section,
      questions: section.questions.filter(question => question.id !== questionId)
    })));
    if (selectedQuestion === questionId) {
      setSelectedQuestion(null);
      setShowQuestionEditor(false);
    }
  };

  const duplicateQuestion = (questionId: string) => {
    const question = sections
      .flatMap(s => s.questions)
      .find(q => q.id === questionId);
    
    if (question) {
      const duplicatedQuestion: Question = {
        ...question,
        id: generateId('question'),
        text: `${question.text} (Copy)`,
        order: question.order + 1
      };

      setSections(prev => prev.map(section => 
        section.id === question.sectionId
          ? { 
              ...section, 
              questions: [
                ...section.questions.slice(0, question.order + 1),
                duplicatedQuestion,
                ...section.questions.slice(question.order + 1)
              ]
            }
          : section
      ));
    }
  };

  const saveQuestionForm = () => {
    if (!selectedQuestion) return;

    updateQuestion(selectedQuestion, {
      text: questionForm.text,
      type: questionForm.type,
      required: questionForm.required,
      description: questionForm.description,
      config: questionForm.config,
      validation: questionForm.validation
    });

    setShowQuestionEditor(false);
    toast({
      title: 'Question Updated',
      description: 'Question settings have been saved successfully',
    });
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: 'Title Required',
        description: 'Please enter a questionnaire title',
        variant: 'destructive',
      });
      return;
    }

    const savedQuestionnaire: Questionnaire = {
      id: questionnaire?.id || generateId('questionnaire'),
      title,
      description,
      category: category as any,
      type: 'dynamic',
      version: questionnaire?.version || '1.0',
      status: questionnaire?.status || 'draft',
      config: questionnaire?.config || {
        allowPartialSave: true,
        requiresApproval: false,
        randomizeQuestions: false,
        showProgress: true,
        allowSkipping: false,
        requiredCompletion: 80,
        notificationSettings: {
          enabled: true,
          types: ['response_submitted'],
          channels: ['email'],
          frequency: 'immediate',
          recipients: []
        },
        accessControl: {
          publicAccess: false,
          requiresAuthentication: true,
          allowedRoles: [],
          allowedUsers: [],
          restrictions: []
        }
      },
      sections,
      scoring: questionnaire?.scoring || {
        type: aiEnabled ? 'ai_enhanced' : 'simple',
        maxScore: 100,
        categories: [],
        aggregation: 'weighted_average',
        normalization: true
      },
      createdBy: questionnaire?.createdBy || 'current-user',
      createdAt: questionnaire?.createdAt || new Date(),
      updatedAt: new Date(),
      analytics: questionnaire?.analytics || {
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
        enabled: aiEnabled,
        questionGeneration: {
          enabled: aiEnabled,
          contextSources: [],
          generationRules: [],
          reviewRequired: true,
          maxQuestions: 50
        },
        responseAnalysis: {
          enabled: aiEnabled,
          patterns: [],
          riskScoring: aiEnabled,
          anomalyDetection: aiEnabled,
          sentimentAnalysis: false
        },
        riskAssessment: {
          enabled: aiEnabled,
          scoringModel: {
            type: 'weighted',
            weights: {},
            rules: []
          },
          riskCategories: [],
          thresholds: [],
          autoPopulate: aiEnabled
        },
        followUpSuggestions: {
          enabled: aiEnabled,
          triggerConditions: [],
          suggestionRules: [],
          maxSuggestions: 5
        }
      },
      permissions: questionnaire?.permissions || {
        read: ['all_users'],
        write: ['admin'],
        admin: ['admin'],
        respond: ['all_users'],
        review: ['admin'],
        approve: ['admin'],
        analytics: ['admin']
      }
    };

    onSave(savedQuestionnaire);
  };

  const QuestionEditor = () => (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-notion-bg-secondary border-l border-notion-border shadow-lg z-50 overflow-y-auto"
    >
      <div className="p-4 border-b border-notion-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-notion-text-primary">Edit Question</h3>
          <Button variant="ghost" size="sm" onClick={() => setShowQuestionEditor(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Question Text */}
        <div className="space-y-2">
          <Label htmlFor="question-text">Question Text</Label>
          <Textarea
            id="question-text"
            value={questionForm.text}
            onChange={(e) => setQuestionForm(prev => ({ ...prev, text: e.target.value }))}
            placeholder="Enter your question..."
            rows={3}
          />
        </div>

        {/* Question Type */}
        <div className="space-y-2">
          <Label htmlFor="question-type">Question Type</Label>
          <Select 
            value={questionForm.type} 
            onValueChange={(value) => setQuestionForm(prev => ({ ...prev, type: value as QuestionType }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text Input</SelectItem>
              <SelectItem value="textarea">Long Text</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="single_choice">Single Choice</SelectItem>
              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
              <SelectItem value="scale">Scale/Rating</SelectItem>
              <SelectItem value="boolean">Yes/No</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="file_upload">File Upload</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="question-description">Description (Optional)</Label>
          <Textarea
            id="question-description"
            value={questionForm.description}
            onChange={(e) => setQuestionForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Provide additional context or instructions..."
            rows={2}
          />
        </div>

        {/* Required Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="question-required">Required Question</Label>
          <Switch
            id="question-required"
            checked={questionForm.required}
            onCheckedChange={(checked) => setQuestionForm(prev => ({ ...prev, required: checked }))}
          />
        </div>

        {/* Question-specific Configuration */}
        {questionForm.type === 'single_choice' || questionForm.type === 'multiple_choice' ? (
          <div className="space-y-2">
            <Label>Answer Options</Label>
            <div className="space-y-2">
              {(questionForm.config.options || []).map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={option.text}
                    onChange={(e) => {
                      const newOptions = [...(questionForm.config.options || [])];
                      newOptions[index] = { ...option, text: e.target.value };
                      setQuestionForm(prev => ({
                        ...prev,
                        config: { ...prev.config, options: newOptions }
                      }));
                    }}
                    placeholder={`Option ${index + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newOptions = (questionForm.config.options || []).filter((_, i) => i !== index);
                      setQuestionForm(prev => ({
                        ...prev,
                        config: { ...prev.config, options: newOptions }
                      }));
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newOption: QuestionOption = {
                    id: generateId('option'),
                    text: '',
                    value: '',
                    order: (questionForm.config.options || []).length
                  };
                  setQuestionForm(prev => ({
                    ...prev,
                    config: {
                      ...prev.config,
                      options: [...(prev.config.options || []), newOption]
                    }
                  }));
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            </div>
          </div>
        ) : null}

        {questionForm.type === 'scale' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Min Value</Label>
                <Input
                  type="number"
                  value={questionForm.config.scale?.min || 1}
                  onChange={(e) => setQuestionForm(prev => ({
                    ...prev,
                    config: {
                      ...prev.config,
                      scale: {
                        min: parseInt(e.target.value),
                        max: prev.config.scale?.max || 10,
                        step: prev.config.scale?.step || 1,
                        labels: prev.config.scale?.labels,
                        showLabels: prev.config.scale?.showLabels || false
                      }
                    }
                  }))}
                />
              </div>
              <div>
                <Label>Max Value</Label>
                <Input
                  type="number"
                  value={questionForm.config.scale?.max || 10}
                  onChange={(e) => setQuestionForm(prev => ({
                    ...prev,
                    config: {
                      ...prev.config,
                      scale: {
                        min: prev.config.scale?.min || 1,
                        max: parseInt(e.target.value),
                        step: prev.config.scale?.step || 1,
                        labels: prev.config.scale?.labels,
                        showLabels: prev.config.scale?.showLabels || false
                      }
                    }
                  }))}
                />
              </div>
              <div>
                <Label>Step</Label>
                <Input
                  type="number"
                  value={questionForm.config.scale?.step || 1}
                  onChange={(e) => setQuestionForm(prev => ({
                    ...prev,
                    config: {
                      ...prev.config,
                      scale: {
                        min: prev.config.scale?.min || 1,
                        max: prev.config.scale?.max || 10,
                        step: parseInt(e.target.value),
                        labels: prev.config.scale?.labels,
                        showLabels: prev.config.scale?.showLabels || false
                      }
                    }
                  }))}
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* Save Button */}
        <div className="pt-4 border-t border-notion-border">
          <Button onClick={saveQuestionForm} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Save Question
          </Button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-notion-bg-primary">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-notion-bg-primary/95 backdrop-blur-sm border-b border-notion-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-notion-text-primary">
              {questionnaire ? 'Edit Questionnaire' : 'Create Questionnaire'}
            </h1>
            {aiEnabled && (
              <Badge className="bg-secondary/20 text-foreground border-border">
                <Brain className="w-3 h-3 mr-1" />
                AI Enhanced
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" onClick={() => setIsPreviewMode(!isPreviewMode)}>
              <Eye className="w-4 h-4 mr-2" />
              {isPreviewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <main className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="builder">Builder</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="ai">AI Configuration</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="builder" className="space-y-6">
              {/* Questionnaire Header */}
              <Card>
                <CardHeader>
                  <CardTitle>Questionnaire Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter questionnaire title..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={category} onValueChange={(value) => setCategory(value as QuestionnaireCategory)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="risk_assessment">Risk Assessment</SelectItem>
                          <SelectItem value="compliance_audit">Compliance Audit</SelectItem>
                          <SelectItem value="control_testing">Control Testing</SelectItem>
                          <SelectItem value="vendor_assessment">Vendor Assessment</SelectItem>
                          <SelectItem value="security_review">Security Review</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the purpose and scope of this questionnaire..."
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ai-enabled">Enable AI Features</Label>
                    <Switch
                      id="ai-enabled"
                      checked={aiEnabled}
                      onCheckedChange={setAiEnabled}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Sections */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Sections & Questions</CardTitle>
                    <Button onClick={addSection}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Section
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {sections.length === 0 ? (
                    <div className="text-center py-8">
                      <Layers className="w-12 h-12 text-notion-text-tertiary mx-auto mb-4" />
                      <p className="text-notion-text-secondary mb-4">
                        No sections yet. Add your first section to get started.
                      </p>
                      <Button onClick={addSection}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Section
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sections.map((section, sectionIndex) => (
                        <motion.div
                          key={section.id}
                          layout
                          className="border border-notion-border rounded-lg p-4"
                        >
                          {/* Section Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <GripVertical className="w-4 h-4 text-notion-text-tertiary" />
                              <div className="flex-1">
                                <Input
                                  value={section.title}
                                  onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                  className="font-medium"
                                  placeholder="Section title..."
                                />
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addQuestion(section.id)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteSection(section.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Section Description */}
                          <Textarea
                            value={section.description || ''}
                            onChange={(e) => updateSection(section.id, { description: e.target.value })}
                            placeholder="Section description (optional)..."
                            className="mb-4"
                            rows={2}
                          />

                          {/* Questions */}
                          <div className="space-y-2">
                            {section.questions.map((question, questionIndex) => (
                              <motion.div
                                key={question.id}
                                layout
                                className="flex items-center space-x-3 p-3 bg-notion-bg-secondary rounded-lg hover:bg-notion-bg-tertiary transition-colors"
                              >
                                <GripVertical className="w-4 h-4 text-notion-text-tertiary" />
                                <div className="p-2 bg-white dark:bg-notion-bg-primary rounded">
                                  {getQuestionTypeIcon(question.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-notion-text-primary truncate">
                                    {question.text}
                                  </p>
                                  <div className="flex items-center space-x-2 text-xs text-notion-text-secondary">
                                    <span className="capitalize">{question.type.replace('_', ' ')}</span>
                                    {question.required && (
                                      <Badge variant="outline" className="text-xs bg-secondary/20 text-foreground">Required</Badge>
                                    )}
                                    {question.aiGenerated && (
                                      <Badge variant="outline" className="text-xs bg-secondary/20 text-foreground">
                                        <Brain className="w-3 h-3 mr-1" />
                                        AI
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedQuestion(question.id);
                                      setQuestionForm({
                                        text: question.text,
                                        type: question.type,
                                        required: question.required,
                                        description: question.description,
                                        config: question.config,
                                        validation: question.validation
                                      });
                                      setShowQuestionEditor(true);
                                    }}
                                  >
                                    <Settings className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => duplicateQuestion(question.id)}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteQuestion(question.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </motion.div>
                            ))}

                            {section.questions.length === 0 && (
                              <div className="text-center py-6 border-2 border-dashed border-notion-border rounded-lg">
                                <p className="text-notion-text-secondary mb-2">
                                  No questions in this section
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addQuestion(section.id)}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Question
                                </Button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Questionnaire Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <Alert>
                      <Info className="w-4 h-4" />
                      <AlertDescription>
                        Configure advanced settings for questionnaire behavior, validation, and user experience.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="text-center py-8 text-notion-text-secondary">
                      <Settings className="w-12 h-12 mx-auto mb-4" />
                      <p>Advanced settings panel coming soon...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai">
              <Card>
                <CardHeader>
                  <CardTitle>AI Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <Alert>
                      <Brain className="w-4 h-4" />
                      <AlertDescription>
                        Configure AI-powered features for intelligent question generation, response analysis, and risk assessment.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="text-center py-8 text-notion-text-secondary">
                      <Brain className="w-12 h-12 mx-auto mb-4" />
                      <p>AI configuration panel coming soon...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <Alert>
                      <Eye className="w-4 h-4" />
                      <AlertDescription>
                        Preview how your questionnaire will appear to respondents.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="text-center py-8 text-notion-text-secondary">
                      <Eye className="w-12 h-12 mx-auto mb-4" />
                      <p>Preview mode coming soon...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Question Editor Sidebar */}
      <AnimatePresence>
        {showQuestionEditor && <QuestionEditor />}
      </AnimatePresence>
    </div>
  );
} 