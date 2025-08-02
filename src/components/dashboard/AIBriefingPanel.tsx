'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { DaisyTooltip, DaisyTooltipContent, DaisyTooltipTrigger } from '@/components/ui/DaisyTooltip';

import {
  Brain, Sparkles, TrendingUp, AlertTriangle, CheckCircle, Clock,
  Target, Zap, Eye, ArrowRight, ChevronDown, ChevronUp, Play,
  Volume2, Pause, RotateCcw, BookOpen, Lightbulb, Flag, Star, Shield
} from 'lucide-react';

import type { Risk } from '@/types';

interface AIBriefingPanelProps {
  data: any;
  risks: Risk[];
  enabled: boolean;
}

interface BriefingInsight {
  id: string;
  type: 'critical' | 'opportunity' | 'trend' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionable: boolean;
  urgency: 'immediate' | 'this-week' | 'this-month' | 'long-term';
  category: string;
  data?: any;
}

interface BriefingSummary {
  overallHealth: number;
  keyTrends: string[];
  criticalActions: number;
  opportunities: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export function AIBriefingPanel({ data, risks, enabled }: AIBriefingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTab, setCurrentTab] = useState('summary');
  const [refreshing, setRefreshing] = useState(false);

  // Mock AI-generated briefing data
  const [briefingSummary] = useState<BriefingSummary>({
    overallHealth: 87,
    keyTrends: [
      'Cybersecurity risks trending upward (+15%)',
      'Compliance scores improving steadily',
      'Control effectiveness at 92% average'
    ],
    criticalActions: 3,
    opportunities: 7,
    riskLevel: 'medium'
  });

  const [briefingInsights] = useState<BriefingInsight[]>([
    {
      id: 'insight-1',
      type: 'critical',
      title: 'Emerging Cybersecurity Threat Pattern',
      description: 'AI detected 3 new attack vectors targeting financial institutions. Recommend immediate review of authentication controls.',
      impact: 'high',
      confidence: 94,
      actionable: true,
      urgency: 'immediate',
      category: 'Security',
      data: { affectedSystems: 12, similarIncidents: 5 }
    },
    {
      id: 'insight-2',
      type: 'opportunity',
      title: 'Control Automation Opportunity',
      description: 'Manual testing processes could be automated, reducing effort by 60% while improving coverage.',
      impact: 'medium',
      confidence: 89,
      actionable: true,
      urgency: 'this-month',
      category: 'Efficiency',
      data: { potentialSavings: 120, timeReduction: '60%' }
    },
    {
      id: 'insight-3',
      type: 'trend',
      title: 'Compliance Score Improvement',
      description: 'Overall compliance trending positively across all frameworks. SOC2 leading at 96% effectiveness.',
      impact: 'medium',
      confidence: 91,
      actionable: false,
      urgency: 'long-term',
      category: 'Compliance',
      data: { improvementRate: '+3.2%', topFramework: 'SOC2' }
    },
    {
      id: 'insight-4',
      type: 'recommendation',
      title: 'Risk Assessment Optimization',
      description: 'AI recommends updating risk scoring methodology based on recent incident patterns and industry benchmarks.',
      impact: 'high',
      confidence: 86,
      actionable: true,
      urgency: 'this-week',
      category: 'Risk Management',
      data: { currentAccuracy: '84%', projectedImprovement: '+12%' }
    }
  ]);

  // Generate daily briefing text
  const generateDailyBriefing = (): string => {
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    return `Good morning. Here's your AI-powered briefing for ${today}.

    Overall security posture is at ${briefingSummary.overallHealth}% - within acceptable range but requiring attention in key areas.

    Critical priorities today:
    • ${briefingInsights.filter(i => i.urgency === 'immediate').length} immediate actions requiring executive attention
    • ${briefingInsights.filter(i => i.type === 'critical').length} critical security insights detected
    • ${briefingInsights.filter(i => i.actionable).length} actionable recommendations ready for implementation

    Key trends:
    ${briefingSummary.keyTrends.map(trend => `• ${trend}`).join('\n    ')}

    Recommendations:
    Focus on cybersecurity controls review and consider the automation opportunities identified. Your risk management framework shows strong performance with room for optimization.

    AI confidence level: 92% based on current data quality and historical patterns.`;
  };

  // Simulate text-to-speech
  const handlePlayBriefing = () => {
    setIsPlaying(!isPlaying);
    
    if (!isPlaying) {
      // Simulate speech synthesis
      setTimeout(() => {
        setIsPlaying(false);
      }, 30000); // 30 second demo
    }
  };

  const handleRefreshBriefing = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <DaisyAlertTriangle className="w-4 h-4 text-red-600" >
  ;
</DaisyAlertTriangle>
      case 'opportunity':
        return <Lightbulb className="w-4 h-4 text-yellow-600" />;
      case 'trend':
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'recommendation':
        return <Target className="w-4 h-4 text-[#191919]" />;
      default:
        return <Sparkles className="w-4 h-4 text-gray-600" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'this-week':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'this-month':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  if (!enabled) {

  return (
    <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5] font-inter" >
  <DaisyCardBody className="p-6" >
  </DaisyCard>
</DaisyCardBody>
          <div className="flex items-center justify-center space-x-4">
            <Brain className="w-8 h-8 text-[#A8A8A8]" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-[#191919] font-inter">
                AI Briefing Disabled
              </h3>
              <p className="text-sm text-[#A8A8A8] font-inter">
                Enable AI insights to receive daily briefings and recommendations
              </p>
            </div>
          </div>
        </DaisyCardBody>
      </DaisyCard>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="font-inter"
    >
      <DaisyCard className="bg-[#FAFAFA] border-[#D8C3A5] shadow-lg" >
  <DaisyCardBody className="pb-3" />
</DaisyCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#191919] rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-[#FAFAFA]" />
              </div>
              <div>
                <DaisyCardTitle className="text-xl font-bold text-[#191919] font-inter" >
  AI Daily Briefing
</DaisyCardTitle>
                </DaisyCardTitle>
                <p className="text-sm text-[#A8A8A8] font-inter">
                  Personalized insights and recommendations
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <DaisyBadge className="bg-[#191919] text-[#FAFAFA] font-inter" >
  <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
</DaisyBadge>
                Live
              </DaisyBadge>
              
              <DaisyTooltip />
                <DaisyTooltipTrigger asChild />
                  <DaisyButton
                    variant="ghost"
                    size="sm"
                    onClick={handlePlayBriefing}
                    className="bg-transparent text-[#A8A8A8] hover:text-[#191919] hover:bg-[#D8C3A5]/20 font-inter" >
  {isPlaying ? 
</DaisyTooltip><Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </DaisyButton>
                </DaisyTooltipTrigger>
                <DaisyTooltipContent />
                  {isPlaying ? 'Pause Audio Briefing' : 'Play Audio Briefing'}
                </DaisyTooltipContent>
              </DaisyTooltip>

              <DaisyTooltip />
                <DaisyTooltipTrigger asChild />
                  <DaisyButton
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshBriefing}
                    disabled={refreshing}
                    className="bg-transparent text-[#A8A8A8] hover:text-[#191919] hover:bg-[#D8C3A5]/20 font-inter" >
  <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
</DaisyTooltip>
                  </DaisyButton>
                </DaisyTooltipTrigger>
                <DaisyTooltipContent>Refresh Briefing</DaisyTooltipContent>
              </DaisyTooltip>

              <DaisyButton
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="bg-transparent text-[#A8A8A8] hover:text-[#191919] hover:bg-[#D8C3A5]/20 font-inter" />
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </DaisyButton>
            </div>
          </div>
        

        {/* Audio Playing Indicator */}
        <AnimatePresence>
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <div className="flex items-center space-x-2 text-blue-700">
                <Volume2 className="w-4 h-4" />
                <span className="text-sm font-medium">Playing audio briefing...</span>
                <div className="flex space-x-1">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-1 h-4 bg-blue-400 rounded animate-pulse"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DaisyCard>

      <DaisyCardBody className="pt-0" >
  {/* Summary Overview */}
</DaisyCardBody>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center space-y-1">
            <div className={`text-2xl font-bold ${getHealthColor(briefingSummary.overallHealth)} font-inter`}>
              {briefingSummary.overallHealth}%
            </div>
            <div className="text-xs text-[#A8A8A8] font-medium font-inter">
              Overall Health
            </div>
          </div>
          
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-red-600 font-inter">
              {briefingSummary.criticalActions}
            </div>
            <div className="text-xs text-[#A8A8A8] font-medium font-inter">
              Critical Actions
            </div>
          </div>
          
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-green-600 font-inter">
              {briefingSummary.opportunities}
            </div>
            <div className="text-xs text-[#A8A8A8] font-medium font-inter">
              Opportunities
            </div>
          </div>
          
          <div className="text-center space-y-1">
            <DaisyBadge 
              className={`${
                briefingSummary.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                briefingSummary.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                briefingSummary.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              } font-inter`}
            >
              {briefingSummary.riskLevel.toUpperCase()}
            </DaisyBadge>
            <div className="text-xs text-[#A8A8A8] font-medium font-inter">
              Risk Level
            </div>
          </div>
        </div>

        <DaisySeparator className="my-4" />

        {/* Tabbed Content */}
        <DaisyTabs value={currentTab} onValueChange={setCurrentTab} className="w-full" />
          <DaisyTabsList className="grid w-full grid-cols-4" />
            <DaisyTabsTrigger value="summary">Summary</DaisySeparator>
            <DaisyTabsTrigger value="insights">Insights</DaisyTabsTrigger>
            <DaisyTabsTrigger value="actions">Actions</DaisyTabsTrigger>
            <DaisyTabsTrigger value="trends">Trends</DaisyTabsTrigger>
          </DaisyTabsList>

          <DaisyTabsContent value="summary" className="mt-4 space-y-4" />
            <div className="bg-[#F5F1E9] border border-[#D8C3A5] rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <BookOpen className="w-5 h-5 text-[#191919] mt-1" />
                <div className="flex-1">
                  <h4 className="font-medium text-[#191919] mb-2 font-inter">
                    Executive Summary
                  </h4>
                  <div className="text-sm text-[#A8A8A8] leading-relaxed whitespace-pre-line font-inter">
                    {generateDailyBriefing()}
                  </div>
                </div>
              </div>
            </div>

            {/* Key Trends */}
            <div className="space-y-2">
              <h4 className="font-medium text-[#191919] font-inter">Key Trends</h4>
              {briefingSummary.keyTrends.map((trend, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-2 text-sm text-[#A8A8A8] font-inter"
                >
                  <TrendingUp className="w-3 h-3 text-blue-600" />
                  <span>{trend}</span>
                </motion.div>
              ))}
            </div>
          </DaisyTabsContent>

          <DaisyTabsContent value="insights" className="mt-4 space-y-3" />
            {briefingInsights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 border border-[#D8C3A5] rounded-lg bg-[#F5F1E9] hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-[#191919] font-inter">
                          {insight.title}
                        </h4>
                        <DaisyBadge variant="outline" className="text-xs border-[#D8C3A5] text-[#191919] font-inter" >
  {insight.confidence}% confidence
</DaisyTabsContent>
                        </DaisyBadge>
                      </div>
                      <p className="text-sm text-[#A8A8A8] mb-2 font-inter">
                        {insight.description}
                      </p>
                      <div className="flex items-center space-x-2">
                        <DaisyBadge className={getUrgencyColor(insight.urgency)} >
  {insight.urgency.replace('-', ' ')}
</DaisyBadge>
                        </DaisyBadge>
                        <DaisyBadge variant="outline" className="text-xs border-[#D8C3A5] text-[#191919] font-inter" >
  {insight.category}
</DaisyBadge>
                        </DaisyBadge>
                        {insight.actionable && (
                          <DaisyBadge className="bg-green-100 text-green-800 text-xs font-inter" >
  Actionable
</DaisyBadge>
                          </DaisyBadge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {insight.actionable && (
                    <DaisyButton size="sm" variant="outline" className="border-[#D8C3A5] text-[#191919] hover:bg-[#D8C3A5]/20 font-inter" >
  <ArrowRight className="w-3 h-3" />
</DaisyButton>
                    </DaisyButton>
                  )}
                </div>
              </motion.div>
            ))}
          </DaisyTabsContent>

          <DaisyTabsContent value="actions" className="mt-4 space-y-3" />
            {briefingInsights
              .filter(insight => insight.actionable)
              .sort((a, b) => {
                const urgencyOrder = { immediate: 4, 'this-week': 3, 'this-month': 2, 'long-term': 1 };
                return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
              })
              .map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 border border-[#D8C3A5] rounded-lg bg-[#FAFAFA]"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      insight.urgency === 'immediate' ? 'bg-red-500' :
                      insight.urgency === 'this-week' ? 'bg-orange-500' :
                      insight.urgency === 'this-month' ? 'bg-blue-500' :
                      'bg-gray-400'
                    }`} />
                    <div>
                      <h4 className="font-medium text-[#191919] text-sm font-inter">
                        {insight.title}
                      </h4>
                      <p className="text-xs text-[#A8A8A8] font-inter">
                        {insight.category} • {insight.urgency.replace('-', ' ')}
                      </p>
                    </div>
                  </div>
                  <DaisyButton size="sm" variant="outline" className="border-[#D8C3A5] text-[#191919] hover:bg-[#D8C3A5]/20 font-inter" >
  Take Action
</DaisyTabsContent>
                  </DaisyButton>
                </motion.div>
              ))}
          </DaisyTabsContent>

          <DaisyTabsContent value="trends" className="mt-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-[#191919] font-inter">Positive Trends</h4>
                {[
                  { label: 'Compliance Scores', change: '+3.2%', icon: <CheckCircle className="w-4 h-4 text-green-600" /> },
                  { label: 'Control Effectiveness', change: '+1.8%', icon: <Shield className="w-4 h-4 text-green-600" /> },
                  { label: 'Response Time', change: '-15%', icon: <Clock className="w-4 h-4 text-green-600" /> },
                ].map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <div className="flex items-center space-x-2">
                      {trend.icon}
                      <span className="text-sm text-[#191919] font-inter">{trend.label}</span>
                    </div>
                    <DaisyBadge className="bg-green-100 text-green-800 text-xs font-inter" >
  {trend.change}
</DaisyTabsContent>
                    </DaisyBadge>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-[#191919] font-inter">Areas of Concern</h4>
                {[
                  { label: 'Security Incidents', change: '+15%', icon: <DaisyAlertTriangle className="w-4 h-4 text-red-600" >
  },
</DaisyAlertTriangle>
                  { label: 'Open Risks', change: '+5%', icon: <Flag className="w-4 h-4 text-orange-600" /> },
                ].map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <div className="flex items-center space-x-2">
                      {trend.icon}
                      <span className="text-sm text-[#191919] font-inter">{trend.label}</span>
                    </div>
                    <DaisyBadge className="bg-red-100 text-red-800 text-xs font-inter" >
  {trend.change}
</DaisyBadge>
                    </DaisyBadge>
                  </div>
                ))}
              </div>
            </div>
          </DaisyTabsContent>
        </DaisyTabs>

        {/* Expanded View */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-[#D8C3A5]"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-[#191919] mb-3 font-inter">AI Recommendations</h4>
                  <div className="space-y-2">
                    {['Implement zero-trust architecture', 'Automate compliance reporting', 'Enhance incident response'].map((rec, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="text-[#A8A8A8] font-inter">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-[#191919] mb-3 font-inter">Performance Metrics</h4>
                  <div className="space-y-3">
                    {[
                      { label: 'AI Accuracy', value: 92 },
                      { label: 'Prediction Confidence', value: 87 },
                      { label: 'Data Quality', value: 95 }
                    ].map((metric, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#A8A8A8] font-inter">{metric.label}</span>
                          <span className="font-medium text-[#191919] font-inter">{metric.value}%</span>
                        </div>
                        <DaisyProgress value={metric.value} className="h-1" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DaisyProgress>
    </motion.div>
  );
} 