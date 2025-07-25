'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyTooltip, DaisyTooltipContent, DaisyTooltipTrigger } from '@/components/ui/DaisyTooltip';

import {
  Brain, Sparkles, Target, Shield, CheckCircle, AlertTriangle,
  Plus, RefreshCw, ThumbsUp, ThumbsDown, Copy, Edit, Wand2,
  Lightbulb, TrendingUp, Eye, Clock, Users, Zap
} from 'lucide-react';

import type { 
  Questionnaire, 
  SuggestedQuestion, 
  QuestionType, 
  AIQuestionContext 
} from '@/types/questionnaire.types';

interface AIQuestionSuggestionsProps {
  questionnaire: Questionnaire | null;
  onApplySuggestion: (suggestion: SuggestedQuestion) => void;
}

interface GeneratedSuggestion extends SuggestedQuestion {
  id: string;
  confidence: number;
  category: string;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  contextFactors: string[];
}

export function AIQuestionSuggestions({ 
  questionnaire, 
  onApplySuggestion 
}: AIQuestionSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<GeneratedSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedContext, setSelectedContext] = useState<string>('industry');
  const [filterType, setFilterType] = useState<QuestionType | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<'high' | 'medium' | 'low' | 'all'>('all');

  // Initialize with sample suggestions
  useEffect(() => {
    if (questionnaire) {
      generateContextualSuggestions();
    }
  }, [questionnaire]);

  const generateContextualSuggestions = async () => {
    setIsGenerating(true);
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockSuggestions: GeneratedSuggestion[] = [
        {
          id: 'ai-q-001',
          text: 'How frequently does your organization conduct penetration testing of external-facing systems?',
          type: 'single_choice',
          rationale: 'Penetration testing frequency is a critical indicator of proactive cybersecurity posture and helps assess the organization\'s commitment to identifying vulnerabilities.',
          riskWeight: 8.5,
          confidence: 92,
          category: 'Cybersecurity Controls',
          priority: 'high',
          tags: ['penetration-testing', 'vulnerability-management', 'security-controls'],
          contextFactors: ['High-risk industry', 'External-facing systems', 'Compliance requirements'],
          config: {
            options: [
              { id: 'opt-1', text: 'Quarterly', value: 'quarterly', order: 1, riskWeight: 1 },
              { id: 'opt-2', text: 'Bi-annually', value: 'biannual', order: 2, riskWeight: 3 },
              { id: 'opt-3', text: 'Annually', value: 'annual', order: 3, riskWeight: 6 },
              { id: 'opt-4', text: 'Never', value: 'never', order: 4, riskWeight: 10 }
            ]
          }
        },
        {
          id: 'ai-q-002',
          text: 'Describe your organization\'s incident response plan for data breaches, including notification timelines.',
          type: 'textarea',
          rationale: 'A comprehensive incident response plan is essential for minimizing breach impact and ensuring regulatory compliance with notification requirements.',
          riskWeight: 9.2,
          confidence: 88,
          category: 'Incident Management',
          priority: 'high',
          tags: ['incident-response', 'data-breach', 'compliance'],
          contextFactors: ['Data handling processes', 'Regulatory requirements', 'Business impact'],
          config: {
            placeholder: 'Please describe your incident response procedures, including detection, containment, investigation, and notification steps...',
            helpText: 'Include specific timelines for breach notification to authorities and affected individuals.'
          }
        },
        {
          id: 'ai-q-003',
          text: 'On a scale of 1-10, how would you rate your organization\'s current cybersecurity awareness training program?',
          type: 'scale',
          rationale: 'Employee awareness is often the weakest link in cybersecurity. Regular training programs are crucial for maintaining a strong security culture.',
          riskWeight: 7.8,
          confidence: 85,
          category: 'Security Culture',
          priority: 'medium',
          tags: ['training', 'awareness', 'human-factors'],
          contextFactors: ['Human element risk', 'Training effectiveness', 'Security culture'],
          config: {
            scale: {
              min: 1,
              max: 10,
              step: 1,
              labels: { 1: 'Very Poor', 5: 'Average', 10: 'Excellent' },
              showLabels: true
            }
          }
        },
        {
          id: 'ai-q-004',
          text: 'Which of the following security frameworks does your organization currently follow? (Select all that apply)',
          type: 'multiple_choice',
          rationale: 'Framework adoption indicates structured approach to cybersecurity and helps assess maturity level of security practices.',
          riskWeight: 6.5,
          confidence: 90,
          category: 'Governance',
          priority: 'medium',
          tags: ['frameworks', 'governance', 'standards'],
          contextFactors: ['Industry standards', 'Compliance requirements', 'Maturity assessment'],
          config: {
            options: [
              { id: 'opt-1', text: 'NIST Cybersecurity Framework', value: 'nist', order: 1, riskWeight: 2 },
              { id: 'opt-2', text: 'ISO 27001', value: 'iso27001', order: 2, riskWeight: 2 },
              { id: 'opt-3', text: 'SOC 2', value: 'soc2', order: 3, riskWeight: 3 },
              { id: 'opt-4', text: 'CIS Controls', value: 'cis', order: 4, riskWeight: 3 },
              { id: 'opt-5', text: 'None of the above', value: 'none', order: 5, riskWeight: 8 }
            ]
          }
        },
        {
          id: 'ai-q-005',
          text: 'Does your organization maintain an up-to-date inventory of all IT assets including cloud services?',
          type: 'boolean',
          rationale: 'Asset inventory is fundamental to cybersecurity. Organizations cannot protect what they don\'t know they have.',
          riskWeight: 8.8,
          confidence: 95,
          category: 'Asset Management',
          priority: 'high',
          tags: ['asset-inventory', 'cloud-security', 'visibility'],
          contextFactors: ['Cloud adoption', 'Asset visibility', 'Risk management'],
          config: {
            defaultValue: false
          }
        },
        {
          id: 'ai-q-006',
          text: 'How many critical vulnerabilities remain unpatched for more than 30 days in your environment?',
          type: 'number',
          rationale: 'Unpatched critical vulnerabilities represent immediate attack vectors. The number and duration of exposure directly correlates to risk level.',
          riskWeight: 9.5,
          confidence: 87,
          category: 'Vulnerability Management',
          priority: 'high',
          tags: ['vulnerabilities', 'patching', 'exposure-time'],
          contextFactors: ['Patch management maturity', 'Risk exposure', 'Operations impact'],
          config: {
            placeholder: 'Enter number of unpatched critical vulnerabilities'
          }
        }
      ];

      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCustomSuggestions = async () => {
    if (!customPrompt.trim()) return;
    
    setIsGenerating(true);
    try {
      // Simulate AI processing for custom prompt
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const customSuggestion: GeneratedSuggestion = {
        id: `ai-custom-${Date.now()}`,
        text: `Based on your input: "${customPrompt}" - What specific measures has your organization implemented to address this concern?`,
        type: 'textarea',
        rationale: `This question addresses the specific concern you mentioned and helps assess current mitigation strategies.`,
        riskWeight: 7.0,
        confidence: 78,
        category: 'Custom Analysis',
        priority: 'medium',
        tags: ['custom', 'targeted-assessment'],
        contextFactors: ['User-defined context', 'Specific concern area'],
        config: {
          placeholder: 'Please describe your current measures and their effectiveness...'
        }
      };

      setSuggestions(prev => [customSuggestion, ...prev]);
      setCustomPrompt('');
    } catch (error) {
      console.error('Failed to generate custom suggestion:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredSuggestions = suggestions.filter(suggestion => {
    const typeMatch = filterType === 'all' || suggestion.type === filterType;
    const priorityMatch = filterPriority === 'all' || suggestion.priority === filterPriority;
    return typeMatch && priorityMatch;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const SuggestionCard = ({ suggestion }: { suggestion: GeneratedSuggestion }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="border border-notion-border rounded-lg p-4 bg-white dark:bg-notion-bg-tertiary"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <DaisyBadge variant="outline" className={getPriorityColor(suggestion.priority)}>
            {suggestion.priority.toUpperCase()}
          </DaisyBadge>
          <DaisyBadge variant="outline" className="text-xs">
            {suggestion.category}
          </DaisyBadge>
        </div>
        
        <div className="flex items-center space-x-1 text-xs text-notion-text-secondary">
          <Sparkles className="w-3 h-3" />
          <span className={getConfidenceColor(suggestion.confidence)}>
            {suggestion.confidence}%
          </span>
        </div>
      </div>

      {/* Question Text */}
      <div className="mb-3">
        <p className="text-sm font-medium text-notion-text-primary mb-2">
          {suggestion.text}
        </p>
        <p className="text-xs text-notion-text-secondary">
          {suggestion.rationale}
        </p>
      </div>

      {/* Question Type & Weight */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-notion-text-secondary">Type:</span>
          <span className="font-medium capitalize">{suggestion.type.replace('_', ' ')}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-notion-text-secondary">Risk Weight:</span>
          <span className="font-medium">{suggestion.riskWeight}/10</span>
        </div>
      </div>

      {/* Context Factors */}
      <div className="mb-3">
        <p className="text-xs text-notion-text-secondary mb-1">Context Factors:</p>
        <div className="flex flex-wrap gap-1">
          {suggestion.contextFactors.map((factor, index) => (
            <DaisyBadge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              {factor}
            </DaisyBadge>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="mb-4">
        <p className="text-xs text-notion-text-secondary mb-1">Tags:</p>
        <div className="flex flex-wrap gap-1">
          {suggestion.tags.map((tag, index) => (
            <DaisyBadge key={index} variant="outline" className="text-xs">
              {tag}
            </DaisyBadge>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-notion-border">
        <div className="flex items-center space-x-1">
          <DaisyTooltip>
            <DaisyTooltipTrigger>
              <DaisyButton variant="ghost" size="sm">
                <ThumbsUp className="w-3 h-3" />
              </DaisyButton>
            </DaisyTooltipTrigger>
            <DaisyTooltipContent>Good suggestion</DaisyTooltipContent>
          </DaisyTooltip>
          
          <DaisyTooltip>
            <DaisyTooltipTrigger>
              <DaisyButton variant="ghost" size="sm">
                <ThumbsDown className="w-3 h-3" />
              </DaisyButton>
            </DaisyTooltipTrigger>
            <DaisyTooltipContent>Poor suggestion</DaisyTooltipContent>
          </DaisyTooltip>
          
          <DaisyTooltip>
            <DaisyTooltipTrigger>
              <DaisyButton variant="ghost" size="sm">
                <Copy className="w-3 h-3" />
              </DaisyButton>
            </DaisyTooltipTrigger>
            <DaisyTooltipContent>Copy question text</DaisyTooltipContent>
          </DaisyTooltip>
        </div>

        <DaisyButton 
          size="sm" 
          onClick={() => onApplySuggestion(suggestion)}
          className="bg-notion-blue hover:bg-notion-blue/90"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add
        </DaisyButton>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-4 p-4">
      {/* AI Context Selector */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Brain className="w-4 h-4 text-notion-blue" />
          <h4 className="font-medium text-notion-text-primary">AI Question Generator</h4>
        </div>
        
        <DaisySelect value={selectedContext} onValueChange={setSelectedContext}>
          <DaisySelectTrigger className="w-full">
            <DaisySelectValue placeholder="Select context" />
          </SelectTrigger>
          <DaisySelectContent>
            <DaisySelectItem value="industry">Industry Best Practices</SelectItem>
            <DaisySelectItem value="framework">Compliance Framework</SelectItem>
            <DaisySelectItem value="risk">Risk-Based Assessment</SelectItem>
            <DaisySelectItem value="maturity">Maturity Assessment</SelectItem>
            <DaisySelectItem value="audit">Audit Readiness</SelectItem>
          </SelectContent>
        </DaisySelect>

        <DaisyButton 
          onClick={generateContextualSuggestions}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Generate Questions
            </>
          )}
        </DaisyButton>
      </div>

      {/* Custom Prompt */}
      <div className="space-y-3 p-3 bg-notion-bg-tertiary rounded-lg">
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-4 h-4 text-yellow-600" />
          <h5 className="font-medium text-notion-text-primary">Custom AI Prompt</h5>
        </div>
        
        <DaisyTextarea
          placeholder="Describe a specific area you want to assess (e.g., 'remote work security challenges', 'third-party data sharing risks')..."
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          rows={3}
        />
        
        <DaisyButton 
          onClick={generateCustomSuggestions}
          disabled={isGenerating || !customPrompt.trim()}
          size="sm"
          className="w-full"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Custom Question
        </DaisyButton>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2">
        <DaisySelect value={filterType} onValueChange={(value) => setFilterType(value as QuestionType | 'all')}>
          <DaisySelectTrigger>
            <DaisySelectValue placeholder="Type" />
          </SelectTrigger>
          <DaisySelectContent>
            <DaisySelectItem value="all">All Types</SelectItem>
            <DaisySelectItem value="text">Text</SelectItem>
            <DaisySelectItem value="single_choice">Single Choice</SelectItem>
            <DaisySelectItem value="multiple_choice">Multiple Choice</SelectItem>
            <DaisySelectItem value="scale">Scale</SelectItem>
            <DaisySelectItem value="boolean">Yes/No</SelectItem>
          </SelectContent>
        </DaisySelect>

        <DaisySelect value={filterPriority} onValueChange={(value) => setFilterPriority(value as 'high' | 'medium' | 'low' | 'all')}>
          <DaisySelectTrigger>
            <DaisySelectValue placeholder="Priority" />
          </SelectTrigger>
          <DaisySelectContent>
            <DaisySelectItem value="all">All Priorities</SelectItem>
            <DaisySelectItem value="high">High</SelectItem>
            <DaisySelectItem value="medium">Medium</SelectItem>
            <DaisySelectItem value="low">Low</SelectItem>
          </SelectContent>
        </DaisySelect>
      </div>

      {/* Suggestions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="font-medium text-notion-text-primary">
            AI Suggestions ({filteredSuggestions.length})
          </h5>
          {suggestions.length > 0 && (
            <DaisyButton 
              variant="ghost" 
              size="sm"
              onClick={generateContextualSuggestions}
              disabled={isGenerating}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </DaisyButton>
          )}
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {isGenerating && suggestions.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <Brain className="w-8 h-8 text-notion-blue mx-auto mb-3 animate-pulse" />
                <p className="text-sm text-notion-text-secondary">
                  AI is analyzing context and generating personalized questions...
                </p>
                <DaisyProgress value={75} className="w-32 mx-auto mt-3" />
              </motion.div>
            )}
            
            {filteredSuggestions.map((suggestion) => (
              <SuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))}
          </AnimatePresence>
        </div>

        {filteredSuggestions.length === 0 && !isGenerating && suggestions.length > 0 && (
          <div className="text-center py-4">
            <Eye className="w-8 h-8 text-notion-text-tertiary mx-auto mb-2" />
            <p className="text-sm text-notion-text-secondary">
              No suggestions match your current filters
            </p>
          </div>
        )}
      </div>

      {/* AI Insights */}
      {questionnaire && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h6 className="font-medium text-blue-800 dark:text-blue-200">AI Insights</h6>
          </div>
          <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
            <p>• Questions optimized for {questionnaire.category.replace('_', ' ')} assessment</p>
            <p>• Risk weighting based on industry best practices</p>
            <p>• Conditional logic suggestions available</p>
            {questionnaire.aiSettings.enabled && (
              <p>• Auto-scoring and risk calculation enabled</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 