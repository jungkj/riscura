'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  FileText,
  TrendingUp,
  CheckCircle,
  Target,
  Settings,
  Shield
} from 'lucide-react';

interface AnalyticsData {
  totalQuestionnaires: number;
  activeResponses: number;
  completionRate: number;
  averageScore: number;
  aiGeneratedQuestions: number;
  riskAssessments: number;
}

interface AnalyticsCardsProps {
  analytics: AnalyticsData;
  className?: string;
}

interface AnalyticsCard {
  id: string;
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  delay: number;
}

export function AnalyticsCards({ analytics, className }: AnalyticsCardsProps) {
  const cards: AnalyticsCard[] = [
    {
      id: 'total-questionnaires',
      label: 'Total Questionnaires',
      value: analytics.totalQuestionnaires,
      icon: <FileText className="w-5 h-5" />,
      iconBgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      delay: 0.1
    },
    {
      id: 'active-responses',
      label: 'Active Responses',
      value: analytics.activeResponses,
      icon: <TrendingUp className="w-5 h-5" />,
      iconBgColor: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
      delay: 0.15
    },
    {
      id: 'completion-rate',
      label: 'Completion Rate',
      value: `${analytics.completionRate}%`,
      icon: <CheckCircle className="w-5 h-5" />,
      iconBgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      delay: 0.2
    },
    {
      id: 'average-score',
      label: 'Average Score',
      value: analytics.averageScore,
      icon: <Target className="w-5 h-5" />,
      iconBgColor: 'bg-gray-50 dark:bg-gray-800/50',
      iconColor: 'text-gray-700 dark:text-gray-300',
      delay: 0.25
    },
    {
      id: 'ai-questions',
      label: 'AI Questions',
      value: analytics.aiGeneratedQuestions,
      icon: <Settings className="w-5 h-5" />,
      iconBgColor: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
      delay: 0.3
    },
    {
      id: 'risk-assessments',
      label: 'Risk Assessments',
      value: analytics.riskAssessments,
      icon: <Shield className="w-5 h-5" />,
      iconBgColor: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      delay: 0.35
    }
  ];

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4",
        className
      )}
    >
      {cards.map((card) => (
        <motion.div
          key={card.id}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: card.delay }}
          whileHover={{ scale: 1.02 }}
          className="h-full"
        >
          <Card className="border-notion-border bg-white dark:bg-notion-bg-secondary hover:shadow-md transition-all duration-200 h-full">
            <CardContent className="p-5">
              <div className="flex items-center justify-between h-full">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-notion-text-secondary mb-1 truncate">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold text-notion-text-primary">
                    {card.value}
                  </p>
                </div>
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ml-3",
                  card.iconBgColor
                )}>
                  <div className={card.iconColor}>
                    {card.icon}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}

// Analytics loading skeleton
export function AnalyticsCardsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4",
      className
    )}>
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="border-notion-border bg-white dark:bg-notion-bg-secondary">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-24 animate-pulse" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
              </div>
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 