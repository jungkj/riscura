'use client';

import React, { useState, useRef, useEffect } from 'react';
import { designTokens } from '@/lib/design-system/tokens';
// import {
  ActionIcons,
  StatusIcons,
  NavigationIcons,
  RiskManagementIcons,
  CommunicationIcons,
  DataIcons,
  TimeIcons,
} from '@/components/icons/IconLibrary';
import { LoadingStates, DotsLoading } from '@/components/states/LoadingState';
import { EmptyStates } from '@/components/states/EmptyState';

// Smart features configuration
const smartFeatures = {
  suggestedPrompts: [
    {
      id: 'analyze-risks',
      text: 'Analyze current high-risk items',
      category: 'risk-analysis',
      icon: RiskManagementIcons.Risk,
      description: 'Get AI insights on your highest priority risks',
    },
    {
      id: 'compliance-summary',
      text: 'Generate compliance summary',
      category: 'compliance',
      icon: RiskManagementIcons.Compliance,
      description: 'Review your compliance status across all frameworks',
    },
    {
      id: 'control-improvements',
      text: 'Recommend control improvements',
      category: 'controls',
      icon: RiskManagementIcons.Control,
      description: 'Discover ways to strengthen your risk controls',
    },
    {
      id: 'trend-analysis',
      text: 'Show risk trends over time',
      category: 'analytics',
      icon: DataIcons.TrendingUp,
      description: 'Analyze how your risk profile has changed',
    },
    {
      id: 'audit-preparation',
      text: 'Help prepare for upcoming audit',
      category: 'audit',
      icon: RiskManagementIcons.Audit,
      description: 'Get guidance on audit readiness and documentation',
    },
    {
      id: 'regulatory-updates',
      text: 'What are the latest regulatory changes?',
      category: 'regulatory',
      icon: StatusIcons.Info,
      description: 'Stay informed about relevant regulatory developments',
    },
  ],
  contextualAssistance: {
    riskAssessment: {
      title: 'Risk Assessment AI Assistant',
      description:
        'AI can help assess impact and likelihood based on industry data and best practices',
      capabilities: [
        'Impact scoring based on business context',
        'Likelihood assessment using historical data',
        'Risk categorization and prioritization',
        'Mitigation strategy recommendations',
      ],
    },
    complianceReview: {
      title: 'Compliance Review AI Assistant',
      description: 'AI can identify gaps and suggest improvements for regulatory compliance',
      capabilities: [
        'Gap analysis across frameworks',
        'Control effectiveness evaluation',
        'Remediation action planning',
        'Evidence collection guidance',
      ],
    },
    auditPreparation: {
      title: 'Audit Preparation AI Assistant',
      description: 'AI can help organize documentation and identify potential audit findings',
      capabilities: [
        'Documentation completeness check',
        'Control testing preparation',
        'Finding prediction and prevention',
        'Audit trail optimization',
      ],
    },
  },
  quickActions: [
    { id: 'export-chat', label: 'Export Chat', icon: ActionIcons.Download },
    { id: 'share-insights', label: 'Share Insights', icon: CommunicationIcons.Share },
    { id: 'save-analysis', label: 'Save Analysis', icon: ActionIcons.Save },
    { id: 'schedule-followup', label: 'Schedule Follow-up', icon: TimeIcons.Calendar },
  ],
}

// Message types
interface ChatMessage {
  id: string
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    category?: string;
    confidence?: number;
    sources?: string[];
    actions?: Array<{
      id: string;
      label: string;
      action: () => void;
    }>;
  }
}

type ARIAContext = 'dashboard' | 'risk-assessment' | 'compliance' | 'audit' | 'general';

interface ARIAChatProps {
  context?: 'dashboard' | 'risk-assessment' | 'compliance' | 'audit' | 'general';
  initialPrompt?: string;
  onInsightGenerated?: (insight: any) => void;
  className?: string;
}

export const ARIAChat: React.FC<ARIAChatProps> = ({
  context = 'general',
  initialPrompt,
  onInsightGenerated,
  className = '',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'assistant',
        content: getWelcomeMessage(context),
        timestamp: new Date(),
        metadata: {
          category: 'welcome',
        },
      }
      setMessages([welcomeMessage]);
    }
  }, [context, messages.length]);

  // Handle initial prompt
  useEffect(() => {
    if (initialPrompt && messages.length === 1) {
      handleSendMessage(initialPrompt)
    }
  }, [initialPrompt, messages.length]);

  const getWelcomeMessage = (_context: ARIAContext): string => {
    const contextMessages = {
      'risk-assessment':
        "Hi! I'm ARIA, your AI risk assessment assistant. I can help you analyze risks, assess impact and likelihood, and recommend mitigation strategies. What would you like to explore?",
      compliance:
        "Hello! I'm ARIA, your AI compliance assistant. I can help you review compliance status, identify gaps, and suggest improvements across your frameworks. How can I assist you today?",
      audit:
        "Welcome! I'm ARIA, your AI audit assistant. I can help you prepare for audits, organize documentation, and identify potential findings. What audit-related task can I help with?",
      dashboard:
        "Hi there! I'm ARIA, your AI risk management assistant. I can provide insights on your current risk posture, compliance status, and recommend actions. What insights would you like?",
      general:
        "Hello! I'm ARIA, your AI-powered risk management assistant. I'm here to help you with risk analysis, compliance reviews, audit preparation, and strategic insights. How can I help you today?",
    }
    return contextMessages[context] || contextMessages.general;
  }

  const handleSendMessage = async (message?: string) => {
    const messageText = message || inputValue.trim();
    if (!messageText) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: messageText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Simulate AI response (replace with actual API call)
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const aiResponse = await generateAIResponse(messageText, context);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(),
        metadata: aiResponse.metadata,
      }

      setMessages((prev) => [...prev, assistantMessage]);

      // Trigger insight callback if provided
      if (onInsightGenerated && aiResponse.metadata?.category !== 'general') {
        onInsightGenerated(aiResponse)
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'system',
        content:
          "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date(),
        metadata: { category: 'error' },
      }
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  const generateAIResponse = async (prompt: string, context: string) => {
    // This would be replaced with actual AI API integration
    const responses = {
      'analyze-risks': {
        content: `Based on your current risk register, I've identified 3 high-priority risks that need immediate attention:

**1. Data Security Risk (Critical)**
- Current likelihood: High (85%)
- Business impact: Severe ($2.5M potential loss)
- Recommendation: Implement multi-factor authentication and conduct security audit

**2. Regulatory Compliance Gap (High)**
- Current status: 78% compliant with GDPR requirements
- Key gaps: Data retention policies, consent management
- Recommendation: Update privacy policies and implement consent tracking

**3. Third-Party Vendor Risk (Medium-High)**
- 12 vendors lack current security assessments
- Potential supply chain disruption risk
- Recommendation: Conduct vendor security reviews within 30 days

Would you like me to dive deeper into any of these risks or help you create action plans?`,
        metadata: {
          category: 'risk-analysis',
          confidence: 0.92,
          sources: ['Risk Register', 'Compliance Dashboard', 'Vendor Database'],
          actions: [
            { id: 'create-action-plan', label: 'Create Action Plan', action: () => {} },
            { id: 'schedule-review', label: 'Schedule Risk Review', action: () => {} },
          ],
        },
      },
      'compliance-summary': {
        content: `Here's your current compliance status across all frameworks:

**Overall Compliance Score: 82%** ⬆️ (+5% from last month)

**Framework Breakdown:**
- **ISO 27001**: 89% compliant ✅ (Target: 95%)
- **GDPR**: 78% compliant ⚠️ (Target: 100%)
- **SOX**: 85% compliant ✅ (Target: 90%)
- **HIPAA**: 92% compliant ✅ (Target: 95%)

**Priority Actions:**
1. **GDPR Gaps** (Due: 2 weeks)
   - Update data retention policies
   - Implement consent management system
   
2. **ISO 27001 Improvements** (Due: 1 month)
   - Complete security awareness training
   - Update incident response procedures

**Upcoming Deadlines:**
- GDPR compliance review: March 15
- SOX quarterly assessment: March 30

Would you like detailed remediation plans for any specific framework?`,
        metadata: {
          category: 'compliance',
          confidence: 0.95,
          sources: ['Compliance Dashboard', 'Framework Assessments', 'Audit Reports'],
          actions: [
            { id: 'generate-report', label: 'Generate Full Report', action: () => {} },
            { id: 'create-remediation-plan', label: 'Create Remediation Plan', action: () => {} },
          ],
        },
      },
      'control-improvements': {
        content: `I've analyzed your current controls and identified several improvement opportunities:

**High-Impact Improvements:**

**1. Automated Monitoring Enhancement**
- Current: Manual log reviews weekly
- Recommended: Real-time SIEM implementation
- Expected benefit: 75% faster threat detection
- Investment: $15K, ROI: 6 months

**2. Access Control Strengthening**
- Current: Role-based access with annual reviews
- Recommended: Privileged access management + quarterly reviews
- Expected benefit: 60% reduction in access-related incidents
- Investment: $25K, ROI: 8 months

**3. Incident Response Automation**
- Current: Manual incident escalation
- Recommended: Automated workflow with AI triage
- Expected benefit: 50% faster response times
- Investment: $10K, ROI: 4 months

**Quick Wins (Low Cost, High Impact):**
- Enable MFA for all admin accounts (2 days)
- Implement automated backup verification (1 week)
- Update security awareness training content (1 week)

Which improvements would you like to prioritize?`,
        metadata: {
          category: 'controls',
          confidence: 0.88,
          sources: ['Control Assessments', 'Industry Benchmarks', 'Cost-Benefit Analysis'],
          actions: [
            { id: 'prioritize-improvements', label: 'Create Priority Matrix', action: () => {} },
            { id: 'estimate-costs', label: 'Get Cost Estimates', action: () => {} },
          ],
        },
      },
    }

    // Simple keyword matching for demo (replace with actual AI)
    const lowerPrompt = prompt.toLowerCase()
    if (lowerPrompt.includes('risk') && lowerPrompt.includes('high')) {
      return responses['analyze-risks'];
    } else if (lowerPrompt.includes('compliance') || lowerPrompt.includes('summary')) {
      return responses['compliance-summary'];
    } else if (lowerPrompt.includes('control') || lowerPrompt.includes('improve')) {
      return responses['control-improvements'];
    }

    // Default response
    return {
      content: `I understand you're asking about "${prompt}". Let me help you with that.

Based on your current context, I can assist with:
- Risk analysis and assessment
- Compliance status reviews
- Control effectiveness evaluation
- Audit preparation guidance
- Strategic recommendations

Could you provide more specific details about what you'd like to explore? For example:
- Which risks are you most concerned about?
- What compliance frameworks are you focusing on?
- Are there specific controls you'd like to improve?`,
      metadata: {
        category: 'general',
        confidence: 0.7,
        sources: ['General Knowledge Base'],
      },
    }
  }

  const handleSuggestedPrompt = (prompt: any) => {
    setInputValue(prompt.text);
    handleSendMessage(prompt.text);
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  const filteredPrompts = selectedCategory
    ? smartFeatures.suggestedPrompts.filter((p) => p.category === selectedCategory)
    : smartFeatures.suggestedPrompts;

  const _categories = [...new Set(smartFeatures.suggestedPrompts.map((p) => p.category))];

  const getContextualGreeting = (_context: ARIAContext): string => {
    const contextMessages: { [key in ARIAContext]: string } = {
      'risk-assessment':
        'Welcome! I can help you with risk identification, assessment, and mitigation strategies.',
      compliance:
        "Hi! I'm here to assist with compliance frameworks, requirements, and assessment questions.",
      audit:
        'Hello! I can help you prepare for audits, understand requirements, and track findings.',
      dashboard: 'Welcome! I can help you interpret your dashboard data and provide insights.',
      general:
        "Hello! I'm ARIA, your AI assistant for risk management and compliance. How can I help you today?",
    }

    return contextMessages[context] || contextMessages.general;
  }

  const getContextKey = (_context: ARIAContext): keyof typeof smartFeatures.contextualAssistance => {
    const contextMap: Record<ARIAContext, keyof typeof smartFeatures.contextualAssistance> = {
      'risk-assessment': 'riskAssessment',
      compliance: 'complianceReview',
      audit: 'auditPreparation',
      dashboard: 'riskAssessment', // fallback
      general: 'riskAssessment', // fallback
    }

    return contextMap[context] || 'riskAssessment';
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <StatusIcons.Info size="sm" color="primary" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">ARIA AI Assistant</h3>
            <p className="text-xs text-gray-500">
              {smartFeatures.contextualAssistance[getContextKey(context)]?.title ||
                'AI-Powered Risk Management'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
            aria-label={isExpanded ? 'Collapse chat' : 'Expand chat'}
          >
            {isExpanded ? (
              <NavigationIcons.ChevronUp size="sm" />
            ) : (
              <NavigationIcons.ChevronDown size="sm" />
            )}
          </button>
        </div>
      </div>

      {/* Context Info */}
      {smartFeatures.contextualAssistance[getContextKey(context)] && (
        <div className="p-4 bg-blue-50 border-b border-blue-100">
          <p className="text-sm text-blue-800 mb-2">
            {smartFeatures.contextualAssistance[getContextKey(context)].description}
          </p>
          <div className="flex flex-wrap gap-2">
            {smartFeatures.contextualAssistance[getContextKey(context)].capabilities.map(
              (capability: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {capability}
                </span>
              )
            )}
          </div>
        </div>
      )}

      {/* Suggested Prompts */}
      {messages.length <= 1 && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">Suggested Questions</h4>
            <div className="flex space-x-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  !selectedCategory
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors capitalize ${
                    selectedCategory === category
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {filteredPrompts.slice(0, 3).map((prompt) => (
              <button
                key={prompt.id}
                onClick={() => handleSuggestedPrompt(prompt)}
                className="flex items-start space-x-3 p-3 text-left rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <prompt.icon size="sm" color="secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-blue-900">
                    {prompt.text}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{prompt.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className={`${isExpanded ? 'h-96' : 'h-64'} overflow-y-auto p-4 space-y-4`}>
        {messages.length === 0 ? (
          <EmptyStates.NoData
            title="Start a conversation"
            description="Ask me anything about risk management, compliance, or audit preparation."
          />
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.type === 'system'
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>

                {/* Message metadata */}
                {message.metadata && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    {/* Confidence score */}
                    {message.metadata.confidence && (
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs text-gray-500">Confidence:</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-green-500 h-1.5 rounded-full"
                            style={{ width: `${message.metadata.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {Math.round(message.metadata.confidence * 100)}%
                        </span>
                      </div>
                    )}

                    {/* Sources */}
                    {message.metadata.sources && (
                      <div className="mb-2">
                        <span className="text-xs text-gray-500 block mb-1">Sources:</span>
                        <div className="flex flex-wrap gap-1">
                          {message.metadata.sources.map((source, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-700"
                            >
                              {source}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {message.metadata.actions && (
                      <div className="flex flex-wrap gap-2">
                        {message.metadata.actions.map((action) => (
                          <button
                            key={action.id}
                            onClick={action.action}
                            className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="text-xs text-gray-400 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}

        {Boolean(isLoading) && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <DotsLoading size="sm" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about risks, compliance, audits, or controls..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <CommunicationIcons.MessageSquare size="sm" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex space-x-2">
            {smartFeatures.quickActions.map((action) => (
              <button
                key={action.id}
                className="inline-flex items-center space-x-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <action.icon size="xs" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-400">Press Enter to send, Shift+Enter for new line</div>
        </div>
      </div>
    </div>
  );
}

export default ARIAChat;
