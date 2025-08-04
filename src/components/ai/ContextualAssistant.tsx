'use client';

import React, { useState, useEffect, useRef } from 'react';
import { designTokens } from '@/lib/design-system/tokens';
// import {
  StatusIcons,
  RiskManagementIcons,
  ActionIcons,
  NavigationIcons,
  CommunicationIcons,
} from '@/components/icons/IconLibrary'
import { LoadingStates } from '@/components/states/LoadingState';

// Context types and interfaces
interface ContextualSuggestion {
  id: string
  type: 'tip' | 'action' | 'warning' | 'info' | 'shortcut';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  context: string;
  trigger?: string;
  action?: {
    label: string;
    handler: () => void;
  }
  dismissible: boolean;
  persistent?: boolean;
}

interface WorkflowContext {
  page: string;
  section?: string;
  userRole: string;
  currentTask?: string;
  formData?: any;
  recentActions?: string[];
  timeSpent?: number;
}

interface ContextualAssistantProps {
  context: WorkflowContext;
  position?: 'floating' | 'sidebar' | 'inline';
  isMinimized?: boolean;
  onMinimize?: () => void;
  onExpand?: () => void;
  className?: string;
}

// Context-aware suggestions generator
const generateContextualSuggestions = (_context: WorkflowContext): ContextualSuggestion[] => {
  const suggestions: ContextualSuggestion[] = []

  // Page-specific suggestions
  switch (context.page) {
    case 'risk-assessment':
      suggestions.push(
        {
          id: 'risk-assessment-tip-1',
          type: 'tip',
          title: 'Risk Impact Assessment',
          description:
            'Consider both financial and operational impacts when assessing risk severity. Use the impact matrix for consistent scoring.',
          priority: 'medium',
          context: 'risk-assessment',
          dismissible: true,
        },
        {
          id: 'risk-assessment-action-1',
          type: 'action',
          title: 'Import Risk Templates',
          description:
            'Speed up your assessment by importing pre-built risk templates for your industry.',
          priority: 'high',
          context: 'risk-assessment',
          action: {
            label: 'Browse Templates',
            handler: () => console.log('Opening risk templates'),
          },
          dismissible: true,
        }
      )

      if (context.timeSpent && context.timeSpent > 300) {
        // 5 minutes
        suggestions.push({
          id: 'risk-assessment-break',
          type: 'info',
          title: 'Take a Break',
          description:
            "You've been working on this assessment for a while. Consider saving your progress and taking a short break.",
          priority: 'low',
          context: 'risk-assessment',
          dismissible: true,
        })
      }
      break;

    case 'compliance-review':
      suggestions.push(
        {
          id: 'compliance-checklist',
          type: 'action',
          title: 'Use Compliance Checklist',
          description:
            "Ensure you don't miss any requirements by using our comprehensive compliance checklist.",
          priority: 'high',
          context: 'compliance-review',
          action: {
            label: 'Open Checklist',
            handler: () => console.log('Opening compliance checklist'),
          },
          dismissible: true,
        },
        {
          id: 'compliance-deadline',
          type: 'warning',
          title: 'Upcoming Deadline',
          description:
            'GDPR compliance review is due in 5 days. Make sure to complete all required sections.',
          priority: 'high',
          context: 'compliance-review',
          dismissible: false,
          persistent: true,
        }
      );
      break;

    case 'dashboard':
      suggestions.push(
        {
          id: 'dashboard-overview',
          type: 'tip',
          title: 'Dashboard Overview',
          description:
            'Click on any metric to drill down into detailed analysis. Use filters to focus on specific time periods or categories.',
          priority: 'medium',
          context: 'dashboard',
          dismissible: true,
        },
        {
          id: 'dashboard-export',
          type: 'shortcut',
          title: 'Quick Export',
          description: 'Press Ctrl+E to quickly export the current dashboard view as a PDF report.',
          priority: 'low',
          context: 'dashboard',
          dismissible: true,
        }
      );
      break;

    case 'audit-preparation':
      suggestions.push(
        {
          id: 'audit-documentation',
          type: 'action',
          title: 'Document Collection',
          description:
            'Gather all required documentation before the audit. Use our document checklist to ensure completeness.',
          priority: 'high',
          context: 'audit-preparation',
          action: {
            label: 'View Checklist',
            handler: () => console.log('Opening audit document checklist'),
          },
          dismissible: true,
        },
        {
          id: 'audit-timeline',
          type: 'info',
          title: 'Audit Timeline',
          description:
            'Your audit is scheduled for next week. Make sure all team members are prepared and available.',
          priority: 'medium',
          context: 'audit-preparation',
          dismissible: true,
        }
      );
      break;
  }

  // Role-specific suggestions
  if (context.userRole === 'risk-manager') {
    suggestions.push({
      id: 'risk-manager-insight',
      type: 'info',
      title: 'Risk Manager Insight',
      description:
        'As a risk manager, you have access to advanced analytics and reporting features. Check the Analytics tab for detailed insights.',
      priority: 'medium',
      context: 'role-specific',
      dismissible: true,
    })
  }

  // Task-specific suggestions
  if (context.currentTask === 'creating-risk') {
    suggestions.push({
      id: 'risk-creation-help',
      type: 'tip',
      title: 'Creating Effective Risk Descriptions',
      description:
        'Use clear, specific language when describing risks. Include potential causes, impacts, and affected stakeholders.',
      priority: 'high',
      context: 'task-specific',
      dismissible: true,
    })
  }

  // Form-specific suggestions
  if (context.formData) {
    if (context.formData.riskScore && context.formData.riskScore > 80) {
      suggestions.push({
        id: 'high-risk-warning',
        type: 'warning',
        title: 'High Risk Score Detected',
        description:
          'This risk has a high score. Consider implementing immediate mitigation measures and escalating to senior management.',
        priority: 'high',
        context: 'form-validation',
        dismissible: false,
      })
    }
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

export const ContextualAssistant: React.FC<ContextualAssistantProps> = ({
  context,
  position = 'floating',
  isMinimized = false,
  onMinimize,
  onExpand,
  className = '',
}) => {
  const [suggestions, setSuggestions] = useState<ContextualSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [isVisible, setIsVisible] = useState(true);
  const assistantRef = useRef<HTMLDivElement>(null);

  // Load contextual suggestions
  useEffect(() => {
    const loadSuggestions = async () => {
      setIsLoading(true)
      try {
        // Simulate AI processing time
        await new Promise((resolve) => setTimeout(resolve, 800))
        const contextualSuggestions = generateContextualSuggestions(context);
        setSuggestions(contextualSuggestions);
      } catch (error) {
        // console.error('Failed to load contextual suggestions:', error)
      } finally {
        setIsLoading(false);
      }
    }

    loadSuggestions();
  }, [context]);

  // Auto-hide after inactivity (for floating position)
  useEffect(() => {
    if (position === 'floating') {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 30000); // Hide after 30 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [position, suggestions]);

  const handleDismissSuggestion = (suggestionId: string) => {
    setDismissedSuggestions((prev) => new Set([...prev, suggestionId]));
  }

  const handleSuggestionAction = (suggestion: ContextualSuggestion) => {
    if (suggestion.action) {
      suggestion.action.handler();
    }
  }

  const getTypeIcon = (_type: string) => {
    switch (type) {
      case 'tip':
        return StatusIcons.Info;
      case 'action':
        return ActionIcons.Plus;
      case 'warning':
        return StatusIcons.AlertTriangle;
      case 'info':
        return StatusIcons.Info;
      case 'shortcut':
        return ActionIcons.Plus;
      default:
        return StatusIcons.Info;
    }
  }

  const getTypeColor = (_type: string) => {
    switch (type) {
      case 'tip':
        return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'action':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'warning':
        return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'info':
        return 'text-gray-700 bg-gray-100 border-gray-200';
      case 'shortcut':
        return 'text-purple-700 bg-purple-100 border-purple-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  }

  const activeSuggestions = suggestions.filter(
    (s) => !dismissedSuggestions.has(s.id) && (s.persistent || !dismissedSuggestions.has(s.id))
  );

  if (!isVisible && position === 'floating') {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 flex items-center justify-center"
        aria-label="Show contextual assistant"
      >
        <StatusIcons.Info size="sm" />
      </button>
    );
  }

  const containerClasses = {
    floating: 'fixed bottom-4 right-4 w-80 max-h-96 z-50 shadow-lg',
    sidebar: 'w-full h-full',
    inline: 'w-full',
  }

  return (
    <div
      ref={assistantRef}
      className={`bg-white rounded-lg border border-gray-200 ${containerClasses[position]} ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <StatusIcons.Info size="sm" color="primary" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">AI Assistant</h3>
            <p className="text-xs text-gray-500">
              {context.page.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())} Help
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {position === 'floating' && (
            <>
              {!isMinimized && onMinimize && (
                <button
                  onClick={onMinimize}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  aria-label="Minimize assistant"
                >
                  <ActionIcons.Minus size="xs" />
                </button>
              )}
              <button
                onClick={() => setIsVisible(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                aria-label="Hide assistant"
              >
                <NavigationIcons.Close size="xs" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="p-4">
            <div className="animate-pulse">Loading...</div>
          </div>
        ) : activeSuggestions.length === 0 ? (
          <div className="p-4 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <StatusIcons.Info size="md" color="secondary" />
            </div>
            <p className="text-sm text-gray-500">No contextual suggestions available right now.</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {activeSuggestions.map((suggestion) => {
              const IconComponent = getTypeIcon(suggestion.type);
              return (
                <div
                  key={suggestion.id}
                  className={`p-3 rounded-lg border ${getTypeColor(suggestion.type)}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                      <IconComponent size="xs" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm leading-tight">{suggestion.title}</h4>
                        {suggestion.dismissible && (
                          <button
                            onClick={() => handleDismissSuggestion(suggestion.id)}
                            className="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
                            aria-label="Dismiss suggestion"
                          >
                            <NavigationIcons.Close size="xs" />
                          </button>
                        )}
                      </div>

                      <p className="text-xs mt-1 leading-relaxed">{suggestion.description}</p>

                      {suggestion.action && (
                        <button
                          onClick={() => handleSuggestionAction(suggestion)}
                          className="mt-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-white bg-opacity-50 hover:bg-opacity-75 rounded border border-current border-opacity-30 transition-colors"
                        >
                          {suggestion.action.label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {activeSuggestions.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {activeSuggestions.length} suggestion{activeSuggestions.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setDismissedSuggestions(new Set())}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Reset dismissed
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContextualAssistant;
