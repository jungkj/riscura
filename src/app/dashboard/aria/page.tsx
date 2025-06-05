'use client';

import React, { useState } from 'react';
import { 
  Bot, 
  MessageSquare, 
  Zap, 
  Shield, 
  BarChart3,
  Brain,
  Target,
  Lightbulb,
  Sparkles,
  Settings,
  Mic,
  Paperclip,
  ChevronDown,
  Users,
  Activity
} from 'lucide-react';
import dynamic from 'next/dynamic';

const MainLayout = dynamic(() => import('@/layouts/MainLayout'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

const ProtectedRoute = dynamic(() => import('@/components/auth/ProtectedRoute').then(mod => ({ default: mod.ProtectedRoute })), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  onClick?: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  icon, 
  title, 
  description, 
  badge, 
  onClick 
}) => (
  <Card 
    className="transition-all duration-300 hover:shadow-xl cursor-pointer group border border-gray-100 hover:border-[#191919] bg-white relative overflow-hidden"
    onClick={onClick}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-[#D8C3A5]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <CardHeader className="pb-3 relative z-10">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#191919] to-[#191919] shadow-lg group-hover:shadow-[#D8C3A5]/50 transition-all duration-300">
            <div className="text-white">
              {icon}
            </div>
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-[#191919] font-inter">{title}</CardTitle>
            {badge && <Badge variant="secondary" className="mt-1 bg-[#D8C3A5] text-[#191919] border-0 font-medium">{badge}</Badge>}
          </div>
        </div>
      </div>
    </CardHeader>
    <CardContent className="relative z-10">
      <CardDescription className="text-[#A8A8A8] font-inter text-sm leading-relaxed">{description}</CardDescription>
    </CardContent>
  </Card>
);

function ARIAPageContent() {
  const [activeTab, setActiveTab] = useState<'features' | 'chat' | 'analytics'>('features');

  const features = [
    {
      icon: <Brain className="h-5 w-5" />,
      title: 'Risk Analysis AI',
      description: 'AI-powered risk assessment and quantification',
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: 'Control Recommendations',
      description: 'Intelligent control design and optimization',
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Compliance Intelligence',
      description: 'Automated compliance gap analysis and roadmaps',
    },
    {
      icon: <Lightbulb className="h-5 w-5" />,
      title: 'Proactive Intelligence',
      description: 'Background AI monitoring and predictive insights',
    }
  ];

  const handleStartConversation = () => {
    setActiveTab('chat');
  };

  return (
    <div className="min-h-screen bg-[#F5F1E9] font-inter">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[#191919] to-[#191919] shadow-lg shadow-[#D8C3A5]/50">
              <Bot className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#191919] font-inter tracking-tight">ARIA</h1>
              <p className="text-base text-[#A8A8A8] font-inter">
                AI Risk Intelligence Assistant
              </p>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#D8C3A5] border border-[#191919]">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-[#191919]">Live</span>
              </div>
              <Badge variant="outline" className="bg-white text-[#191919] border border-[#191919] px-3 py-1 text-sm font-medium">
                v1.0.0
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content with Tabs */}
          <div className="lg:col-span-2 space-y-8">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
              <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-100 p-1 shadow-sm rounded-xl">
                <TabsTrigger 
                  value="features" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#191919] data-[state=active]:to-[#191919] data-[state=active]:text-white data-[state=active]:shadow-md text-[#A8A8A8] hover:text-[#191919] transition-all duration-200 font-medium rounded-lg"
                >
                  <Zap className="h-4 w-4" />
                  Features
                </TabsTrigger>
                <TabsTrigger 
                  value="chat" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#191919] data-[state=active]:to-[#191919] data-[state=active]:text-white data-[state=active]:shadow-md text-[#A8A8A8] hover:text-[#191919] transition-all duration-200 font-medium rounded-lg"
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#191919] data-[state=active]:to-[#191919] data-[state=active]:text-white data-[state=active]:shadow-md text-[#A8A8A8] hover:text-[#191919] transition-all duration-200 font-medium rounded-lg"
                >
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="features" className="space-y-8">
                {/* Welcome Section */}
                <Card className="bg-white border border-gray-100 hover:border-[#191919] transition-all duration-300 shadow-sm hover:shadow-lg overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#D8C3A5]/20 to-transparent rounded-full -mr-32 -mt-32" />
                  <CardHeader className="pb-4 relative z-10">
                    <CardTitle className="flex items-center gap-3 text-[#191919] font-inter text-2xl font-bold">
                      <div className="p-2 rounded-lg bg-[#D8C3A5]">
                        <Bot className="h-6 w-6 text-[#191919]" />
                      </div>
                      Welcome to ARIA
                    </CardTitle>
                    <CardDescription className="text-[#A8A8A8] font-inter text-base leading-relaxed mt-2">
                      Your intelligent assistant for risk management, compliance, and control optimization.
                      Start a conversation or explore AI-powered features below.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="flex gap-4">
                      <Button 
                        onClick={handleStartConversation}
                        className="flex-1 bg-gradient-to-r from-[#191919] to-[#191919] text-white hover:from-[#2a2a2a] hover:to-[#2a2a2a] border-0 shadow-md hover:shadow-lg transition-all duration-300 font-inter font-medium py-3 text-sm"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Start Conversation
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Features Grid */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#191919] font-inter">AI-Powered Features</h2>
                  <div className="flex items-center gap-2 text-sm text-[#A8A8A8]">
                    <Sparkles className="h-4 w-4 text-[#191919]" />
                    <span>Powered by advanced AI</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {features.map((feature, index) => (
                    <FeatureCard key={feature.title} {...feature} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="chat">
                <Card className="h-[calc(100vh-16rem)] bg-white border border-gray-100 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-[#191919]">ARIA Chat</CardTitle>
                    <CardDescription>AI-powered conversation interface</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center text-[#A8A8A8]">
                      <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>ARIA chat interface coming soon</p>
                      <p className="text-sm">Interactive AI assistant for risk management</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <Card className="bg-white border border-gray-100 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-[#191919]">AI Analytics</CardTitle>
                    <CardDescription>AI usage and performance metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center text-[#A8A8A8]">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Analytics dashboard coming soon</p>
                      <p className="text-sm">Track AI usage and performance</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* System Status */}
            <Card className="bg-white border border-gray-100 transition-all duration-300 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-[#191919] font-inter flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#D8C3A5]/20 rounded-lg">
                  <span className="text-sm font-medium text-[#191919] font-inter">AI Service</span>
                  <Badge variant="default" className="font-medium px-3 py-1 text-xs">
                    Online
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Usage Statistics */}
            <Card className="bg-white border border-gray-100 transition-all duration-300 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-[#191919] font-inter flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#191919]" />
                  Usage Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-gradient-to-br from-[#D8C3A5]/20 to-[#D8C3A5]/10 rounded-lg">
                    <p className="text-2xl font-bold text-[#191919]">3</p>
                    <p className="text-xs text-[#A8A8A8] mt-1">Conversations</p>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-[#D8C3A5]/20 to-[#D8C3A5]/10 rounded-lg">
                    <p className="text-2xl font-bold text-[#191919]">12</p>
                    <p className="text-xs text-[#A8A8A8] mt-1">Messages</p>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-[#D8C3A5]/20 to-[#D8C3A5]/10 rounded-lg">
                    <p className="text-2xl font-bold text-[#191919]">95%</p>
                    <p className="text-xs text-[#A8A8A8] mt-1">Accuracy</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="bg-white border border-gray-100 transition-all duration-300 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-[#191919] font-inter">
                  <Settings className="h-5 w-5 text-[#191919]" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#D8C3A5]/20 rounded-lg hover:bg-[#D8C3A5]/30 transition-colors duration-200">
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4 text-[#A8A8A8]" />
                      <span className="text-sm font-medium text-[#191919] font-inter">Voice Input</span>
                    </div>
                    <Badge variant="outline" className="bg-[#D8C3A5]/20 text-[#191919] border-[#D8C3A5] text-xs font-medium">Available</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#D8C3A5]/20 rounded-lg hover:bg-[#D8C3A5]/30 transition-colors duration-200">
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-[#A8A8A8]" />
                      <span className="text-sm font-medium text-[#191919] font-inter">File Upload</span>
                    </div>
                    <Badge variant="outline" className="bg-[#D8C3A5]/20 text-[#191919] border-[#D8C3A5] text-xs font-medium">Enabled</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ARIAPageRoute() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <ARIAPageContent />
      </MainLayout>
    </ProtectedRoute>
  );
} 