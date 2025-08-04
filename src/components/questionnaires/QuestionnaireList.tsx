'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyProgress } from '@/components/ui/DaisyProgress';
import { DaisyAvatar, DaisyAvatarFallback, DaisyAvatarImage } from '@/components/ui/DaisyAvatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { DaisyTooltip, DaisyTooltipContent, DaisyTooltipTrigger } from '@/components/ui/DaisyTooltip';

// import {
  Edit, Eye, Copy, Share, Archive, Trash2, MoreVertical, 
  Play, Pause, Users, Clock, Target, BarChart3, Brain,
  Shield, CheckCircle, AlertTriangle, Calendar, FileText,
  Grid3X3, List, TrendingUp
} from 'lucide-react';

import type { Questionnaire } from '@/types/questionnaire.types';

interface QuestionnaireListProps {
  questionnaires: Questionnaire[];
  onEdit: (_questionnaire: Questionnaire) => void;
  onDuplicate: (_questionnaire: Questionnaire) => void;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}

export function QuestionnaireList({
  questionnaires,
  onEdit,
  onDuplicate,
  onDelete,
  onPublish,
  viewMode = 'grid',
  onViewModeChange
}: QuestionnaireListProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [internalView, setInternalView] = useState<'grid' | 'list'>(viewMode);

  // Use internal state if no external control provided
  const currentView = onViewModeChange ? viewMode : internalView;
  const setView = onViewModeChange || setInternalView;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case 'published': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700';
      case 'review': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'archived': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700';
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
      <DaisyCard className="h-full border-notion-border bg-white dark:bg-notion-bg-secondary hover:shadow-lg transition-all duration-200" >
  <DaisyCardBody className="pb-3" >
</DaisyCard>
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
            
            <DaisyDropdownMenu >
                <DaisyDropdownMenuTrigger asChild >
                  <DaisyButton variant="ghost" size="sm" >
  <MoreVertical className="w-4 h-4" />
</DaisyDropdownMenu>
                </DaisyButton>
              </DaisyDropdownMenuTrigger>
              <DaisyDropdownMenuContent align="end" >
                  <DaisyDropdownMenuItem onClick={() => onEdit(questionnaire)} />
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DaisyDropdownMenuContent>
                <DaisyDropdownMenuItem >
                    <Eye className="w-4 h-4 mr-2" />
                  Preview
                </DaisyDropdownMenuItem>
                <DaisyDropdownMenuItem onClick={() => onDuplicate(questionnaire)} />
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DaisyDropdownMenuItem>
                <DaisyDropdownMenuItem >
                    <Share className="w-4 h-4 mr-2" />
                  Share
                </DaisyDropdownMenuItem>
                <DaisyDropdownMenuSeparator />
{questionnaire.status === 'draft' && (
                  <DaisyDropdownMenuItem onClick={() => onPublish(questionnaire.id)} />
                    <Play className="w-4 h-4 mr-2" />
                    Publish
                  </DaisyDropdownMenuSeparator>
                )}
                {questionnaire.status === 'active' && (
                  <DaisyDropdownMenuItem >
                      <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </DaisyDropdownMenuItem>
                )}
                <DaisyDropdownMenuItem >
                    <Archive className="w-4 h-4 mr-2" />
                  Archive
                </DaisyDropdownMenuItem>
                <DaisyDropdownMenuSeparator / />
<DaisyDropdownMenuItem 
                  onClick={() => onDelete(questionnaire.id)}
                  className="text-red-600 dark:text-red-400" />
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DaisyDropdownMenuSeparator>
              </DaisyDropdownMenuContent>
            </DaisyDropdownMenu>
          </div>

          <div className="flex items-center space-x-2 mt-2">
            <DaisyBadge 
              variant="outline" 
              className={getStatusColor(questionnaire.status)} >
  {questionnaire.status.charAt(0).toUpperCase() + questionnaire.status.slice(1)}
</DaisyBadge>
            </DaisyBadge>
            
            <DaisyBadge variant="outline" className="text-xs" >
  {formatCategory(questionnaire.category)}
</DaisyBadge>
            </DaisyBadge>

            {questionnaire.aiSettings.enabled && (
              <DaisyTooltip>
                  <DaisyTooltipTrigger>
                    <DaisyBadge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800" >
  <Brain className="w-3 h-3 mr-1" />
</DaisyTooltip>
                    AI
                  </DaisyBadge>
                </DaisyTooltipTrigger>
                <DaisyTooltipContent>AI-powered questionnaire</DaisyTooltipContent>
              </DaisyTooltip>
            )}
          </div>
        

        <DaisyCardBody className="space-y-4" >
  <p className="text-sm text-notion-text-secondary line-clamp-2">
</DaisyCardBody>
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
            <DaisyProgress 
              value={questionnaire.analytics.overview.completionRate} 
              className="h-2" />
</div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-notion-border">
            <div className="flex items-center space-x-2 text-xs text-notion-text-secondary">
              <DaisyCalendar className="w-3 h-3" />
<span>Updated {formatDate(questionnaire.updatedAt)}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <DaisyTooltip>
                  <DaisyTooltipTrigger>
                    <DaisyButton variant="ghost" size="sm" onClick={() => onEdit(questionnaire)} />
                    <Edit className="w-3 h-3" />
                  </DaisyProgress>
                </DaisyTooltipTrigger>
                <DaisyTooltipContent>Edit questionnaire</DaisyTooltipContent>
              </DaisyTooltip>
              
              <DaisyTooltip>
                  <DaisyTooltipTrigger>
                    <DaisyButton variant="ghost" size="sm" >
  <BarChart3 className="w-3 h-3" />
</DaisyTooltip>
                  </DaisyButton>
                </DaisyTooltipTrigger>
                <DaisyTooltipContent>View analytics</DaisyTooltipContent>
              </DaisyTooltip>
            </div>
          </div>
        </DaisyCardBody>
      </DaisyCard>
    </motion.div>
  );

  const QuestionnaireListItem = ({ questionnaire }: { questionnaire: Questionnaire }) => (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-full"
    >
      <DaisyCard className="border-notion-border bg-white dark:bg-notion-bg-secondary hover:shadow-md transition-all duration-200" >
  <DaisyCardBody className="p-4" >
  </DaisyCard>
</DaisyCardBody>
          <div className="flex items-center justify-between">
            {/* Left Section - Main Info */}
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="p-2 bg-notion-bg-tertiary rounded-lg flex-shrink-0">
                {getCategoryIcon(questionnaire.category)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-1">
                  <h3 className="font-semibold text-notion-text-primary truncate">
                    {questionnaire.title}
                  </h3>
                  <span className="text-sm text-notion-text-secondary">
                    v{questionnaire.version}
                  </span>
                </div>
                
                <p className="text-sm text-notion-text-secondary line-clamp-1 mb-2">
                  {questionnaire.description}
                </p>
                
                <div className="flex items-center space-x-2">
                  <DaisyBadge 
                    variant="outline" 
                    className={getStatusColor(questionnaire.status)} >
  {questionnaire.status.charAt(0).toUpperCase() + questionnaire.status.slice(1)}
</DaisyBadge>
                  </DaisyBadge>
                  
                  <DaisyBadge variant="outline" className="text-xs" >
  {formatCategory(questionnaire.category)}
</DaisyBadge>
                  </DaisyBadge>

                  {questionnaire.aiSettings.enabled && (
                    <DaisyBadge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800 text-xs" >
  <Brain className="w-3 h-3 mr-1" />
</DaisyBadge>
                      AI
                    </DaisyBadge>
                  )}
                </div>
              </div>
            </div>

            {/* Center Section - Stats */}
            <div className="hidden md:flex items-center space-x-8 flex-shrink-0">
              <div className="text-center">
                <div className="text-lg font-semibold text-notion-text-primary">
                  {questionnaire.analytics.overview.totalResponses}
                </div>
                <div className="text-xs text-notion-text-secondary">Responses</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold text-notion-text-primary">
                  {questionnaire.analytics.overview.completionRate}%
                </div>
                <div className="text-xs text-notion-text-secondary">Completion</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold text-notion-text-primary">
                  {questionnaire.analytics.overview.averageScore}
                </div>
                <div className="text-xs text-notion-text-secondary">Avg Score</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold text-notion-text-primary">
                  {questionnaire.analytics.overview.averageTime}m
                </div>
                <div className="text-xs text-notion-text-secondary">Avg Time</div>
              </div>
            </div>

            {/* Right Section - Date & Actions */}
            <div className="flex items-center space-x-4 flex-shrink-0">
              <div className="hidden lg:flex items-center space-x-2 text-xs text-notion-text-secondary">
                <DaisyCalendar className="w-3 h-3" />
<span>Updated {formatDate(questionnaire.updatedAt)}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <DaisyTooltip>
                    <DaisyTooltipTrigger>
                      <DaisyButton variant="ghost" size="sm" onClick={() => onEdit(questionnaire)} />
                      <Edit className="w-4 h-4" />
                    </DaisyCalendar>
                  </DaisyTooltipTrigger>
                  <DaisyTooltipContent>Edit questionnaire</DaisyTooltipContent>
                </DaisyTooltip>
                
                <DaisyTooltip>
                    <DaisyTooltipTrigger>
                      <DaisyButton variant="ghost" size="sm" >
  <BarChart3 className="w-4 h-4" />
</DaisyTooltip>
                    </DaisyButton>
                  </DaisyTooltipTrigger>
                  <DaisyTooltipContent>View analytics</DaisyTooltipContent>
                </DaisyTooltip>
                
                <DaisyDropdownMenu >
                    <DaisyDropdownMenuTrigger asChild >
                      <DaisyButton variant="ghost" size="sm" >
  <MoreVertical className="w-4 h-4" />
</DaisyDropdownMenu>
                    </DaisyButton>
                  </DaisyDropdownMenuTrigger>
                  <DaisyDropdownMenuContent align="end" >
                      <DaisyDropdownMenuItem >
                        <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </DaisyDropdownMenuContent>
                    <DaisyDropdownMenuItem onClick={() => onDuplicate(questionnaire)} />
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DaisyDropdownMenuItem>
                    <DaisyDropdownMenuItem >
                        <Share className="w-4 h-4 mr-2" />
                      Share
                    </DaisyDropdownMenuItem>
                    <DaisyDropdownMenuSeparator />
{questionnaire.status === 'draft' && (
                      <DaisyDropdownMenuItem onClick={() => onPublish(questionnaire.id)} />
                        <Play className="w-4 h-4 mr-2" />
                        Publish
                      </DaisyDropdownMenuSeparator>
                    )}
                    {questionnaire.status === 'active' && (
                      <DaisyDropdownMenuItem >
                          <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </DaisyDropdownMenuItem>
                    )}
                    <DaisyDropdownMenuItem >
                        <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </DaisyDropdownMenuItem>
                    <DaisyDropdownMenuSeparator / />
<DaisyDropdownMenuItem 
                      onClick={() => onDelete(questionnaire.id)}
                      className="text-red-600 dark:text-red-400" />
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DaisyDropdownMenuSeparator>
                  </DaisyDropdownMenuContent>
                </DaisyDropdownMenu>
              </div>
            </div>
          </div>
        </DaisyCardBody>
      </DaisyCard>
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
        <DaisyButton >
  <FileText className="w-4 h-4 mr-2" />
</DaisyButton>
          Create Questionnaire
        </DaisyButton>
      </motion.div>
    );
  };

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
        
        <div className="flex items-center bg-notion-bg-tertiary rounded-lg p-1">
          <DaisyButton
            variant={currentView === 'grid' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setView('grid')}
            className={currentView === 'grid' 
              ? 'bg-white dark:bg-notion-bg-secondary shadow-sm' 
              : 'text-notion-text-secondary hover:text-notion-text-primary'
            } />
            <Grid3X3 className="w-4 h-4 mr-2" />
            Grid
          </DaisyButton>
          <DaisyButton
            variant={currentView === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setView('list')}
            className={currentView === 'list' 
              ? 'bg-white dark:bg-notion-bg-secondary shadow-sm' 
              : 'text-notion-text-secondary hover:text-notion-text-primary'
            } />
            <List className="w-4 h-4 mr-2" />
            List
          </DaisyButton>
        </div>
      </div>

      {/* Content */}
      {currentView === 'grid' ? (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {questionnaires.map((questionnaire) => (
              <QuestionnaireCard 
                key={questionnaire.id} 
                questionnaire={questionnaire} />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          layout
          className="space-y-3"
        >
          <AnimatePresence>
            {questionnaires.map((questionnaire) => (
              <QuestionnaireListItem 
                key={questionnaire.id} 
                questionnaire={questionnaire} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
} 