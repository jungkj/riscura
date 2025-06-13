import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Send, 
  Search, 
  Mic, 
  MicOff, 
  Paperclip, 
  MoreVertical,
  Download,
  Trash2,
  MessageSquare,
  Bot,
  Minimize2,
  Maximize2,
  Sparkles
} from 'lucide-react';

import { useARIAChat, RiskContext, ConversationTemplate } from '@/hooks/useARIAChat';
import { AgentType } from '@/types/ai.types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAI } from '@/context/AIContext';

interface ARIAChatProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: RiskContext;
  mode: 'floating' | 'sidebar' | 'fullscreen';
  className?: string;
}

interface TypingIndicatorProps {
  isVisible: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100"
    >
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-[#199BEC] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-[#199BEC] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-[#199BEC] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-sm font-medium text-gray-600 font-inter">ARIA is thinking...</span>
    </motion.div>
  );
};

const ConversationTemplateCard: React.FC<{
  template: ConversationTemplate;
  onSelect: (template: ConversationTemplate) => void;
}> = ({ template, onSelect }) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'risk_analysis': return '🔍';
      case 'control_design': return '🛡️';
      case 'compliance': return '📋';
      default: return '💬';
    }
  };

  return (
    <Card 
      className="p-4 cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-200 bg-white hover:border-[#199BEC]/50"
      onClick={() => onSelect(template)}
    >
      <div className="flex items-start gap-4">
        <div className="text-2xl">{getCategoryIcon(template.category)}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-[#191919] font-inter mb-1">{template.title}</h3>
          <p className="text-xs text-gray-600 font-inter leading-relaxed mb-3">{template.description}</p>
          <Badge variant="secondary" className="text-xs font-medium">
            {template.category.replace('_', ' ')}
          </Badge>
        </div>
      </div>
    </Card>
  );
};

const AgentSelector: React.FC<{
  currentAgent: AgentType;
  onAgentChange: (agent: AgentType) => void;
}> = ({ currentAgent, onAgentChange }) => {
  const agents = [
    { value: 'general_assistant', label: 'General Assistant', icon: '🤖', description: 'General help and guidance' },
    { value: 'risk_analyzer', label: 'Risk Analyzer', icon: '🔍', description: 'Risk assessment and analysis' },
    { value: 'control_advisor', label: 'Control Advisor', icon: '🛡️', description: 'Control design and recommendations' },
    { value: 'compliance_expert', label: 'Compliance Expert', icon: '📋', description: 'Regulatory compliance guidance' },
  ] as const;

  return (
    <Select value={currentAgent} onValueChange={(value) => onAgentChange(value as AgentType)}>
      <SelectTrigger className="w-full">
        <SelectValue>
          <div className="flex items-center gap-2">
            <span>{agents.find(a => a.value === currentAgent)?.icon}</span>
            <span className="text-sm font-medium">{agents.find(a => a.value === currentAgent)?.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {agents.map((agent) => (
          <SelectItem key={agent.value} value={agent.value}>
            <div className="flex items-center gap-2">
              <span>{agent.icon}</span>
              <div>
                <p className="font-medium">{agent.label}</p>
                <p className="text-xs text-gray-500">{agent.description}</p>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export const ARIAChat: React.FC<ARIAChatProps> = ({
  isOpen,
  onClose,
  initialContext,
  mode,
  className,
}) => {
  const { state, actions, messagesEndRef } = useARIAChat(initialContext);
  const { selectedAgent } = useAI();
  const { toast } = useToast();
  
  // Local state
  const [inputValue, setInputValue] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Refs
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.messages]);

  // Handle message sending
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || state.isLoading) return;

    const message = inputValue;
    setInputValue('');

    try {
      await actions.sendMessage(message);
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again or check your connection.",
        variant: "destructive",
      });
    }
  }, [inputValue, state.isLoading, actions, toast]);

  // Handle keyboard shortcuts
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Handle voice input
  const toggleVoiceInput = useCallback(() => {
    setIsVoiceActive(!isVoiceActive);
    // TODO: Implement voice input logic
  }, [isVoiceActive]);

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList) => {
    // TODO: Implement file upload logic
    console.log('Files uploaded:', files);
  }, []);

  // Handle template selection
  const handleTemplateSelect = useCallback((template: ConversationTemplate) => {
    setInputValue(template.title);
    setShowTemplates(false);
    inputRef.current?.focus();
  }, []);

  // Get container classes based on mode
  const getContainerClasses = () => {
    switch (mode) {
      case 'floating':
        return 'fixed bottom-4 right-4 w-96 h-[600px] z-50';
      case 'sidebar':
        return 'w-full h-full';
      case 'fullscreen':
        return 'w-full h-screen';
      default:
        return 'w-full h-full';
    }
  };

  // Show empty state when no messages
  const showEmptyState = state.messages.length === 0 && !showTemplates;

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: mode === 'floating' ? 0.8 : 1, y: mode === 'floating' ? 20 : 0 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: mode === 'floating' ? 0.8 : 1, y: mode === 'floating' ? 20 : 0 }}
      className={cn(
        "flex flex-col bg-[#FAFAFA] border border-gray-200 rounded-xl overflow-hidden font-inter shadow-lg",
        getContainerClasses(),
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#199BEC] shadow-sm">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-[#191919] font-inter text-lg">ARIA</h2>
              <p className="text-xs text-gray-500 font-inter">AI Risk Intelligence Assistant</p>
            </div>
          </div>
          <div className="ml-2">
            {state.isConnected ? (
              <Badge variant="success" className="text-xs font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                Online
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs font-medium">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                Offline
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mode === 'floating' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-gray-500 hover:text-[#191919] hover:bg-gray-100 p-2"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-[#191919] hover:bg-gray-100 p-2">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg">
              <DropdownMenuItem onClick={() => actions.exportConversation('markdown')} className="hover:bg-gray-50 text-gray-700 font-inter font-medium">
                <Download className="h-4 w-4 mr-2" />
                Export Chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowTemplates(true)} className="hover:bg-gray-50 text-gray-700 font-inter font-medium">
                <MessageSquare className="h-4 w-4 mr-2" />
                Templates
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200" />
              <DropdownMenuItem onClick={actions.clearMessages} className="text-red-600 hover:bg-red-50 font-inter font-medium">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500 hover:text-[#191919] hover:bg-gray-100 p-2">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Agent Selector and Search */}
          <div className="p-4 border-b border-gray-200 space-y-3 bg-white">
            <AgentSelector currentAgent={selectedAgent} onAgentChange={actions.switchAgent} />
            
            {state.messages.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search messages..."
                  value={state.searchQuery}
                  onChange={(e) => actions.searchMessages(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
          </div>

          {/* Error Display */}
          {state.error && (
            <Alert className="m-4 border border-red-200 bg-red-50 shadow-sm">
              <AlertDescription className="text-red-600 font-inter text-sm font-medium">
                {state.error.message}
                {state.error.retryable && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={actions.clearError}
                    className="ml-2 p-0 h-auto text-red-600 hover:text-red-700 font-inter font-medium"
                  >
                    Dismiss
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="p-4 bg-white">
              <Progress value={uploadProgress} className="w-full h-2" />
              <p className="text-xs text-gray-600 font-inter font-medium mt-2">Uploading files...</p>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 overflow-hidden bg-white">
            {showTemplates ? (
              /* Templates View */
              <div className="p-6 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-[#191919] font-inter text-xl mb-1">Conversation Templates</h3>
                    <p className="text-sm text-gray-600 font-inter">Get started with pre-built prompts for common tasks</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowTemplates(false)} className="text-gray-500 hover:text-[#191919] hover:bg-gray-100">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-4">
                  {state.conversationTemplates.map((template) => (
                    <ConversationTemplateCard
                      key={template.id}
                      template={template}
                      onSelect={handleTemplateSelect}
                    />
                  ))}
                </div>
              </div>
            ) : showEmptyState ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#199BEC]/10 to-[#199BEC]/5 mb-6">
                  <Bot className="h-16 w-16 text-[#199BEC] mx-auto" />
                </div>
                <h3 className="font-bold text-2xl mb-2 text-[#191919] font-inter">Welcome to ARIA</h3>
                <p className="text-gray-600 font-inter text-sm mb-8 max-w-md leading-relaxed">
                  Your AI Risk Intelligence Assistant is ready to help with risk management, compliance, and controls. Ask me anything or use a template to get started.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                  <Button 
                    onClick={() => setShowTemplates(true)} 
                    variant="tertiary" 
                    className="flex-1 font-inter font-medium"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                  <Button 
                    onClick={() => inputRef.current?.focus()} 
                    className="flex-1 font-inter font-medium"
                  >
                    Start Conversation
                  </Button>
                </div>
              </div>
            ) : (
              /* Messages View */
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  {(state.searchQuery ? state.filteredMessages : state.messages).map((message) => (
                    <div key={message.id} className="flex gap-4">
                      <div className={cn(
                        "flex flex-col max-w-[85%]",
                        message.role === 'user' ? "ml-auto" : "mr-auto"
                      )}>
                        <div className={cn(
                          "p-4 rounded-xl font-inter shadow-sm border",
                          message.role === 'user' 
                            ? "bg-[#199BEC] text-white border-[#199BEC]" 
                            : "bg-gray-50 text-[#191919] border-gray-200"
                        )}>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          {message.usage && (
                            <div className="text-xs opacity-70 mt-3 pt-3 border-t border-current/20 font-medium">
                              Tokens: {message.usage.promptTokens + message.usage.completionTokens}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 font-inter mt-2 px-1 font-medium">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Typing Indicator */}
                  <TypingIndicator isVisible={state.isLoading} />
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Input Area */}
          {!showTemplates && (
            <div className="border-t border-gray-200 bg-white p-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask ARIA about risks, controls, or compliance..."
                    className="min-h-[48px] max-h-32 resize-none pr-20 text-sm"
                    disabled={state.isLoading}
                  />
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={state.isLoading}
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 h-8 w-8"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={toggleVoiceInput}
                      disabled={state.isLoading}
                      className={cn(
                        "text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 h-8 w-8",
                        isVoiceActive && "text-red-500 hover:text-red-600"
                      )}
                    >
                      {isVoiceActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || state.isLoading}
                  size="default"
                  className="px-4 font-inter font-medium self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Rate Limit Status */}
              {state.rateLimitStatus && (
                <div className="mt-3 text-xs text-gray-500 font-inter font-medium">
                  {state.rateLimitStatus.requestsRemaining} requests remaining
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg"
      />
    </motion.div>
  );
}; 