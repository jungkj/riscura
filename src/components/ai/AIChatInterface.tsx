'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyScrollArea } from '@/components/ui/DaisyScrollArea';
import { DaisyDialog, DaisyDialogContent, DaisyDialogHeader, DaisyDialogTitle } from '@/components/ui/DaisyDialog';
// import {
  Bot,
  User,
  Send,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Shield,
  Target,
  BarChart3,
  FileText,
  Download,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Zap,
  Brain,
  MessageSquare,
  X,
} from 'lucide-react';

// Types
interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  attachments?: ChatAttachment[];
  suggestions?: string[];
  actions?: ChatAction[];
  thinking?: boolean;
  error?: boolean;
}

interface ChatAttachment {
  id: string;
  type: 'chart' | 'report' | 'prediction' | 'recommendation';
  title: string;
  data: any;
}

interface ChatAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary';
  action: string;
}

interface AISuggestion {
  id: string;
  text: string;
  category: 'risk' | 'control' | 'compliance' | 'analysis';
  icon: any;
}

// Sample AI Suggestions
const aiSuggestions: AISuggestion[] = [
  {
    id: 'sug-1',
    text: 'Show me the top 5 risks with highest scores',
    category: 'risk',
    icon: AlertTriangle,
  },
  {
    id: 'sug-2',
    text: 'What controls need testing this month?',
    category: 'control',
    icon: Shield,
  },
  {
    id: 'sug-3',
    text: 'Generate SOC 2 compliance report',
    category: 'compliance',
    icon: Target,
  },
  {
    id: 'sug-4',
    text: 'Analyze risk trends for last quarter',
    category: 'analysis',
    icon: TrendingUp,
  },
];

// Sample Chat Responses
const sampleResponses = {
  'risks': {
    content: `Based on your current risk register, here are the top 5 risks with highest scores:

**1. Data Breach (RSK-001)** - Score: 20 (Critical)
- Impact: Very High (5)
- Likelihood: High (4)
- Status: Open
- Last Updated: 2 days ago

**2. Unauthorized Access (RSK-002)** - Score: 16 (High)
- Impact: High (4)
- Likelihood: High (4)
- Status: In Progress
- Last Updated: 1 week ago

**3. Compliance Violation (RSK-003)** - Score: 15 (High)
- Impact: Very High (5)
- Likelihood: Medium (3)
- Status: Open
- Last Updated: 3 days ago

**4. System Outage (RSK-004)** - Score: 12 (Medium)
- Impact: High (4)
- Likelihood: Medium (3)
- Status: Monitoring
- Last Updated: 5 days ago

**5. Vendor Security (RSK-005)** - Score: 10 (Medium)
- Impact: Medium (2)
- Likelihood: Very High (5)
- Status: Open
- Last Updated: 1 day ago

Would you like me to analyze mitigation strategies for any of these risks?`,
    actions: [
      { id: 'act-1', label: 'Analyze Mitigations', type: 'primary' as const, action: 'analyze_mitigations' },
      { id: 'act-2', label: 'Export Report', type: 'secondary' as const, action: 'export_risks' },
    ],
  },
  'controls': {
    content: `Here are the controls requiring testing this month:

**Immediate Testing Required (Overdue):**
• CTL-001: Access Control Management (Due: Jan 15)
• CTL-003: Incident Response Procedures (Due: Jan 18)

**Testing Due This Month:**
• CTL-005: Data Backup Procedures (Due: Jan 25)
• CTL-007: Vendor Risk Assessment (Due: Jan 30)

**Upcoming Next Month:**
• CTL-002: Data Encryption Standards (Due: Feb 5)
• CTL-006: Business Continuity Plan (Due: Feb 12)

**Testing Summary:**
- Total Controls: 15
- Overdue: 2 (13%)
- Due This Month: 4 (27%)
- Up to Date: 9 (60%)

I recommend prioritizing CTL-001 and CTL-003 immediately due to their critical nature and overdue status.`,
    actions: [
      { id: 'act-3', label: 'Schedule Testing', type: 'primary' as const, action: 'schedule_testing' },
      { id: 'act-4', label: 'View Calendar', type: 'secondary' as const, action: 'view_calendar' },
    ],
  },
  'compliance': {
    content: `Generating SOC 2 Type II compliance report...

**Executive Summary:**
Current SOC 2 compliance score: **67%** (Needs Improvement)

**Trust Services Criteria Performance:**
- Security: 85% ✅
- Availability: 72% ⚠️
- Processing Integrity: 58% ❌
- Confidentiality: 79% ⚠️
- Privacy: 45% ❌

**Key Findings:**
1. **Gap in CC1.2** - Communication of policies needs formal documentation
2. **CC2.1 Partial** - Information quality metrics not defined
3. **A1.1 Required** - Access request approval workflow needs automation

**Recommendations:**
1. Implement formal policy communication process (2 weeks)
2. Define and track information quality metrics (1 week)
3. Automate access request workflows (3 weeks)

**Timeline to Full Compliance:** 6-8 weeks with recommended actions`,
    actions: [
      { id: 'act-5', label: 'Download Report', type: 'primary' as const, action: 'download_report' },
      { id: 'act-6', label: 'View Action Plan', type: 'secondary' as const, action: 'view_actions' },
    ],
  },
  'trends': {
    content: `Risk trend analysis for Q4 2023:

**Overall Risk Landscape:**
- Average Risk Score: 3.2 (↑ 14% from Q3)
- Total Risks: 15 (↑ 2 new risks)
- Critical Risks: 3 (↑ 1 from Q3)
- Risk Velocity: +0.8 risks/month

**Key Trends:**
📈 **Increasing Risks:**
- Cybersecurity threats (↑ 45%)
- Compliance gaps (↑ 23%)
- Third-party vendor risks (↑ 18%)

📉 **Decreasing Risks:**
- Operational risks (↓ 12%)
- Financial risks (↓ 8%)

**Predictive Insights:**
Based on current trends, I predict:
- 2-3 new cybersecurity risks in Q1 2024
- Compliance score may drop below 65% without action
- Vendor risks will stabilize by March 2024

**Recommended Actions:**
1. Increase cybersecurity budget by 25%
2. Accelerate compliance gap remediation
3. Implement enhanced vendor risk monitoring`,
    actions: [
      { id: 'act-7', label: 'Detailed Analysis', type: 'primary' as const, action: 'detailed_analysis' },
      { id: 'act-8', label: 'Export Trends', type: 'secondary' as const, action: 'export_trends' },
    ],
  },
};

// Message Component
const ChatMessageComponent: React.FC<{
  message: ChatMessage;
  onAction: (_action: string) => void;
}> = ({ message, onAction }) => {
  const isUser = message.type === 'user';
  const isThinking = message.thinking;
  const hasError = message.error;

  return (
    <div className={cn(
      "flex gap-enterprise-3 mb-enterprise-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <Bot className="h-4 w-4 text-purple-600" />
          </div>
        </div>
      )}
      
      <div className={cn(
        "max-w-[80%] space-y-enterprise-2",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "rounded-lg px-enterprise-3 py-enterprise-2 text-body-sm",
          isUser 
            ? "bg-purple-600 text-white ml-auto" 
            : hasError
            ? "bg-red-50 border border-red-200 text-red-800"
            : "bg-surface-secondary text-text-primary border border-border"
        )}>
          {isThinking ? (
            <div className="flex items-center space-x-enterprise-2">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span className="text-caption">AI is thinking...</span>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
        </div>

        {/* Actions */}
        {message.actions && message.actions.length > 0 && !isThinking && (
          <div className="flex flex-wrap gap-enterprise-2">
            {message.actions.map((action) => (
              <DaisyButton
                key={action.id}
                size="sm"
                variant={action.type === 'primary' ? 'primary' : 'outline'}
                className={cn(
                  "h-6 px-enterprise-2",
                  action.type === 'primary' && "bg-purple-600 hover:bg-purple-700"
                )}
                onClick={() =>
          onAction(action.action)} />
                {action.label}
              
        </DaisyButton>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-enterprise-1">
            {message.suggestions.map((suggestion, index) => (
              <DaisyBadge
                key={index}
                variant="outline"
                className="text-caption cursor-pointer hover:bg-purple-50"
                onClick={() => onAction(`suggestion_${index}`)}
              >
                {suggestion}
              </DaisyBadge>
            ))}
          </div>
        )}

        {/* Timestamp and Feedback */}
        {!isUser && !isThinking && (
          <div className="flex items-center justify-between text-caption text-text-tertiary">
            <span>{message.timestamp.toLocaleTimeString()}</span>
            <div className="flex items-center space-x-enterprise-1">
              <DaisyButton variant="ghost" size="sm" className="h-4 w-4 p-0" >
  <ThumbsUp className="h-3 w-3" />
</DaisyButton>
              </DaisyButton>
              <DaisyButton variant="ghost" size="sm" className="h-4 w-4 p-0" >
  <ThumbsDown className="h-3 w-3" />
</DaisyButton>
              </DaisyButton>
              <DaisyButton variant="ghost" size="sm" className="h-4 w-4 p-0" >
  <Copy className="h-3 w-3" />
</DaisyButton>
              </DaisyButton>
            </div>
          </div>
        )}
      </div>

      {Boolean(isUser) && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
        </div>
      )}
    </div>
  );
};

// AI Chat Interface Component
export const AIChatInterface: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI assistant for risk and compliance management. I can help you analyze risks, review controls, check compliance status, and provide predictive insights. How can I assist you today?',
      timestamp: new Date(),
      suggestions: [
        'Show top risks',
        'Controls due for testing',
        'Compliance status',
        'Risk trends'
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async (_content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Add thinking message
    const thinkingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: '',
      timestamp: new Date(),
      thinking: true,
    };

    setMessages(prev => [...prev, thinkingMessage]);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Remove thinking message and add response
    setMessages(prev => prev.filter(m => !m.thinking));
    setIsTyping(false);

    // Generate AI response based on input
    let response = sampleResponses.risks; // default
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('risk') || lowerContent.includes('top')) {
      response = sampleResponses.risks;
    } else if (lowerContent.includes('control') || lowerContent.includes('testing')) {
      response = sampleResponses.controls;
    } else if (lowerContent.includes('compliance') || lowerContent.includes('soc')) {
      response = sampleResponses.compliance;
    } else if (lowerContent.includes('trend') || lowerContent.includes('analysis')) {
      response = sampleResponses.trends;
    }

    const aiResponse: ChatMessage = {
      id: (Date.now() + 2).toString(),
      type: 'ai',
      content: response.content,
      timestamp: new Date(),
      actions: response.actions,
    };

    setMessages(prev => [...prev, aiResponse]);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleAction = (_action: string) => {
    // console.log('Action triggered:', action);
    // Handle specific actions here
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <DaisyDialog open={isOpen} onOpenChange={onClose} >
        <DaisyDialogContent className="max-w-2xl h-[80vh] flex flex-col p-0" >
  <DaisyDialogHeader className="px-enterprise-4 py-enterprise-3 border-b border-border">
</DaisyDialog>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-enterprise-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Brain className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <DaisyDialogTitle className="text-body-base">AI Assistant</DaisyDialogTitle>
                <p className="text-caption text-text-secondary">Risk & Compliance Intelligence</p>
              </div>
            </div>
            <div className="flex items-center space-x-enterprise-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-caption text-text-secondary">Online</span>
            </div>
          </div>
        </DaisyDialogHeader>

        {/* Chat Messages */}
        <DaisyScrollArea ref={scrollAreaRef} className="flex-1 px-enterprise-4 py-enterprise-3" >
            <div className="space-y-enterprise-4">
            {messages.map((message) => (
              <ChatMessageComponent
                key={message.id}
                message={message}
                onAction={handleAction} />
            ))}
          </div>
        </DaisyScrollArea>

        {/* Quick Suggestions */}
        {messages.length <= 2 && (
          <div className="px-enterprise-4 py-enterprise-2 border-t border-border bg-surface-secondary">
            <div className="flex items-center space-x-enterprise-2 mb-enterprise-2">
              <Sparkles className="h-3 w-3 text-purple-500" />
              <span className="text-caption text-text-secondary">Try asking:</span>
            </div>
            <div className="grid grid-cols-2 gap-enterprise-2">
              {aiSuggestions.map((suggestion) => {
                const IconComponent = suggestion.icon;
                return (
                  <DaisyButton
                    key={suggestion.id}
                    variant="outline"
                    size="sm"
                    className="h-8 justify-start text-caption"
                    onClick={() => handleSuggestionClick(suggestion.text)} />
                    <IconComponent className="h-3 w-3 mr-enterprise-1" />
                    {suggestion.text}
                  </DaisyButton>
                );
              })}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="px-enterprise-4 py-enterprise-3 border-t border-border">
          <div className="flex items-center space-x-enterprise-2">
            <div className="flex-1 relative">
              <DaisyInput
                ref={inputRef}
                value={inputValue}
                onChange={(e) = />
setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about risks, controls, compliance, or trends..."
                className="pr-enterprise-10"
                disabled={isTyping} />
              {Boolean(inputValue) && (
                <DaisyButton
                  size="sm"
                  className="absolute right-enterprise-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 bg-purple-600 hover:bg-purple-700"
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={isTyping} />
                  <Send className="h-3 w-3" />
                </DaisyInput>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-enterprise-2 text-caption text-text-tertiary">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <div className="flex items-center space-x-enterprise-1">
              <Zap className="h-3 w-3" />
              <span>Powered by AI</span>
            </div>
          </div>
        </div>
      </DaisyDialogContent>
    </DaisyDialog>
  );
};

export default AIChatInterface;