import React, { useState, useCallback } from 'react';
import { useQuestionnaires } from '@/context/QuestionnaireContext';
import { Question, Questionnaire, RiskCategory } from '@/types';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Icons
import {
  Plus,
  Trash2,
  GripVertical,
  Wand2,
  Copy,
  Settings,
  Save,
  FileText,
  Upload,
  Star,
  ToggleLeft,
  MessageSquare,
  CheckSquare,
} from 'lucide-react';

interface QuestionnaireBuilderProps {
  questionnaireId?: string;
  onSave?: (questionnaire: Questionnaire) => void;
  onCancel?: () => void;
}

export const QuestionnaireBuilder: React.FC<QuestionnaireBuilderProps> = ({
  questionnaireId,
  onSave,
  onCancel,
}) => {
  const {
    getQuestionnaire,
    createQuestionnaire,
    updateQuestionnaire,
    updateQuestion,
    deleteQuestion,
    generateQuestionsForRisk,
    generateQuestionsForControl,
    loading,
  } = useQuestionnaires();

  const existingQuestionnaire = questionnaireId ? getQuestionnaire(questionnaireId) : null;
  
  const [questionnaire, setQuestionnaire] = useState<Partial<Questionnaire>>({
    title: existingQuestionnaire?.title || '',
    description: existingQuestionnaire?.description || '',
    questions: existingQuestionnaire?.questions || [],
    targetRoles: existingQuestionnaire?.targetRoles || [],
    status: existingQuestionnaire?.status || 'draft',
    dueDate: existingQuestionnaire?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedTime: existingQuestionnaire?.estimatedTime || 10,
    tags: existingQuestionnaire?.tags || [],
  });

  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [draggedQuestion, setDraggedQuestion] = useState<Question | null>(null);

  const roleOptions = [
    { value: 'admin', label: 'Administrator' },
    { value: 'risk_manager', label: 'Risk Manager' },
    { value: 'auditor', label: 'Auditor' },
    { value: 'user', label: 'User' },
  ];

  // Handle questionnaire save
  const handleSave = async () => {
    try {
      if (!questionnaire.title || !questionnaire.description) {
        alert('Please fill in title and description');
        return;
      }

      let savedQuestionnaire: Questionnaire;
      
      if (questionnaireId && existingQuestionnaire) {
        savedQuestionnaire = await updateQuestionnaire(questionnaireId, questionnaire);
      } else {
        savedQuestionnaire = await createQuestionnaire({
          ...questionnaire,
          createdBy: 'current-user', // In real app, get from auth context
        } as Omit<Questionnaire, 'id' | 'createdAt' | 'responses' | 'analytics'>);
      }

      onSave?.(savedQuestionnaire);
    } catch (error) {
      console.error('Failed to save questionnaire:', error);
    }
  };

  // Question management
  const handleAddQuestion = () => {
    setSelectedQuestion({
      id: '',
      text: '',
      type: 'text',
      required: false,
      order: questionnaire.questions?.length || 0 + 1,
    } as Question);
    setShowQuestionDialog(true);
  };

  const handleEditQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setShowQuestionDialog(true);
  };

  const handleSaveQuestion = async (questionData: Partial<Question>) => {
    try {
      if (selectedQuestion?.id && questionnaireId) {
        // Update existing question
        await updateQuestion(questionnaireId, selectedQuestion.id, questionData);
      } else {
        // Add new question
        const newQuestion: Question = {
          id: `q-${Date.now()}`,
          text: questionData.text || '',
          type: questionData.type || 'text',
          required: questionData.required || false,
          order: questionnaire.questions?.length || 0 + 1,
          options: questionData.options,
          conditional: questionData.conditional,
          category: questionData.category,
          helpText: questionData.helpText,
        };

        setQuestionnaire(prev => ({
          ...prev,
          questions: [...(prev.questions || []), newQuestion],
        }));
      }

      setShowQuestionDialog(false);
      setSelectedQuestion(null);
    } catch (error) {
      console.error('Failed to save question:', error);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      if (questionnaireId) {
        await deleteQuestion(questionnaireId, questionId);
      } else {
        setQuestionnaire(prev => ({
          ...prev,
          questions: prev.questions?.filter(q => q.id !== questionId) || [],
        }));
      }
    } catch (error) {
      console.error('Failed to delete question:', error);
    }
  };

  const handleDuplicateQuestion = (question: Question) => {
    const duplicated: Question = {
      ...question,
      id: `q-${Date.now()}`,
      text: `${question.text} (Copy)`,
      order: questionnaire.questions?.length || 0 + 1,
    };

    setQuestionnaire(prev => ({
      ...prev,
      questions: [...(prev.questions || []), duplicated],
    }));
  };

  // AI Question Generation
  const handleGenerateAIQuestions = async (category: RiskCategory | string, count: number) => {
    setAiGenerating(true);
    try {
      let aiQuestions: Question[];
      
      if (['operational', 'financial', 'strategic', 'compliance', 'technology'].includes(category)) {
        aiQuestions = await generateQuestionsForRisk(category as RiskCategory, count);
      } else {
        aiQuestions = await generateQuestionsForControl(category, count);
      }

      setQuestionnaire(prev => ({
        ...prev,
        questions: [...(prev.questions || []), ...aiQuestions],
      }));

      setShowAIDialog(false);
    } catch (error) {
      console.error('Failed to generate AI questions:', error);
    } finally {
      setAiGenerating(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (question: Question) => {
    setDraggedQuestion(question);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetQuestion: Question) => {
    e.preventDefault();
    
    if (!draggedQuestion || draggedQuestion.id === targetQuestion.id) return;

    const questions = questionnaire.questions || [];
    const draggedIndex = questions.findIndex(q => q.id === draggedQuestion.id);
    const targetIndex = questions.findIndex(q => q.id === targetQuestion.id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newQuestions = [...questions];
    newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(targetIndex, 0, draggedQuestion);

    // Update order
    const reorderedQuestions = newQuestions.map((q, index) => ({
      ...q,
      order: index + 1,
    }));

    setQuestionnaire(prev => ({
      ...prev,
      questions: reorderedQuestions,
    }));

    setDraggedQuestion(null);
  }, [draggedQuestion, questionnaire.questions]);

  if (loading) {
    return <LoadingSpinner text="Loading questionnaire..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {questionnaireId ? 'Edit Questionnaire' : 'Create Questionnaire'}
          </h1>
          <p className="text-muted-foreground">
            Build dynamic questionnaires with conditional logic and AI assistance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      {/* Questionnaire Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Questionnaire Settings</CardTitle>
          <CardDescription>
            Configure basic questionnaire information and targeting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={questionnaire.title}
                onChange={(e) => setQuestionnaire(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter questionnaire title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedTime">Estimated Time (minutes)</Label>
              <Input
                id="estimatedTime"
                type="number"
                value={questionnaire.estimatedTime}
                onChange={(e) => setQuestionnaire(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) }))}
                placeholder="10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={questionnaire.description}
              onChange={(e) => setQuestionnaire(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the purpose and scope of this questionnaire"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={questionnaire.dueDate?.slice(0, 16)}
                onChange={(e) => setQuestionnaire(prev => ({ ...prev, dueDate: new Date(e.target.value).toISOString() }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Target Roles</Label>
              <div className="flex flex-wrap gap-2">
                {roleOptions.map(role => (
                  <div key={role.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={role.value}
                      checked={questionnaire.targetRoles?.includes(role.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setQuestionnaire(prev => ({
                            ...prev,
                            targetRoles: [...(prev.targetRoles || []), role.value],
                          }));
                        } else {
                          setQuestionnaire(prev => ({
                            ...prev,
                            targetRoles: prev.targetRoles?.filter(r => r !== role.value) || [],
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={role.value} className="text-sm">
                      {role.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Questions ({questionnaire.questions?.length || 0})</CardTitle>
              <CardDescription>
                Add, edit, and reorder questions. Use drag and drop to reorder.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Wand2 className="mr-2 h-4 w-4" />
                    AI Generate
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate AI Questions</DialogTitle>
                    <DialogDescription>
                      Generate questions based on risk categories or control types
                    </DialogDescription>
                  </DialogHeader>
                  <AIQuestionGenerator
                    onGenerate={handleGenerateAIQuestions}
                    loading={aiGenerating}
                  />
                </DialogContent>
              </Dialog>
              <Button onClick={handleAddQuestion} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {questionnaire.questions?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No questions added yet</p>
              <p className="text-sm">Start by adding a question or generating with AI</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questionnaire.questions?.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={index}
                  onEdit={handleEditQuestion}
                  onDelete={handleDeleteQuestion}
                  onDuplicate={handleDuplicateQuestion}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Editor Dialog */}
      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedQuestion?.id ? 'Edit Question' : 'Add Question'}
            </DialogTitle>
            <DialogDescription>
              Configure question settings and conditional logic
            </DialogDescription>
          </DialogHeader>
          <QuestionEditor
            question={selectedQuestion}
            onSave={handleSaveQuestion}
            onCancel={() => setShowQuestionDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Question Card Component
interface QuestionCardProps {
  question: Question;
  index: number;
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
  onDuplicate: (question: Question) => void;
  onDragStart: (question: Question) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, question: Question) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  onEdit,
  onDelete,
  onDuplicate,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const getQuestionTypeIcon = (type: Question['type']) => {
    const icons = {
      text: MessageSquare,
      multiple_choice: CheckSquare,
      rating: Star,
      yes_no: ToggleLeft,
      file_upload: Upload,
    };
    const Icon = icons[type];
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Card
      className="cursor-move hover:shadow-md transition-shadow"
      draggable
      onDragStart={() => onDragStart(question)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, question)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <GripVertical className="h-4 w-4" />
              <span className="text-sm font-medium">{index + 1}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                {getQuestionTypeIcon(question.type)}
                <Badge variant="outline">{question.type.replace('_', ' ')}</Badge>
                {question.required && <Badge variant="secondary">Required</Badge>}
                {question.aiGenerated && <Badge variant="secondary">AI Generated</Badge>}
                {question.conditional && <Badge variant="outline">Conditional</Badge>}
              </div>
              <p className="font-medium">{question.text}</p>
              {question.helpText && (
                <p className="text-sm text-muted-foreground mt-1">{question.helpText}</p>
              )}
              {question.options && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {question.options.map((option, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {option}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(question)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDuplicate(question)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(question.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// AI Question Generator Component
interface AIQuestionGeneratorProps {
  onGenerate: (category: string, count: number) => void;
  loading: boolean;
}

const AIQuestionGenerator: React.FC<AIQuestionGeneratorProps> = ({
  onGenerate,
  loading,
}) => {
  const [category, setCategory] = useState<string>('');
  const [count, setCount] = useState(5);

  const categories = [
    { value: 'operational', label: 'Operational Risk' },
    { value: 'financial', label: 'Financial Risk' },
    { value: 'strategic', label: 'Strategic Risk' },
    { value: 'compliance', label: 'Compliance Risk' },
    { value: 'technology', label: 'Technology Risk' },
    { value: 'preventive', label: 'Preventive Controls' },
    { value: 'detective', label: 'Detective Controls' },
    { value: 'corrective', label: 'Corrective Controls' },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Number of Questions</Label>
        <Select value={count.toString()} onValueChange={(value) => setCount(parseInt(value))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[3, 5, 7, 10].map(num => (
              <SelectItem key={num} value={num.toString()}>
                {num} questions
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          onClick={() => onGenerate(category, count)}
          disabled={!category || loading}
        >
          {loading ? (
            <>
              <LoadingSpinner className="mr-2 h-4 w-4" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Questions
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

// Question Editor Component
interface QuestionEditorProps {
  question: Question | null;
  onSave: (question: Partial<Question>) => void;
  onCancel: () => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Partial<Question>>({
    text: question?.text || '',
    type: question?.type || 'text',
    required: question?.required || false,
    options: question?.options || [],
    helpText: question?.helpText || '',
    category: question?.category || '',
    conditional: question?.conditional,
  });

  const [newOption, setNewOption] = useState('');

  const questionTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'rating', label: 'Rating Scale' },
    { value: 'yes_no', label: 'Yes/No' },
    { value: 'file_upload', label: 'File Upload' },
  ];

  const handleAddOption = () => {
    if (newOption.trim()) {
      setFormData(prev => ({
        ...prev,
        options: [...(prev.options || []), newOption.trim()],
      }));
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSave = () => {
    if (!formData.text?.trim()) {
      alert('Please enter question text');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="questionText">Question Text</Label>
        <Textarea
          id="questionText"
          value={formData.text}
          onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
          placeholder="Enter your question"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Question Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as Question['type'] }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {questionTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            placeholder="e.g., operational, financial"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="helpText">Help Text (Optional)</Label>
        <Input
          id="helpText"
          value={formData.helpText}
          onChange={(e) => setFormData(prev => ({ ...prev, helpText: e.target.value }))}
          placeholder="Additional guidance for respondents"
        />
      </div>

      {(formData.type === 'multiple_choice' || formData.type === 'rating') && (
        <div className="space-y-2">
          <Label>Options</Label>
          <div className="space-y-2">
            {formData.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input value={option} readOnly />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveOption(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex items-center space-x-2">
              <Input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="Add option"
                onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
              />
              <Button onClick={handleAddOption} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch
          id="required"
          checked={formData.required}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, required: checked }))}
        />
        <Label htmlFor="required">Required Question</Label>
      </div>

      <Separator />

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Question
        </Button>
      </div>
    </div>
  );
}; 