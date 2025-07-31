'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisySwitch } from '@/components/ui/DaisySwitch';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { DaisyAlert } from '@/components/ui/DaisyAlert';
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
      case 'date': return <DaisyCalendar className="w-4 h-4" />;
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
          <DaisyButton variant="ghost" size="sm" onClick={() => setShowQuestionEditor(false)} />
            <X className="w-4 h-4" />
          </DaisyCalendar>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Question Text */}
        <div className="space-y-2">
          <DaisyLabel htmlFor="question-text">Question Text</DaisyLabel>
          <DaisyTextarea
            id="question-text"
            value={questionForm.text}
            onChange={(e) => setQuestionForm(prev => ({ ...prev, text: e.target.value }))}
            placeholder="Enter your question..."
            rows={3}
          />
        </div>

        {/* Question Type */}
        <div className="space-y-2">
          <DaisyLabel htmlFor="question-type">Question Type</DaisyTextarea>
          <DaisySelect 
            value={questionForm.type} 
            onValueChange={(value) => setQuestionForm(prev => ({ ...prev, type: value as QuestionType }))}
          >
            <DaisySelectTrigger />
              <DaisySelectValue /></DaisySelect>
            <DaisySelectContent />
              <DaisySelectItem value="text">Text Input</DaisySelectContent>
              <DaisySelectItem value="textarea">Long Text</DaisySelectItem>
              <DaisySelectItem value="number">Number</DaisySelectItem>
              <DaisySelectItem value="single_choice">Single Choice</DaisySelectItem>
              <DaisySelectItem value="multiple_choice">Multiple Choice</DaisySelectItem>
              <DaisySelectItem value="scale">Scale/Rating</DaisySelectItem>
              <DaisySelectItem value="boolean">Yes/No</DaisySelectItem>
              <DaisySelectItem value="date">Date</DaisySelectItem>
              <DaisySelectItem value="file_upload">File Upload</DaisySelectItem>
            </DaisySelectContent>
          </DaisySelect>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <DaisyLabel htmlFor="question-description">Description (Optional)</DaisyLabel>
          <DaisyTextarea
            id="question-description"
            value={questionForm.description}
            onChange={(e) => setQuestionForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Provide additional context or instructions..."
            rows={2}
          />
        </div>

        {/* Required Toggle */}
        <div className="flex items-center justify-between">
          <DaisyLabel htmlFor="question-required">Required Question</DaisyTextarea>
          <DaisySwitch
            id="question-required"
            checked={questionForm.required}
            onCheckedChange={(checked) => setQuestionForm(prev => ({ ...prev, required: checked }))}
          />
        </div>

        {/* Question-specific Configuration */}
        {questionForm.type === 'single_choice' || questionForm.type === 'multiple_choice' ? (
          <div className="space-y-2">
            <DaisyLabel>Answer Options</DaisySwitch>
            <div className="space-y-2">
              {(questionForm.config.options || []).map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <DaisyInput
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
                  <DaisyButton
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
                  </DaisyInput>
                </div>
              ))}
              <DaisyButton
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
              </DaisyButton>
            </div>
          </div>
        ) : null}

        {questionForm.type === 'scale' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <DaisyLabel>Min Value</DaisyLabel>
                <DaisyInput
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
                <DaisyLabel>Max Value</DaisyInput>
                <DaisyInput
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
                <DaisyLabel>Step</DaisyInput>
                <DaisyInput
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
          <DaisyButton onClick={saveQuestionForm} className="w-full" >
  <Save className="w-4 h-4 mr-2" />
</DaisyInput>
            Save Question
          </DaisyButton>
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
              <DaisyBadge className="bg-secondary/20 text-foreground border-border" >
  <Brain className="w-3 h-3 mr-1" />
</DaisyBadge>
                AI Enhanced
              </DaisyBadge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <DaisyButton variant="ghost" onClick={() => setIsPreviewMode(!isPreviewMode)} />
              <Eye className="w-4 h-4 mr-2" />
              {isPreviewMode ? 'Edit' : 'Preview'}
            </DaisyButton>
            <DaisyButton variant="outline" onClick={onCancel} >
  Cancel
</DaisyButton>
            </DaisyButton>
            <DaisyButton onClick={handleSave} >
  <Save className="w-4 h-4 mr-2" />
</DaisyButton>
              Save
            </DaisyButton>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <main className="flex-1 p-6">
          <DaisyTabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" />
            <DaisyTabsList />
              <DaisyTabsTrigger value="builder">Builder</DaisyTabs>
              <DaisyTabsTrigger value="settings">Settings</DaisyTabsTrigger>
              <DaisyTabsTrigger value="ai">AI Configuration</DaisyTabsTrigger>
              <DaisyTabsTrigger value="preview">Preview</DaisyTabsTrigger>
            </DaisyTabsList>

            <DaisyTabsContent value="builder" className="space-y-6" />
              {/* Questionnaire Header */}
              <DaisyCard >
  <DaisyCardHeader />
</DaisyTabsContent>
                  <DaisyCardTitle>Questionnaire Details</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent className="space-y-4" >
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
</DaisyCardContent>
                    <div>
                      <DaisyLabel htmlFor="title">Title</DaisyLabel>
                      <DaisyInput
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter questionnaire title..."
                      />
                    </div>
                    <div>
                      <DaisyLabel htmlFor="category">Category</DaisyInput>
                      <DaisySelect value={category} onValueChange={(value) => setCategory(value as QuestionnaireCategory)} />
                        <DaisySelectTrigger />
                          <DaisySelectValue /></DaisySelect>
                        <DaisySelectContent />
                          <DaisySelectItem value="risk_assessment">Risk Assessment</DaisySelectContent>
                          <DaisySelectItem value="compliance_audit">Compliance Audit</DaisySelectItem>
                          <DaisySelectItem value="control_testing">Control Testing</DaisySelectItem>
                          <DaisySelectItem value="vendor_assessment">Vendor Assessment</DaisySelectItem>
                          <DaisySelectItem value="security_review">Security Review</DaisySelectItem>
                        </DaisySelectContent>
                      </DaisySelect>
                    </div>
                  </div>
                  <div>
                    <DaisyLabel htmlFor="description">Description</DaisyLabel>
                    <DaisyTextarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the purpose and scope of this questionnaire..."
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <DaisyLabel htmlFor="ai-enabled">Enable AI Features</DaisyTextarea>
                    <DaisySwitch
                      id="ai-enabled"
                      checked={aiEnabled}
                      onCheckedChange={setAiEnabled}
                    />
                  </div>
                </DaisySwitch>
              </DaisyCard>

              {/* Sections */}
              <DaisyCard >
  <DaisyCardHeader />
</DaisyCard>
                  <div className="flex items-center justify-between">
                    <DaisyCardTitle>Sections & Questions</DaisyCardTitle>
                    <DaisyButton onClick={addSection} >
  <Plus className="w-4 h-4 mr-2" />
</DaisyButton>
                      Add Section
                    </DaisyButton>
                  </div>
                
                <DaisyCardContent >
  {sections.length === 0 ? (
</DaisyCardContent>
                    <div className="text-center py-8">
                      <Layers className="w-12 h-12 text-notion-text-tertiary mx-auto mb-4" />
                      <p className="text-notion-text-secondary mb-4">
                        No sections yet. Add your first section to get started.
                      </p>
                      <DaisyButton onClick={addSection} >
  <Plus className="w-4 h-4 mr-2" />
</DaisyButton>
                        Add Section
                      </DaisyButton>
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
                                <DaisyInput
                                  value={section.title}
                                  onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                  className="font-medium"
                                  placeholder="Section title..."
                                />
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DaisyButton
                                variant="ghost"
                                size="sm"
                                onClick={() => addQuestion(section.id)} />
                                <Plus className="w-4 h-4" />
                              </DaisyInput>
                              <DaisyButton
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteSection(section.id)} />
                                <Trash2 className="w-4 h-4" />
                              </DaisyButton>
                            </div>
                          </div>

                          {/* Section Description */}
                          <DaisyTextarea
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
                                      <DaisyBadge variant="outline" className="text-xs bg-secondary/20 text-foreground">Required</DaisyTextarea>
                                    )}
                                    {question.aiGenerated && (
                                      <DaisyBadge variant="outline" className="text-xs bg-secondary/20 text-foreground" >
  <Brain className="w-3 h-3 mr-1" />
</DaisyBadge>
                                        AI
                                      </DaisyBadge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <DaisyButton
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
                                  </DaisyButton>
                                  <DaisyButton
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => duplicateQuestion(question.id)} />
                                    <Copy className="w-4 h-4" />
                                  </DaisyButton>
                                  <DaisyButton
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteQuestion(question.id)} />
                                    <Trash2 className="w-4 h-4" />
                                  </DaisyButton>
                                </div>
                              </motion.div>
                            ))}

                            {section.questions.length === 0 && (
                              <div className="text-center py-6 border-2 border-dashed border-notion-border rounded-lg">
                                <p className="text-notion-text-secondary mb-2">
                                  No questions in this section
                                </p>
                                <DaisyButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addQuestion(section.id)} />
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Question
                                </DaisyButton>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </DaisyCardContent>
              </DaisyCard>
            </DaisyTabsContent>

            <DaisyTabsContent value="settings" />
              <DaisyCard >
  <DaisyCardHeader />
</DaisyTabsContent>
                  <DaisyCardTitle>Questionnaire Settings</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <div className="space-y-6">
</DaisyCardContent>
                    <DaisyAlert >
  <Info className="w-4 h-4" />
</DaisyAlert>
                      <DaisyAlertDescription >
  Configure advanced settings for questionnaire behavior, validation, and user experience.
                </DaisyAlertDescription>
</DaisyAlert>
                </DaisyAlertDescription>
              </DaisyAlert>
                    
                    <div className="text-center py-8 text-notion-text-secondary">
                      <Settings className="w-12 h-12 mx-auto mb-4" />
                      <p>Advanced settings panel coming soon...</p>
                    </div>
                  </div>
                </DaisyCardContent>
              </DaisyCard>
            </DaisyTabsContent>

            <DaisyTabsContent value="ai" />
              <DaisyCard >
  <DaisyCardHeader />
</DaisyTabsContent>
                  <DaisyCardTitle>AI Configuration</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <div className="space-y-6">
</DaisyCardContent>
                    <DaisyAlert >
  <Brain className="w-4 h-4" />
</DaisyAlert>
                      <DaisyAlertDescription >
  Configure AI-powered features for intelligent question generation, response analysis, and risk assessment.
                </DaisyAlertDescription>
</DaisyAlert>
                </DaisyAlertDescription>
              </DaisyAlert>
                    
                    <div className="text-center py-8 text-notion-text-secondary">
                      <Brain className="w-12 h-12 mx-auto mb-4" />
                      <p>AI configuration panel coming soon...</p>
                    </div>
                  </div>
                </DaisyCardContent>
              </DaisyCard>
            </DaisyTabsContent>

            <DaisyTabsContent value="preview" />
              <DaisyCard >
  <DaisyCardHeader />
</DaisyTabsContent>
                  <DaisyCardTitle>Preview</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent >
  <div className="space-y-6">
</DaisyCardContent>
                    <DaisyAlert >
  <Eye className="w-4 h-4" />
</DaisyAlert>
                      <DaisyAlertDescription >
  Preview how your questionnaire will appear to respondents.
                </DaisyAlertDescription>
</DaisyAlert>
                </DaisyAlertDescription>
              </DaisyAlert>
                    
                    <div className="text-center py-8 text-notion-text-secondary">
                      <Eye className="w-12 h-12 mx-auto mb-4" />
                      <p>Preview mode coming soon...</p>
                    </div>
                  </div>
                </DaisyCardContent>
              </DaisyCard>
            </DaisyTabsContent>
          </DaisyTabs>
        </main>
      </div>

      {/* Question Editor Sidebar */}
      <AnimatePresence>
        {showQuestionEditor && <QuestionEditor />}
      </AnimatePresence>
    </div>
  );
} 