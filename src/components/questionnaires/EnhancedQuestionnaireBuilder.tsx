'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import {
  Plus, Trash2, GripVertical, Settings, Brain, Save, X, 
  FileText, Type, Hash, ToggleLeft, Calendar, Upload,
  List, Star, Gauge, CheckSquare, AlertCircle, Info,
  Eye, Code, Target, Zap, Layers, Move, Copy, Download,
  Upload as UploadIcon, GitBranch, Filter, Share2,
  ChevronDown, ChevronRight, Edit3, RefreshCw, PlayCircle,
  MoreVertical, ArrowRight, ArrowDown, FileJson, 
  FileSpreadsheet, CheckCircle2, AlertTriangle,
  Grid3X3, MapPin, PenTool, Code2, Image
} from 'lucide-react';

import { 
  ADVANCED_QUESTION_TYPES,
  MatrixQuestionComponent,
  RankingQuestionComponent,
  ImageQuestionComponent,
  SignatureQuestionComponent,
  LocationQuestionComponent,
  CustomHTMLQuestionComponent,
  type MatrixQuestion,
  type RankingQuestion,
  type ImageQuestion,
  type SignatureQuestion,
  type LocationQuestion,
  type CustomHTMLQuestion
} from './AdvancedQuestionTypes';

// Enhanced types for advanced features
interface ConditionalRule {
  id: string;
  type: 'show_if' | 'hide_if' | 'require_if';
  sourceQuestionId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

interface BranchingLogic {
  id: string;
  sourceQuestionId: string;
  conditions: Array<{
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
    value: any;
    targetSectionId?: string;
    targetQuestionId?: string;
    action: 'jump_to_section' | 'jump_to_question' | 'end_questionnaire' | 'show_section' | 'hide_section';
  }>;
}

interface ValidationRule {
  id: string;
  type: 'required' | 'min_length' | 'max_length' | 'pattern' | 'range' | 'custom';
  value?: any;
  message: string;
  severity: 'error' | 'warning';
}

interface EnhancedQuestion {
  id: string;
  sectionId: string;
  type: string;
  text: string;
  description?: string;
  required: boolean;
  order: number;
  config: any;
  validation: ValidationRule[];
  conditionalRules: ConditionalRule[];
  branchingLogic?: BranchingLogic;
  aiGenerated: boolean;
  tags: string[];
  metadata?: {
    difficulty?: 'easy' | 'medium' | 'hard';
    estimatedTime?: number;
    category?: string;
    version?: string;
  };
}

interface EnhancedSection {
  id: string;
  title: string;
  description: string;
  order: number;
  required: boolean;
  questions: EnhancedQuestion[];
  conditionalRules: ConditionalRule[];
  metadata?: {
    estimatedTime?: number;
    category?: string;
  };
}

interface PreviewResponse {
  questionId: string;
  value: any;
  timestamp: Date;
}

interface EnhancedQuestionnaireBuilderProps {
  questionnaire?: any;
  onSave: (questionnaire: any) => void;
  onCancel: () => void;
}

export function EnhancedQuestionnaireBuilder({ 
  questionnaire, 
  onSave, 
  onCancel 
}: EnhancedQuestionnaireBuilderProps) {
  // Core form state
  const [title, setTitle] = useState(questionnaire?.title || '');
  const [description, setDescription] = useState(questionnaire?.description || '');
  const [category, setCategory] = useState(questionnaire?.category || 'risk_assessment');
  const [sections, setSections] = useState<EnhancedSection[]>(questionnaire?.sections || []);
  
  // UI state
  const [activeTab, setActiveTab] = useState('builder');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [showConditionalEditor, setShowConditionalEditor] = useState(false);
  const [showBranchingEditor, setShowBranchingEditor] = useState(false);
  const [showValidationEditor, setShowValidationEditor] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Preview state
  const [previewResponses, setPreviewResponses] = useState<PreviewResponse[]>([]);
  const [previewCurrentSection, setPreviewCurrentSection] = useState(0);

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<{
    type: 'section' | 'question';
    id: string;
    sourceIndex: number;
  } | null>(null);

  // Question form state
  const [questionForm, setQuestionForm] = useState<Partial<EnhancedQuestion>>({
    text: '',
    type: 'text',
    required: false,
    description: '',
    config: {},
    validation: [],
    conditionalRules: [],
    tags: []
  });

  // File input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate visible questions based on conditional rules and preview responses
  const getVisibleQuestions = useCallback((sectionId: string): EnhancedQuestion[] => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return [];

    if (!isPreviewMode) return section.questions;

    return section.questions.filter(question => {
      if (question.conditionalRules.length === 0) return true;

      return question.conditionalRules.every(rule => {
        const sourceResponse = previewResponses.find(r => r.questionId === rule.sourceQuestionId);
        if (!sourceResponse) return rule.type === 'hide_if';

        const { operator, value } = rule;
        const responseValue = sourceResponse.value;

        let conditionMet = false;
        switch (operator) {
          case 'equals':
            conditionMet = responseValue === value;
            break;
          case 'not_equals':
            conditionMet = responseValue !== value;
            break;
          case 'contains':
            conditionMet = Array.isArray(responseValue) 
              ? responseValue.includes(value)
              : String(responseValue).includes(value);
            break;
          case 'greater_than':
            conditionMet = Number(responseValue) > Number(value);
            break;
          case 'less_than':
            conditionMet = Number(responseValue) < Number(value);
            break;
          case 'in':
            conditionMet = Array.isArray(value) && value.includes(responseValue);
            break;
          case 'not_in':
            conditionMet = Array.isArray(value) && !value.includes(responseValue);
            break;
        }

        return rule.type === 'show_if' ? conditionMet : !conditionMet;
      });
    });
  }, [sections, previewResponses, isPreviewMode]);

  // Drag and drop handlers
  const handleDragStart = (type: 'section' | 'question', id: string, index: number) => {
    setDraggedItem({ type, id, sourceIndex: index });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleSectionReorder = (newSections: EnhancedSection[]) => {
    const reorderedSections = newSections.map((section, index) => ({
      ...section,
      order: index
    }));
    setSections(reorderedSections);
  };

  const handleQuestionReorder = (sectionId: string, newQuestions: EnhancedQuestion[]) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? {
            ...section,
            questions: newQuestions.map((question, index) => ({
              ...question,
              order: index
            }))
          }
        : section
    ));
  };

  // Question management
  const addQuestion = (sectionId: string, questionType: string = 'text') => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const newQuestion: EnhancedQuestion = {
      id: `question-${Date.now()}`,
      sectionId,
      type: questionType,
      text: 'New Question',
      description: '',
      required: false,
      order: section.questions.length,
      config: {},
      validation: [],
      conditionalRules: [],
      aiGenerated: false,
      tags: []
    };

    setSections(prev => prev.map(s => 
      s.id === sectionId 
        ? { ...s, questions: [...s.questions, newQuestion] }
        : s
    ));

    setSelectedQuestion(newQuestion.id);
    setQuestionForm(newQuestion);
    setShowQuestionEditor(true);
  };

  const duplicateQuestion = (questionId: string) => {
    const question = sections
      .flatMap(s => s.questions)
      .find(q => q.id === questionId);
    
    if (question) {
      const duplicatedQuestion: EnhancedQuestion = {
        ...question,
        id: `question-${Date.now()}`,
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
                ...section.questions.slice(question.order + 1).map(q => ({ ...q, order: q.order + 1 }))
              ]
            }
          : section
      ));
    }
  };

  const deleteQuestion = (questionId: string) => {
    setSections(prev => prev.map(section => ({
      ...section,
      questions: section.questions
        .filter(question => question.id !== questionId)
        .map((question, index) => ({ ...question, order: index }))
    })));
    
    if (selectedQuestion === questionId) {
      setSelectedQuestion(null);
      setShowQuestionEditor(false);
    }
  };

  // Section management
  const addSection = () => {
    const newSection: EnhancedSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      description: '',
      order: sections.length,
      required: false,
      questions: [],
      conditionalRules: []
    };
    setSections([...sections, newSection]);
    setSelectedSection(newSection.id);
  };

  const deleteSection = (sectionId: string) => {
    setSections(prev => prev
      .filter(section => section.id !== sectionId)
      .map((section, index) => ({ ...section, order: index }))
    );
    
    if (selectedSection === sectionId) {
      setSelectedSection(null);
    }
  };

  // Validation management
  const addValidationRule = (questionId: string, rule: Omit<ValidationRule, 'id'>) => {
    const newRule: ValidationRule = {
      id: `validation-${Date.now()}`,
      ...rule
    };

    setSections(prev => prev.map(section => ({
      ...section,
      questions: section.questions.map(question =>
        question.id === questionId
          ? { ...question, validation: [...question.validation, newRule] }
          : question
      )
    })));
  };

  // Conditional rules management
  const addConditionalRule = (questionId: string, rule: Omit<ConditionalRule, 'id'>) => {
    const newRule: ConditionalRule = {
      id: `conditional-${Date.now()}`,
      ...rule
    };

    setSections(prev => prev.map(section => ({
      ...section,
      questions: section.questions.map(question =>
        question.id === questionId
          ? { ...question, conditionalRules: [...question.conditionalRules, newRule] }
          : question
      )
    })));
  };

  // Branching logic management
  const addBranchingLogic = (questionId: string, logic: Omit<BranchingLogic, 'id'>) => {
    const newLogic: BranchingLogic = {
      id: `branching-${Date.now()}`,
      ...logic
    };

    setSections(prev => prev.map(section => ({
      ...section,
      questions: section.questions.map(question =>
        question.id === questionId
          ? { ...question, branchingLogic: newLogic }
          : question
      )
    })));
  };

  // Import/Export functionality
  const exportQuestionnaire = (format: 'json' | 'csv') => {
    const data = {
      title,
      description,
      category,
      sections,
      exportedAt: new Date(),
      version: '1.0'
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'questionnaire'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const csvContent = [
        ['Section', 'Question', 'Type', 'Required', 'Description'].join(','),
        ...sections.flatMap(section =>
          section.questions.map(question => [
            `"${section.title}"`,
            `"${question.text}"`,
            question.type,
            question.required,
            `"${question.description || ''}"`
          ].join(','))
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'questionnaire'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    toast({
      title: 'Export Successful',
      description: `Questionnaire exported as ${format.toUpperCase()}`,
    });
  };

  const importQuestionnaire = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let data;

        if (file.type === 'application/json') {
          data = JSON.parse(content);
          setTitle(data.title || '');
          setDescription(data.description || '');
          setCategory(data.category || 'risk_assessment');
          setSections(data.sections || []);
        } else if (file.type === 'text/csv') {
          const lines = content.split('\n');
          const headers = lines[0].split(',');
          const rows = lines.slice(1);

          const importedSections: { [key: string]: EnhancedSection } = {};
          
          rows.forEach((row, index) => {
            const values = row.split(',').map(v => v.replace(/"/g, ''));
            const [sectionTitle, questionText, questionType, required, description] = values;

            if (!sectionTitle || !questionText) return;

            if (!importedSections[sectionTitle]) {
              importedSections[sectionTitle] = {
                id: `section-${Date.now()}-${Object.keys(importedSections).length}`,
                title: sectionTitle,
                description: '',
                order: Object.keys(importedSections).length,
                required: false,
                questions: [],
                conditionalRules: []
              };
            }

            const question: EnhancedQuestion = {
              id: `question-${Date.now()}-${index}`,
              sectionId: importedSections[sectionTitle].id,
              type: questionType || 'text',
              text: questionText,
              description: description || '',
              required: required === 'true',
              order: importedSections[sectionTitle].questions.length,
              config: {},
              validation: [],
              conditionalRules: [],
              aiGenerated: false,
              tags: []
            };

            importedSections[sectionTitle].questions.push(question);
          });

          setSections(Object.values(importedSections));
        }

        toast({
          title: 'Import Successful',
          description: 'Questionnaire imported successfully',
        });
        setShowBulkImport(false);
      } catch (error) {
        toast({
          title: 'Import Failed',
          description: 'Failed to parse the imported file',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  // Preview functionality
  const handlePreviewResponse = (questionId: string, value: any) => {
    setPreviewResponses(prev => {
      const existingIndex = prev.findIndex(r => r.questionId === questionId);
      const newResponse: PreviewResponse = {
        questionId,
        value,
        timestamp: new Date()
      };

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newResponse;
        return updated;
      }
      return [...prev, newResponse];
    });
  };

  const resetPreview = () => {
    setPreviewResponses([]);
    setPreviewCurrentSection(0);
  };

  // Question type icons
  const getQuestionTypeIcon = (type: string) => {
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
      case 'matrix': return <Grid3X3 className="w-4 h-4" />;
      case 'ranking': return <Move className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'signature': return <PenTool className="w-4 h-4" />;
      case 'location': return <MapPin className="w-4 h-4" />;
      case 'custom_html': return <Code2 className="w-4 h-4" />;
      default: return <Type className="w-4 h-4" />;
    }
  };

  // Save questionnaire
  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: 'Title Required',
        description: 'Please enter a questionnaire title',
        variant: 'destructive',
      });
      return;
    }

    const savedQuestionnaire = {
      id: questionnaire?.id || `questionnaire-${Date.now()}`,
      title,
      description,
      category,
      sections: sections.map((section, index) => ({
        ...section,
        order: index,
        questions: section.questions.map((question, qIndex) => ({
          ...question,
          order: qIndex
        }))
      })),
      version: questionnaire?.version || '1.0',
      status: questionnaire?.status || 'draft',
      createdAt: questionnaire?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    onSave(savedQuestionnaire);

    toast({
      title: 'Questionnaire Saved',
      description: 'Your questionnaire has been saved successfully',
    });
  };

  return (
    <div className="min-h-screen bg-notion-bg-primary">
      {/* Header */}
      <div className="border-b border-notion-border bg-notion-bg-secondary">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-notion-text-primary">
              {questionnaire ? 'Edit Questionnaire' : 'Create Questionnaire'}
            </h1>
            {isPreviewMode && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Preview Mode
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsPreviewMode(!isPreviewMode);
                if (!isPreviewMode) resetPreview();
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              {isPreviewMode ? 'Exit Preview' : 'Preview'}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportQuestionnaire('json')}>
                  <FileJson className="w-4 h-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportQuestionnaire('csv')}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="outline" onClick={() => setShowBulkImport(true)}>
              <UploadIcon className="w-4 h-4 mr-2" />
              Import
            </Button>
            
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            
            <Button variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {!isPreviewMode && (
          <>
            {/* Sidebar - Settings */}
            <div className="w-80 border-r border-notion-border bg-notion-bg-secondary p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-notion-text-primary mb-4">
                    Basic Settings
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter questionnaire title"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter questionnaire description"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="risk_assessment">Risk Assessment</SelectItem>
                          <SelectItem value="compliance">Compliance</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="vendor_assessment">Vendor Assessment</SelectItem>
                          <SelectItem value="audit">Audit</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-semibold text-notion-text-primary mb-4">
                    Quick Actions
                  </h3>
                  
                  <div className="space-y-2">
                    <Button variant="outline" onClick={addSection} className="w-full justify-start">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Section
                    </Button>
                    
                    {selectedSection && (
                      <Button 
                        variant="outline" 
                        onClick={() => addQuestion(selectedSection)}
                        className="w-full justify-start"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Question
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Main Content */}
        <div className="flex-1">
          {isPreviewMode ? (
            // Preview Mode
            <div className="p-6">
              <PreviewComponent
                sections={sections}
                currentSection={previewCurrentSection}
                responses={previewResponses}
                onResponse={handlePreviewResponse}
                onNextSection={() => setPreviewCurrentSection(prev => Math.min(prev + 1, sections.length - 1))}
                onPrevSection={() => setPreviewCurrentSection(prev => Math.max(prev - 1, 0))}
                getVisibleQuestions={getVisibleQuestions}
              />
            </div>
          ) : (
            // Builder Mode
            <div className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="builder">Builder</TabsTrigger>
                  <TabsTrigger value="logic">Logic & Rules</TabsTrigger>
                  <TabsTrigger value="validation">Validation</TabsTrigger>
                  <TabsTrigger value="settings">Advanced Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="builder">
                  <BuilderContent
                    sections={sections}
                    selectedSection={selectedSection}
                    selectedQuestion={selectedQuestion}
                    onSectionSelect={setSelectedSection}
                    onQuestionSelect={setSelectedQuestion}
                    onSectionReorder={handleSectionReorder}
                    onQuestionReorder={handleQuestionReorder}
                    onAddQuestion={addQuestion}
                    onDuplicateQuestion={duplicateQuestion}
                    onDeleteQuestion={deleteQuestion}
                    onDeleteSection={deleteSection}
                    getQuestionTypeIcon={getQuestionTypeIcon}
                  />
                </TabsContent>

                <TabsContent value="logic">
                  <LogicContent
                    sections={sections}
                    selectedQuestion={selectedQuestion}
                    onAddConditionalRule={addConditionalRule}
                    onAddBranchingLogic={addBranchingLogic}
                  />
                </TabsContent>

                <TabsContent value="validation">
                  <ValidationContent
                    sections={sections}
                    selectedQuestion={selectedQuestion}
                    onAddValidationRule={addValidationRule}
                  />
                </TabsContent>

                <TabsContent value="settings">
                  <AdvancedSettingsContent />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Import Dialog */}
      <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Import Questions</DialogTitle>
            <DialogDescription>
              Import questions from JSON or CSV files
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Upload File</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) importQuestionnaire(file);
                }}
              />
            </div>
            
            <div className="text-sm text-notion-text-secondary">
              <p><strong>JSON format:</strong> Export from another questionnaire</p>
              <p><strong>CSV format:</strong> Section, Question, Type, Required, Description</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sub-components (BuilderContent, LogicContent, etc.) would be defined here...
// Due to length constraints, I'll include the key components inline

function BuilderContent({ 
  sections, 
  selectedSection, 
  onSectionSelect, 
  onSectionReorder,
  onQuestionReorder,
  onAddQuestion,
  onDuplicateQuestion,
  onDeleteQuestion,
  onDeleteSection,
  getQuestionTypeIcon
}: any) {
  return (
    <div className="space-y-6">
      <Reorder.Group axis="y" values={sections} onReorder={onSectionReorder}>
        {sections.map((section: EnhancedSection, sectionIndex: number) => (
          <Reorder.Item key={section.id} value={section}>
            <motion.div
              layout
              className={`border rounded-lg p-4 bg-white ${
                selectedSection === section.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => onSectionSelect(section.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                  <Badge variant="outline">{section.questions.length} questions</Badge>
                </div>
                
                <div className="flex items-center space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Question
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => onAddQuestion(section.id, 'text')}>
                        <Type className="w-4 h-4 mr-2" />
                        Text Input
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAddQuestion(section.id, 'textarea')}>
                        <FileText className="w-4 h-4 mr-2" />
                        Long Text
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAddQuestion(section.id, 'single_choice')}>
                        <CheckSquare className="w-4 h-4 mr-2" />
                        Single Choice
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAddQuestion(section.id, 'multiple_choice')}>
                        <List className="w-4 h-4 mr-2" />
                        Multiple Choice
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAddQuestion(section.id, 'scale')}>
                        <Gauge className="w-4 h-4 mr-2" />
                        Scale/Rating
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onAddQuestion(section.id, 'matrix')}>
                        <Grid3X3 className="w-4 h-4 mr-2" />
                        Matrix/Grid
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAddQuestion(section.id, 'ranking')}>
                        <Move className="w-4 h-4 mr-2" />
                        Ranking
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAddQuestion(section.id, 'image')}>
                        <Image className="w-4 h-4 mr-2" />
                        Image Selection
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAddQuestion(section.id, 'signature')}>
                        <PenTool className="w-4 h-4 mr-2" />
                        Signature
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAddQuestion(section.id, 'location')}>
                        <MapPin className="w-4 h-4 mr-2" />
                        Location Picker
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAddQuestion(section.id, 'custom_html')}>
                        <Code2 className="w-4 h-4 mr-2" />
                        Custom HTML
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => onDeleteSection(section.id)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Section
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {section.questions.length > 0 && (
                <Reorder.Group
                  axis="y"
                  values={section.questions}
                  onReorder={(newQuestions) => onQuestionReorder(section.id, newQuestions)}
                >
                  <div className="space-y-2">
                    {section.questions.map((question: EnhancedQuestion) => (
                      <Reorder.Item key={question.id} value={question}>
                        <motion.div
                          layout
                          className="border rounded p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                              {getQuestionTypeIcon(question.type)}
                              <span className="font-medium">{question.text}</span>
                              {question.required && (
                                <Badge variant="secondary" className="text-xs">Required</Badge>
                              )}
                              {question.conditionalRules.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  <Filter className="w-3 h-3 mr-1" />
                                  Conditional
                                </Badge>
                              )}
                              {question.branchingLogic && (
                                <Badge variant="outline" className="text-xs">
                                  <GitBranch className="w-3 h-3 mr-1" />
                                  Branching
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onDuplicateQuestion(question.id)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onDeleteQuestion(question.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      </Reorder.Item>
                    ))}
                  </div>
                </Reorder.Group>
              )}
            </motion.div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
}

function LogicContent({ sections, selectedQuestion, onAddConditionalRule, onAddBranchingLogic }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GitBranch className="w-5 h-5 mr-2" />
            Conditional Logic & Branching
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedQuestion ? (
            <div className="space-y-4">
              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  Configure when this question should be shown or hidden based on other responses.
                </AlertDescription>
              </Alert>
              
              {/* Conditional rules UI would go here */}
              <div className="text-sm text-gray-600">
                Selected question: {sections.flatMap((s: any) => s.questions).find((q: any) => q.id === selectedQuestion)?.text}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Select a question to configure conditional logic
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ValidationContent({ sections, selectedQuestion, onAddValidationRule }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Question Validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedQuestion ? (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  Set validation rules to ensure responses meet your requirements.
                </AlertDescription>
              </Alert>
              
              {/* Validation rules UI would go here */}
              <div className="text-sm text-gray-600">
                Configure validation for: {sections.flatMap((s: any) => s.questions).find((q: any) => q.id === selectedQuestion)?.text}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Select a question to configure validation rules
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AdvancedSettingsContent() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">AI Settings</h4>
              <Switch />
              <p className="text-sm text-gray-600 mt-1">Enable AI-powered features</p>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-2">Response Settings</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Allow partial save</span>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Randomize questions</span>
                  <Switch />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PreviewComponent({ 
  sections, 
  currentSection, 
  responses, 
  onResponse, 
  onNextSection, 
  onPrevSection, 
  getVisibleQuestions 
}: any) {
  const currentSectionData = sections[currentSection];
  const visibleQuestions = currentSectionData ? getVisibleQuestions(currentSectionData.id) : [];

  if (!currentSectionData) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold">Preview Complete</h3>
        <p className="text-gray-600">You have completed the questionnaire preview.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{currentSectionData.title}</h2>
          <Badge variant="outline">
            Section {currentSection + 1} of {sections.length}
          </Badge>
        </div>
        {currentSectionData.description && (
          <p className="text-gray-600 mt-2">{currentSectionData.description}</p>
        )}
      </div>

      <div className="space-y-6">
        {visibleQuestions.map((question: EnhancedQuestion) => (
          <Card key={question.id}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <span className="font-medium">{question.text}</span>
                  {question.required && <span className="text-red-500">*</span>}
                </div>
                
                {question.description && (
                  <p className="text-sm text-gray-600">{question.description}</p>
                )}

                {/* Question input based on type */}
                <div>
                  {question.type === 'text' && (
                    <Input
                      placeholder="Enter your response..."
                      onChange={(e) => onResponse(question.id, e.target.value)}
                    />
                  )}
                  {question.type === 'textarea' && (
                    <Textarea
                      placeholder="Enter your response..."
                      onChange={(e) => onResponse(question.id, e.target.value)}
                    />
                  )}
                  {question.type === 'boolean' && (
                    <div className="flex space-x-4">
                      <Button
                        variant="outline"
                        onClick={() => onResponse(question.id, true)}
                      >
                        Yes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => onResponse(question.id, false)}
                      >
                        No
                      </Button>
                    </div>
                  )}
                  {/* Add more question types as needed */}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={onPrevSection}
          disabled={currentSection === 0}
        >
          Previous Section
        </Button>
        <Button
          onClick={onNextSection}
          disabled={currentSection === sections.length - 1}
        >
          Next Section
        </Button>
      </div>
    </div>
  );
} 