import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ConversationMessage, 
  AgentType, 
  AIError 
} from '@/types/ai.types';
import { Risk, Control, Document } from '@/types';
import { useAI } from '@/context/AIContext';
import { useAuth } from '@/context/AuthContext';
import { generateId } from '@/lib/utils';

export interface RiskContext {
  currentRisk?: Risk;
  currentControl?: Control;
  currentDocument?: Document;
  relatedEntities: {
    risks: string[];
    controls: string[];
    documents: string[];
  };
  pageContext?: {
    section: string;
    data: Record<string, unknown>;
  };
}

export interface AISuggestion {
  id: string;
  type: 'action' | 'analysis' | 'recommendation' | 'explanation';
  title: string;
  description: string;
  action: () => Promise<void>;
  metadata?: Record<string, unknown>;
}

export interface ChatMessage extends ConversationMessage {
  isStreaming?: boolean;
  suggestions?: AISuggestion[];
  isError?: boolean;
  canRegenerate?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isConnected: boolean;
  currentStream: string;
  streamingMessageId: string | null;
  context: RiskContext;
  suggestions: AISuggestion[];
  error: AIError | null;
  typingIndicator: boolean;
  searchQuery: string;
  filteredMessages: ChatMessage[];
  conversationTemplates: ConversationTemplate[];
  rateLimitStatus: {
    requestsRemaining: number;
    tokensRemaining: number;
    resetTime: Date;
    isLimited: boolean;
  } | null;
}

export interface ConversationTemplate {
  id: string;
  title: string;
  description: string;
  initialMessage: string;
  category: 'risk_analysis' | 'control_design' | 'compliance' | 'general';
  context?: Partial<RiskContext>;
}

export interface ChatActions {
  sendMessage: (content: string, attachments?: MessageAttachment[]) => Promise<void>;
  regenerateMessage: (messageId: string) => Promise<void>;
  applySuggestion: (suggestion: AISuggestion) => Promise<void>;
  startVoiceInput: () => void;
  stopVoiceInput: () => void;
  uploadFiles: (files: File[]) => Promise<void>;
  searchMessages: (query: string) => void;
  clearSearch: () => void;
  exportConversation: (format: 'json' | 'pdf' | 'markdown') => Promise<void>;
  setContext: (context: Partial<RiskContext>) => void;
  useTemplate: (template: ConversationTemplate) => void;
  clearMessages: () => void;
  switchAgent: (agentType: AgentType) => void;
  clearError: () => void;
}

interface MessageAttachment {
  id: string;
  type: 'file' | 'risk' | 'control' | 'document';
  name: string;
  data: unknown;
  url?: string;
}

// Default conversation templates
const defaultTemplates: ConversationTemplate[] = [
  {
    id: 'risk-assessment',
    title: 'Risk Assessment',
    description: 'Analyze and assess a specific risk',
    initialMessage: 'I need help analyzing a risk. Can you guide me through the assessment process?',
    category: 'risk_analysis',
  },
  {
    id: 'control-design',
    title: 'Control Design',
    description: 'Design effective controls for risk mitigation',
    initialMessage: 'I need to design controls for a specific risk. What approach should I take?',
    category: 'control_design',
  },
  {
    id: 'compliance-check',
    title: 'Compliance Review',
    description: 'Review compliance requirements and gaps',
    initialMessage: 'I need help reviewing our compliance status. Can you help identify requirements and gaps?',
    category: 'compliance',
  },
  {
    id: 'general-consultation',
    title: 'General Consultation',
    description: 'General risk management consultation',
    initialMessage: 'Hello ARIA! I have some questions about risk management. Can you help?',
    category: 'general',
  },
];

export function useARIAChat(initialContext?: RiskContext) {
  const { 
    sendMessage: aiSendMessage, 
    selectedAgent, 
    switchAgent: aiSwitchAgent,
    currentConversation,
    startConversation,
    isLoading: aiLoading,
    error: aiError
  } = useAI();
  const { user } = useAuth();

  // State
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    isConnected: true,
    currentStream: '',
    streamingMessageId: null,
    context: initialContext || {
      relatedEntities: { risks: [], controls: [], documents: [] }
    },
    suggestions: [],
    error: null,
    typingIndicator: false,
    searchQuery: '',
    filteredMessages: [],
    conversationTemplates: defaultTemplates,
    rateLimitStatus: null,
  });

  // Refs for managing streaming and voice
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize conversation when context changes
  useEffect(() => {
    if (initialContext && !currentConversation) {
      startConversation(selectedAgent, {
        currentRisk: initialContext.currentRisk,
        currentControl: initialContext.currentControl,
        workingSet: initialContext.relatedEntities,
        preferences: {
          detailLevel: 'detailed',
          includeReferences: true,
          generateVisuals: false,
        },
      });
    }
  }, [initialContext, currentConversation, startConversation, selectedAgent]);

  // Update messages from AI context
  useEffect(() => {
    if (currentConversation) {
      const chatMessages: ChatMessage[] = currentConversation.messages.map((msg: any) => ({
        ...msg,
        canRegenerate: msg.role === 'assistant',
        suggestions: msg.role === 'assistant' ? generateSuggestions(msg) : undefined,
      }));
      
      setState(prev => ({
        ...prev,
        messages: chatMessages,
        filteredMessages: prev.searchQuery ? 
          chatMessages.filter(msg => 
            msg.content.toLowerCase().includes(prev.searchQuery.toLowerCase())
          ) : chatMessages,
      }));
    }
  }, [currentConversation]);

  // Update loading state
  useEffect(() => {
    setState(prev => ({ ...prev, isLoading: aiLoading }));
  }, [aiLoading]);

  // Update error state
  useEffect(() => {
    setState(prev => ({ ...prev, error: aiError }));
  }, [aiError]);

  // Generate suggestions based on message content
  const generateSuggestions = useCallback((message: ConversationMessage): AISuggestion[] => {
    const suggestions: AISuggestion[] = [];

    if (message.content.includes('risk') || message.content.includes('assessment')) {
      suggestions.push({
        id: generateId('suggestion'),
        type: 'analysis',
        title: 'Analyze Risk',
        description: 'Get detailed risk analysis',
        action: async () => {
          // Implementation would call risk analysis
        },
      });
    }

    if (message.content.includes('control') || message.content.includes('mitigation')) {
      suggestions.push({
        id: generateId('suggestion'),
        type: 'recommendation',
        title: 'Recommend Controls',
        description: 'Get control recommendations',
        action: async () => {
          // Implementation would call control recommendations
        },
      });
    }

    suggestions.push({
      id: generateId('suggestion'),
      type: 'explanation',
      title: 'Explain Further',
      description: 'Get more detailed explanation',
      action: async () => {
        // Implementation would request explanation
      },
    });

    return suggestions;
  }, []);

  // Chat Actions
  const sendMessage = useCallback(async (content: string, attachments?: MessageAttachment[]) => {
    if (!user || !content.trim()) return;

    setState(prev => ({ ...prev, isLoading: true, typingIndicator: true }));

    try {
      // Add user message immediately
      const userMessage: ChatMessage = {
        id: generateId('msg'),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
        attachments: attachments?.map(att => ({
          id: att.id,
          type: att.type as 'risk' | 'control' | 'document' | 'chart' | 'report',
          title: att.name,
          data: att.data,
          url: att.url,
        })),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage],
      }));

      // Send to AI service
      await aiSendMessage(content, userMessage.attachments);

    } catch (error) {
      console.error('Failed to send message:', error);
      setState(prev => ({
        ...prev,
        error: error as AIError,
      }));
    } finally {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        typingIndicator: false 
      }));
    }
  }, [user, aiSendMessage]);

  const regenerateMessage = useCallback(async (messageId: string) => {
    const messageIndex = state.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1 || messageIndex === 0) return;

    const previousMessage = state.messages[messageIndex - 1];
    if (previousMessage.role !== 'user') return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Remove the AI message to be regenerated
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(msg => msg.id !== messageId),
      }));

      // Resend the previous user message
      await aiSendMessage(previousMessage.content, previousMessage.attachments);

    } catch (error) {
      console.error('Failed to regenerate message:', error);
      setState(prev => ({ ...prev, error: error as AIError }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.messages, aiSendMessage]);

  const applySuggestion = useCallback(async (suggestion: AISuggestion) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await suggestion.action();
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
      setState(prev => ({ ...prev, error: error as AIError }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Voice functionality
  const startVoiceInput = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      sendMessage(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, [sendMessage]);

  const stopVoiceInput = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  // File upload
  const uploadFiles = useCallback(async (files: File[]) => {
    const attachments: MessageAttachment[] = [];

    for (const file of files) {
      const attachment: MessageAttachment = {
        id: generateId('attachment'),
        type: 'file',
        name: file.name,
        data: file,
      };

      // For documents, create a data URL for preview
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        attachment.url = URL.createObjectURL(file);
      }

      attachments.push(attachment);
    }

    await sendMessage(`Uploaded ${files.length} file(s): ${files.map(f => f.name).join(', ')}`, attachments);
  }, [sendMessage]);

  // Search functionality
  const searchMessages = useCallback((query: string) => {
    setState(prev => {
      const filteredMessages = query.trim() ? 
        prev.messages.filter(msg =>
          msg.content.toLowerCase().includes(query.toLowerCase())
        ) : prev.messages;

      return {
        ...prev,
        searchQuery: query,
        filteredMessages,
      };
    });
  }, []);

  const clearSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchQuery: '',
      filteredMessages: prev.messages,
    }));
  }, []);

  // Export functionality
  const exportConversation = useCallback(async (format: 'json' | 'pdf' | 'markdown') => {
    const messages = state.messages;
    
    switch (format) {
      case 'json': {
        const jsonData = JSON.stringify(messages, null, 2);
        downloadFile(jsonData, 'conversation.json', 'application/json');
        break;
      }
        
      case 'markdown': {
        const markdown = messages.map(msg => 
          `## ${msg.role === 'user' ? 'You' : 'ARIA'} (${msg.timestamp.toLocaleString()})\n\n${msg.content}\n\n`
        ).join('---\n\n');
        downloadFile(markdown, 'conversation.md', 'text/markdown');
        break;
      }
        
      case 'pdf':
        // Would implement PDF generation here
        console.log('PDF export not yet implemented');
        break;
    }
  }, [state.messages]);

  // Utility function for file download
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Context management
  const setContext = useCallback((newContext: Partial<RiskContext>) => {
    setState(prev => ({
      ...prev,
      context: { ...prev.context, ...newContext },
    }));
  }, []);

  // Template usage
  const useTemplate = useCallback((template: ConversationTemplate) => {
    if (template.context) {
      setContext(template.context);
    }
    sendMessage(template.initialMessage);
  }, [setContext, sendMessage]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      filteredMessages: [],
      currentStream: '',
      streamingMessageId: null,
    }));
  }, []);

  // Switch agent
  const switchAgent = useCallback((agentType: AgentType) => {
    aiSwitchAgent(agentType);
  }, [aiSwitchAgent]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  const actions: ChatActions = {
    sendMessage,
    regenerateMessage,
    applySuggestion,
    startVoiceInput,
    stopVoiceInput,
    uploadFiles,
    searchMessages,
    clearSearch,
    exportConversation,
    setContext,
    useTemplate,
    clearMessages,
    switchAgent,
    clearError: () => {
      setState(prev => ({ ...prev, error: null }));
    },
  };

  return {
    state,
    actions,
    agent: selectedAgent,
  };
}

// Extend Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
} 