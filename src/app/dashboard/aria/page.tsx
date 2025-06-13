'use client';

import React, { useState } from 'react';
import { Bot, MessageSquare, Shield, Brain, Target, Send, Sparkles, TrendingUp, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function ARIAChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m ARIA, your AI Risk Intelligence Assistant. I can help you analyze risks, review controls, and provide compliance guidance. What would you like to discuss today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I understand you\'re asking about risk management. In demo mode, I can help you understand how ARIA would analyze this topic. For full AI capabilities, please contact our team for setup assistance.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const quickQuestions = [
    'What are our highest risks?',
    'Review our security controls',
    'Generate compliance report',
    'Help with risk assessment'
  ];

  const featureCards = [
    {
      title: 'Risk Analysis',
      description: 'AI-powered risk assessment and scenario modeling',
      icon: Brain,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Control Review',
      description: 'Automated security control optimization',
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Compliance',
      description: 'Gap analysis and regulatory monitoring',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#199BEC] to-[#0f7dc7] shadow-lg">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#191919] font-inter">ARIA</h1>
                <p className="text-gray-600 font-inter">AI Risk Intelligence Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="success" className="text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                Online
              </Badge>
              <Badge variant="outline" className="text-sm font-medium">
                v2.0.0
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        {/* Features Overview */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#191919] font-inter mb-2">
              AI-Powered Risk Management
            </h2>
            <p className="text-gray-600 font-inter max-w-2xl mx-auto">
              ARIA combines advanced AI with deep risk management expertise to help you identify, assess, and mitigate risks across your organization.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {featureCards.map((feature, index) => (
              <Card key={index} className="border border-gray-200 bg-white hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${feature.bgColor} ${feature.borderColor} border`}>
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[#191919] font-inter text-lg mb-2">{feature.title}</h3>
                      <p className="text-sm text-gray-600 font-inter leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="border border-gray-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-[#191919] font-inter mb-1">1,200+</div>
                <div className="text-sm text-gray-600 font-inter">Risks Analyzed</div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-[#191919] font-inter mb-1">94%</div>
                <div className="text-sm text-gray-600 font-inter">Accuracy Rate</div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-[#191919] font-inter mb-1">15min</div>
                <div className="text-sm text-gray-600 font-inter">Avg Response</div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-[#191919] font-inter mb-1">24/7</div>
                <div className="text-sm text-gray-600 font-inter">Availability</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Chat Interface */}
        <Card className="max-w-4xl mx-auto border border-gray-200 shadow-lg">
          <CardHeader className="border-b border-gray-200 bg-white">
            <CardTitle className="flex items-center gap-3 text-[#191919] font-inter">
              <MessageSquare className="h-6 w-6 text-[#199BEC]" />
              Chat with ARIA
              <Badge variant="purple" className="text-xs font-medium ml-auto">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Messages Area */}
            <div className="h-[500px] overflow-y-auto p-6 space-y-6 bg-white">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}
                  >
                    <div
                      className={`p-4 rounded-xl font-inter shadow-sm border ${
                        message.role === 'user'
                          ? 'bg-[#199BEC] text-white border-[#199BEC]'
                          : 'bg-gray-50 text-[#191919] border-gray-200'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                    <div className="text-xs text-gray-500 font-inter mt-2 px-1 font-medium">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-[#199BEC] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-[#199BEC] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-[#199BEC] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-sm font-medium text-gray-600 font-inter">ARIA is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Questions */}
            {messages.length === 1 && (
              <div className="px-6 pb-4 border-t border-gray-100">
                <div className="py-4">
                  <p className="text-sm text-gray-600 font-inter font-medium mb-3">Quick questions to get started:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {quickQuestions.map((question, index) => (
                      <Button
                        key={index}
                        variant="tertiary"
                        size="sm"
                        className="text-left justify-start text-sm h-auto py-3 px-4"
                        onClick={() => setInput(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-gray-200 bg-white p-6">
              <div className="flex gap-3">
                <Input
                  placeholder="Ask ARIA about risks, controls, or compliance..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  disabled={isLoading}
                  className="flex-1 text-sm"
                />
                <Button 
                  onClick={handleSend} 
                  disabled={isLoading || !input.trim()}
                  className="px-6 font-inter font-medium"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="text-center">
            <h3 className="text-xl font-bold text-[#191919] font-inter mb-4">
              Need Help Getting Started?
            </h3>
            <p className="text-gray-600 font-inter mb-6">
              ARIA can help you with various risk management tasks. Here are some things you can try:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <Card className="border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-[#191919] font-inter text-sm">Risk Assessment</h4>
                </div>
                <p className="text-xs text-gray-600 font-inter">
                  "Analyze our cybersecurity risks" or "What are the top risks in our industry?"
                </p>
              </Card>
              <Card className="border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-[#191919] font-inter text-sm">Control Review</h4>
                </div>
                <p className="text-xs text-gray-600 font-inter">
                  "Review our access controls" or "Suggest improvements for our security policies"
                </p>
              </Card>
              <Card className="border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-[#191919] font-inter text-sm">Compliance</h4>
                </div>
                <p className="text-xs text-gray-600 font-inter">
                  "Check SOX compliance status" or "Generate GDPR assessment report"
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ARIAPage() {
  return (
    <ProtectedRoute>
      <ARIAChat />
    </ProtectedRoute>
  );
} 