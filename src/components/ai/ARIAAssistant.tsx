'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Download,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Brain,
  MessageSquare,
  Lightbulb,
  BarChart3,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Bot
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'data' | 'chart' | 'recommendation';
  confidence?: number;
  actions?: Array<{
    label: string;
    action: string;
    parameters?: any;
  }>;
  followUpQuestions?: string[];
}

interface ARIACapabilities {
  riskAnalysis: boolean;
  controlRecommendations: boolean;
  complianceGapAnalysis: boolean;
  trendPrediction: boolean;
  naturalLanguageQuery: boolean;
}

interface ARIAAssistantProps {
  organizationId: string;
  context?: {
    currentPage?: string;
    selectedRisk?: string;
    selectedControl?: string;
  };
  onActionTrigger?: (action: string, parameters?: any) => void;
}

export default function ARIAAssistant({ 
  organizationId, 
  context,
  onActionTrigger 
}: ARIAAssistantProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<ARIACapabilities>({
    riskAnalysis: true,
    controlRecommendations: true,
    complianceGapAnalysis: true,
    trendPrediction: true,
    naturalLanguageQuery: true,
  });
  
  // Voice and audio state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognition | null>(null);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize speech capabilities
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          toast({
            title: 'Voice Recognition Error',
            description: 'Unable to process voice input. Please try again.',
            variant: 'destructive',
          });
        };
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInputMessage(transcript);
          setIsListening(false);
        };
        
        setSpeechRecognition(recognition);
        setVoiceEnabled(true);
      }
      
      // Initialize Speech Synthesis
      if (window.speechSynthesis) {
        setSpeechSynthesis(window.speechSynthesis);
      }
    }
  }, [toast]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `Hello! I'm ARIA, your AI Risk Intelligence Assistant. I can help you with:

• Risk analysis and scoring
• Control recommendations
• Compliance gap identification
• Trend analysis and predictions
• Natural language queries about your risk data

How can I assist you today?`,
        timestamp: new Date(),
        type: 'text',
        confidence: 1.0,
        followUpQuestions: [
          'Analyze our highest priority risks',
          'Show me compliance gaps for ISO 27001',
          'Recommend controls for our cybersecurity risks',
          'What are our risk trends this quarter?'
        ]
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Send message to AI
  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          organizationId,
          conversationId,
          context: {
            ...context,
            userRole: user?.role,
          },
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response.message,
          timestamp: new Date(),
          type: data.response.type,
          confidence: data.metadata.confidence,
          actions: data.response.actions,
          followUpQuestions: data.response.followUpQuestions,
        };

        setMessages(prev => [...prev, assistantMessage]);
        setConversationId(data.conversationId);

        // Speak response if voice is enabled
        if (voiceEnabled && speechSynthesis && !isSpeaking) {
          speakMessage(data.response.message);
        }
      } else {
        throw new Error(data.message || 'Failed to get AI response');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return; // Request was cancelled
      }

      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        type: 'text',
        confidence: 0,
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: 'Chat Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Voice input handling
  const startListening = () => {
    if (speechRecognition && !isListening) {
      speechRecognition.start();
    }
  };

  const stopListening = () => {
    if (speechRecognition && isListening) {
      speechRecognition.stop();
    }
  };

  // Text-to-speech
  const speakMessage = (text: string) => {
    if (speechSynthesis && !isSpeaking) {
      setIsSpeaking(true);
      
      // Clean text for speech
      const cleanText = text
        .replace(/[#*`]/g, '') // Remove markdown
        .replace(/\n+/g, '. ') // Replace newlines with pauses
        .substring(0, 500); // Limit length
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (speechSynthesis && isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Handle action triggers
  const handleAction = (action: string, parameters?: any) => {
    if (onActionTrigger) {
      onActionTrigger(action, parameters);
    } else {
      // Default action handling
      switch (action) {
        case 'analyze_risk':
          sendMessage('Analyze our current risk landscape');
          break;
        case 'get_recommendations':
          sendMessage('What control recommendations do you have?');
          break;
        default:
          console.log('Action triggered:', action, parameters);
      }
    }
  };

  // Handle follow-up questions
  const handleFollowUpQuestion = (question: string) => {
    sendMessage(question);
  };

  // Copy message to clipboard
  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: 'Copied',
        description: 'Message copied to clipboard',
      });
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  // Export conversation
  const exportConversation = () => {
    const conversationText = messages
      .map(msg => `[${msg.timestamp.toLocaleString()}] ${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');
    
    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aria-conversation-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear conversation
  const clearConversation = () => {
    setMessages([]);
    setConversationId(null);
    setInputMessage('');
    
    // Re-add welcome message
    setTimeout(() => {
      const welcomeMessage: ChatMessage = {
        id: 'welcome-new',
        role: 'assistant',
        content: 'Conversation cleared. How can I help you?',
        timestamp: new Date(),
        type: 'text',
        confidence: 1.0,
      };
      setMessages([welcomeMessage]);
    }, 100);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  // Get message icon
  const getMessageIcon = (type?: string) => {
    switch (type) {
      case 'data': return <BarChart3 className="w-4 h-4 text-blue-500" />;
      case 'chart': return <BarChart3 className="w-4 h-4 text-green-500" />;
      case 'recommendation': return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-lg">ARIA Assistant</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />
              AI Powered
            </Badge>
          </div>
          
          <div className="flex items-center space-x-1">
            {voiceEnabled && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isSpeaking ? stopSpeaking : undefined}
                  disabled={!isSpeaking}
                  className="p-2"
                >
                  {isSpeaking ? (
                    <VolumeX className="w-4 h-4 text-red-500" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
              </>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={exportConversation}
              disabled={messages.length === 0}
              className="p-2"
            >
              <Download className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={clearConversation}
              disabled={messages.length === 0}
              className="p-2"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white ml-4'
                      : 'bg-gray-100 text-gray-900 mr-4'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'assistant' && (
                      <Bot className="w-5 h-5 mt-0.5 text-purple-600 flex-shrink-0" />
                    )}
                    {message.role === 'user' && (
                      <User className="w-5 h-5 mt-0.5 text-white flex-shrink-0" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {message.type && getMessageIcon(message.type)}
                        <span className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                        {message.confidence && (
                          <Badge variant="outline" className="text-xs">
                            {Math.round(message.confidence * 100)}% confident
                          </Badge>
                        )}
                      </div>
                      
                      <div className="whitespace-pre-wrap text-sm">
                        {message.content}
                      </div>
                      
                      {/* Action Buttons */}
                      {message.actions && message.actions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {message.actions.map((action, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleAction(action.action, action.parameters)}
                              className="text-xs"
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                      
                      {/* Follow-up Questions */}
                      {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <div className="text-xs opacity-70 mb-2">Suggested questions:</div>
                          {message.followUpQuestions.map((question, index) => (
                            <Button
                              key={index}
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFollowUpQuestion(question)}
                              className="text-xs h-auto p-2 justify-start text-left whitespace-normal"
                            >
                              {question}
                            </Button>
                          ))}
                        </div>
                      )}
                      
                      {/* Message Actions */}
                      {message.role === 'assistant' && (
                        <div className="flex items-center space-x-1 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyMessage(message.content)}
                            className="p-1 h-6 w-6"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          
                          {voiceEnabled && speechSynthesis && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => speakMessage(message.content)}
                              disabled={isSpeaking}
                              className="p-1 h-6 w-6"
                            >
                              <Volume2 className="w-3 h-3" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-6 w-6"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-6 w-6"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 mr-4">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-5 h-5 text-purple-600" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <Separator />

        {/* Input Area */}
        <div className="p-4">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask ARIA about risks, controls, compliance..."
                disabled={isLoading}
                className="pr-12"
              />
              
              {voiceEnabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={isListening ? stopListening : startListening}
                  disabled={isLoading}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6 ${
                    isListening ? 'text-red-500' : 'text-gray-500'
                  }`}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
            
            <Button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendMessage('Show me our risk dashboard')}
              disabled={isLoading}
              className="text-xs"
            >
              <Shield className="w-3 h-3 mr-1" />
              Risk Dashboard
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendMessage('Analyze compliance status')}
              disabled={isLoading}
              className="text-xs"
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Compliance Status
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendMessage('What are our trending risks?')}
              disabled={isLoading}
              className="text-xs"
            >
              <BarChart3 className="w-3 h-3 mr-1" />
              Risk Trends
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendMessage('Recommend controls for high-priority risks')}
              disabled={isLoading}
              className="text-xs"
            >
              <Lightbulb className="w-3 h-3 mr-1" />
              Control Recommendations
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}