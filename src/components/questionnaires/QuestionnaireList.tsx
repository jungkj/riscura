'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import {
  Edit, Eye, Copy, Share, Archive, Trash2, MoreVertical, 
  Play, Pause, Users, Clock, Target, BarChart3, Brain,
  Shield, CheckCircle, AlertTriangle, Calendar, FileText
} from 'lucide-react';

import type { Questionnaire } from '@/types/questionnaire.types';

interface QuestionnaireListProps {
  questionnaires: Questionnaire[];
  onEdit: (questionnaire: Questionnaire) => void;
  onDuplicate: (questionnaire: Questionnaire) => void;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
}

export function QuestionnaireList({
  questionnaires,
  onEdit,
  onDuplicate,
  onDelete,
  onPublish
}: QuestionnaireListProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'published': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'risk_assessment': return <Shield className="w-4 h-4" />;
      case 'compliance_audit': return <CheckCircle className="w-4 h-4" />;
      case 'control_testing': return <Target className="w-4 h-4" />;
      case 'vendor_assessment': return <Users className="w-4 h-4" />;
      case 'security_review': return <Shield className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatCategory = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const QuestionnaireCard = ({ questionnaire }: { questionnaire: Questionnaire }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      className="h-full"
    >
      <Card className="h-full border-notion-border bg-white dark:bg-notion-bg-secondary hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-notion-bg-tertiary rounded-lg">
                {getCategoryIcon(questionnaire.category)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-notion-text-primary truncate">
                  {questionnaire.title}
                </h3>
                <p className="text-sm text-notion-text-secondary">
                  v{questionnaire.version}
                </p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(questionnaire)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(questionnaire)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {questionnaire.status === 'draft' && (
                  <DropdownMenuItem onClick={() => onPublish(questionnaire.id)}>
                    <Play className="w-4 h-4 mr-2" />
                    Publish
                  </DropdownMenuItem>
                )}
                {questionnaire.status === 'active' && (
                  <DropdownMenuItem>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(questionnaire.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center space-x-2 mt-2">
            <Badge 
              variant="outline" 
              className={getStatusColor(questionnaire.status)}
            >
              {questionnaire.status.charAt(0).toUpperCase() + questionnaire.status.slice(1)}
            </Badge>
            
            <Badge variant="outline" className="text-xs">
              {formatCategory(questionnaire.category)}
            </Badge>

            {questionnaire.aiSettings.enabled && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    <Brain className="w-3 h-3 mr-1" />
                    AI
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>AI-powered questionnaire</TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-notion-text-secondary line-clamp-2">
            {questionnaire.description}
          </p>

          {/* Analytics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-notion-text-secondary">Responses</span>
                <span className="font-medium">{questionnaire.analytics.overview.totalResponses}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-notion-text-secondary">Completion</span>
                <span className="font-medium">{questionnaire.analytics.overview.completionRate}%</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-notion-text-secondary">Avg Score</span>
                <span className="font-medium">{questionnaire.analytics.overview.averageScore}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-notion-text-secondary">Avg Time</span>
                <span className="font-medium">{questionnaire.analytics.overview.averageTime}m</span>
              </div>
            </div>
          </div>

          {/* Completion Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-notion-text-secondary">Completion Rate</span>
              <span className="font-medium">{questionnaire.analytics.overview.completionRate}%</span>
            </div>
            <Progress 
              value={questionnaire.analytics.overview.completionRate} 
              className="h-2"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-notion-border">
            <div className="flex items-center space-x-2 text-xs text-notion-text-secondary">
              <Calendar className="w-3 h-3" />
              <span>Updated {formatDate(questionnaire.updatedAt)}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Tooltip>
                <TooltipTrigger>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(questionnaire)}>
                    <Edit className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit questionnaire</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger>
                  <Button variant="ghost" size="sm">
                    <BarChart3 className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View analytics</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (questionnaires.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <FileText className="w-16 h-16 text-notion-text-tertiary mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-notion-text-primary mb-2">
          No questionnaires found
        </h3>
        <p className="text-notion-text-secondary mb-6">
          Create your first AI-powered questionnaire to get started
        </p>
        <Button>
          <FileText className="w-4 h-4 mr-2" />
          Create Questionnaire
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-notion-text-primary">
            Questionnaires ({questionnaires.length})
          </h2>
          <p className="text-sm text-notion-text-secondary">
            Manage your AI-powered assessment questionnaires
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={view === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('grid')}
          >
            Grid
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('list')}
          >
            List
          </Button>
        </div>
      </div>

      {/* Questionnaire Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence>
          {questionnaires.map((questionnaire) => (
            <QuestionnaireCard 
              key={questionnaire.id} 
              questionnaire={questionnaire} 
            />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
} 