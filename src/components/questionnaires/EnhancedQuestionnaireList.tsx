'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisyCheckbox } from '@/components/ui/DaisyCheckbox';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { toast } from '@/hooks/use-toast';
import {
import { DaisyCardTitle, DaisySelectTrigger, DaisySelectContent, DaisySelectItem, DaisySelectValue, DaisyDropdownMenu, DaisyDropdownMenuTrigger, DaisyDropdownMenuContent, DaisyDropdownMenuItem, DaisyCalendar } from '@/components/ui/daisy-components';
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import { AdvancedSearchFilter } from '@/components/search/AdvancedSearchFilter';

// import {
  FileText, Calendar, User, MoreVertical, Eye, Edit3, Copy,
  Trash2, Archive, Share2, Download, Upload, Star, Clock,
  Target, CheckCircle, AlertCircle, Users, Tag, Grid,
  List, SortAsc, SortDesc, Filter, Settings, BookOpen,
  BarChart3, TrendingUp, Activity, MapPin, Shield
} from 'lucide-react';

// Enhanced questionnaire interface
interface EnhancedQuestionnaire {
  id: string
  title: string;
  description: string;
  category: 'compliance' | 'security' | 'operational' | 'financial' | 'hr' | 'it';
  status: 'draft' | 'published' | 'archived' | 'in_review';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  updatedAt: Date;
  lastModified: Date;
  createdBy: string;
  assignedTo: string[];
  tags: string[];
  version: string;
  responseCount: number;
  completionRate: number;
  averageScore: number;
  estimatedTime: number; // in minutes
  isPublic: boolean;
  hasDeadline: boolean;
  deadline?: Date;
  industry: string[];
  frameworks: string[];
  sections: number;
  questions: number;
  complexity: 'basic' | 'intermediate' | 'advanced' | 'expert';
  language: string;
  lastActivity: Date;
  collaborators: number;
  isStarred: boolean;
  size: 'small' | 'medium' | 'large' | 'enterprise';
}

// Mock data for demonstration
const mockQuestionnaires: EnhancedQuestionnaire[] = [
  {
    id: 'q1',
    title: 'ISO 27001 Security Assessment',
    description: 'Comprehensive security assessment questionnaire based on ISO 27001 standards',
    category: 'security',
    status: 'published',
    priority: 'high',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-03-10'),
    lastModified: new Date('2024-03-10'),
    createdBy: 'John Smith',
    assignedTo: ['team-security', 'john.doe'],
    tags: ['iso27001', 'security', 'compliance'],
    version: '2.1',
    responseCount: 45,
    completionRate: 87,
    averageScore: 82,
    estimatedTime: 45,
    isPublic: true,
    hasDeadline: true,
    deadline: new Date('2024-04-15'),
    industry: ['Technology', 'Healthcare'],
    frameworks: ['ISO 27001', 'NIST'],
    sections: 8,
    questions: 125,
    complexity: 'advanced',
    language: 'English',
    lastActivity: new Date('2024-03-08'),
    collaborators: 6,
    isStarred: true,
    size: 'large'
  },
  {
    id: 'q2',
    title: 'GDPR Compliance Check',
    description: 'Data protection and privacy compliance questionnaire for GDPR requirements',
    category: 'compliance',
    status: 'published',
    priority: 'critical',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-03-12'),
    lastModified: new Date('2024-03-12'),
    createdBy: 'Sarah Johnson',
    assignedTo: ['legal-team', 'privacy-officer'],
    tags: ['gdpr', 'privacy', 'legal'],
    version: '1.4',
    responseCount: 32,
    completionRate: 94,
    averageScore: 78,
    estimatedTime: 30,
    isPublic: false,
    hasDeadline: true,
    deadline: new Date('2024-03-30'),
    industry: ['All'],
    frameworks: ['GDPR', 'Privacy Shield'],
    sections: 6,
    questions: 89,
    complexity: 'intermediate',
    language: 'English',
    lastActivity: new Date('2024-03-11'),
    collaborators: 4,
    isStarred: false,
    size: 'medium'
  },
  {
    id: 'q3',
    title: 'Financial Risk Assessment',
    description: 'Quarterly financial risk evaluation questionnaire',
    category: 'financial',
    status: 'draft',
    priority: 'medium',
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-13'),
    lastModified: new Date('2024-03-13'),
    createdBy: 'Michael Chen',
    assignedTo: ['finance-team'],
    tags: ['finance', 'risk', 'quarterly'],
    version: '0.8',
    responseCount: 12,
    completionRate: 65,
    averageScore: 71,
    estimatedTime: 25,
    isPublic: false,
    hasDeadline: false,
    industry: ['Financial Services'],
    frameworks: ['Basel III', 'COSO'],
    sections: 5,
    questions: 67,
    complexity: 'intermediate',
    language: 'English',
    lastActivity: new Date('2024-03-13'),
    collaborators: 3,
    isStarred: false,
    size: 'medium'
  },
  {
    id: 'q4',
    title: 'IT Infrastructure Audit',
    description: 'Annual IT infrastructure and security audit questionnaire',
    category: 'it',
    status: 'in_review',
    priority: 'high',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-03-09'),
    lastModified: new Date('2024-03-09'),
    createdBy: 'Lisa Williams',
    assignedTo: ['it-team', 'security-team'],
    tags: ['it', 'infrastructure', 'audit'],
    version: '3.0',
    responseCount: 28,
    completionRate: 72,
    averageScore: 85,
    estimatedTime: 60,
    isPublic: true,
    hasDeadline: true,
    deadline: new Date('2024-04-01'),
    industry: ['Technology'],
    frameworks: ['COBIT', 'ITIL'],
    sections: 10,
    questions: 156,
    complexity: 'expert',
    language: 'English',
    lastActivity: new Date('2024-03-07'),
    collaborators: 8,
    isStarred: true,
    size: 'enterprise'
  },
  {
    id: 'q5',
    title: 'Employee Satisfaction Survey',
    description: 'Quarterly employee satisfaction and engagement survey',
    category: 'hr',
    status: 'published',
    priority: 'medium',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-03-01'),
    lastModified: new Date('2024-03-01'),
    createdBy: 'Emma Davis',
    assignedTo: ['hr-team'],
    tags: ['hr', 'survey', 'engagement'],
    version: '2.2',
    responseCount: 156,
    completionRate: 91,
    averageScore: 76,
    estimatedTime: 15,
    isPublic: false,
    hasDeadline: true,
    deadline: new Date('2024-03-25'),
    industry: ['All'],
    frameworks: ['Custom'],
    sections: 4,
    questions: 42,
    complexity: 'basic',
    language: 'English',
    lastActivity: new Date('2024-02-28'),
    collaborators: 2,
    isStarred: false,
    size: 'small'
  }
]

// Available tags for the system
const availableTags = [
  { id: 'iso27001', name: 'ISO 27001', color: '#3b82f6', count: 15 },
  { id: 'gdpr', name: 'GDPR', color: '#10b981', count: 8 },
  { id: 'security', name: 'Security', color: '#f59e0b', count: 22 },
  { id: 'compliance', name: 'Compliance', color: '#8b5cf6', count: 18 },
  { id: 'finance', name: 'Finance', color: '#ef4444', count: 12 },
  { id: 'hr', name: 'HR', color: '#06b6d4', count: 9 },
  { id: 'it', name: 'IT', color: '#84cc16', count: 14 },
  { id: 'audit', name: 'Audit', color: '#f97316', count: 11 },
  { id: 'risk', name: 'Risk', color: '#dc2626', count: 16 },
]

// Searchable fields configuration
const searchableFields = [
  { key: 'title', label: 'Title', type: 'text' as const },
  { key: 'description', label: 'Description', type: 'text' as const },
  { key: 'category', label: 'Category', type: 'select' as const },
  { key: 'status', label: 'Status', type: 'select' as const },
  { key: 'priority', label: 'Priority', type: 'select' as const },
  { key: 'createdBy', label: 'Created By', type: 'text' as const },
  { key: 'version', label: 'Version', type: 'text' as const },
  { key: 'responseCount', label: 'Response Count', type: 'number' as const },
  { key: 'completionRate', label: 'Completion Rate', type: 'number' as const },
  { key: 'averageScore', label: 'Average Score', type: 'number' as const },
  { key: 'estimatedTime', label: 'Estimated Time', type: 'number' as const },
  { key: 'complexity', label: 'Complexity', type: 'select' as const },
  { key: 'size', label: 'Size', type: 'select' as const },
  { key: 'createdAt', label: 'Created Date', type: 'date' as const },
  { key: 'lastModified', label: 'Last Modified', type: 'date' as const },
]

interface EnhancedQuestionnaireListProps {
  className?: string;
}

export function EnhancedQuestionnaireList({ className }: EnhancedQuestionnaireListProps) {
  // State management
  const [questionnaires, setQuestionnaires] = useState<EnhancedQuestionnaire[]>(mockQuestionnaires)
  const [filteredQuestionnaires, setFilteredQuestionnaires] = useState<EnhancedQuestionnaire[]>(mockQuestionnaires);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [tags, setTags] = useState(availableTags);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortField, setSortField] = useState<keyof EnhancedQuestionnaire>('lastModified');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Handle filtered items change from search component
  const handleFilteredItemsChange = (filtered: EnhancedQuestionnaire[]) => {
    setFilteredQuestionnaires(filtered)
  }

  // Handle selection change from search component
  const handleSelectionChange = (selected: string[]) => {
    setSelectedItems(selected)
  }

  // Handle tags change from search component
  const handleTagsChange = (updatedTags: typeof availableTags) => {
    setTags(updatedTags)
  }

  // Sort questionnaires
  const sortedQuestionnaires = useMemo(() => {
    return [...filteredQuestionnaires].sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField];

      // Handle undefined values
      if (aVal === undefined && bVal === undefined) return 0
      if (aVal === undefined) return sortDirection === 'asc' ? 1 : -1;
      if (bVal === undefined) return sortDirection === 'asc' ? -1 : 1;

      // Handle different data types
      if (aVal instanceof Date && bVal instanceof Date) {
        aVal = aVal.getTime()
        bVal = bVal.getTime();
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aVal! < bVal! ? -1 : aVal! > bVal! ? 1 : 0;
      } else {
        return aVal! > bVal! ? -1 : aVal! < bVal! ? 1 : 0;
      }
    });
  }, [filteredQuestionnaires, sortField, sortDirection]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_review':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security':
        return <Shield className="w-4 h-4" />
      case 'compliance':
        return <CheckCircle className="w-4 h-4" />;
      case 'financial':
        return <BarChart3 className="w-4 h-4" />;
      case 'it':
        return <Settings className="w-4 h-4" />;
      case 'hr':
        return <Users className="w-4 h-4" />;
      case 'operational':
        return <Activity className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  }

  // Handle questionnaire actions
  const handleView = (id: string) => {
    toast({
      title: 'Opening Questionnaire',
      description: 'Redirecting to questionnaire view...',
    })
  }

  const handleEdit = (id: string) => {
    toast({
      title: 'Editing Questionnaire',
      description: 'Redirecting to questionnaire editor...',
    });
  }

  const handleDuplicate = (id: string) => {
    const original = questionnaires.find(q => q.id === id);
    if (original) {
      const duplicate = {
        ...original,
        id: `${id}-copy-${Date.now()}`,
        title: `${original.title} (Copy)`,
        status: 'draft' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastModified: new Date(),
        version: '1.0',
        responseCount: 0,
        isStarred: false
      }
      setQuestionnaires([duplicate, ...questionnaires]);
      toast({
        title: 'Questionnaire Duplicated',
        description: `Created a copy of "${original.title}".`,
      });
    }
  }

  const handleDelete = (id: string) => {
    setQuestionnaires(questionnaires.filter(q => q.id !== id));
    setSelectedItems(selectedItems.filter(item => item !== id));
    toast({
      title: 'Questionnaire Deleted',
      description: 'Questionnaire has been deleted successfully.',
      variant: 'destructive',
    });
  }

  const toggleStar = (id: string) => {
    setQuestionnaires(questionnaires.map(q => 
      q.id === id ? { ...q, isStarred: !q.isStarred } : q
    ));
  }

  // Render questionnaire card
  const renderQuestionnaireCard = (_questionnaire: EnhancedQuestionnaire) => {

  return (
    <motion.div
      key={questionnaire.id}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <DaisyCard className="h-full hover:shadow-md transition-shadow duration-200" >
  <DaisyCardBody className="pb-3" >
</DaisyCard>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <DaisyCheckbox
                checked={selectedItems.includes(questionnaire.id)}
                onCheckedChange={() =>
{
                  setSelectedItems(prev =>
                    prev.includes(questionnaire.id)
                      ? prev.filter(id => id !== questionnaire.id)
                      : [...prev, questionnaire.id]
                  )
                }} />
              {getCategoryIcon(questionnaire.category)}
              <DaisyCardTitle className="text-lg font-semibold line-clamp-2" >
  {questionnaire.title}
</DaisyCheckbox>
              </DaisyCardTitle>
            </div>
            <div className="flex items-center space-x-1">
              <DaisyButton
                variant="ghost"
                size="sm"
                onClick={() => toggleStar(questionnaire.id)}
                className={questionnaire.isStarred ? 'text-yellow-500' : 'text-gray-400'} />
                <Star className={`w-4 h-4 ${questionnaire.isStarred ? 'fill-current' : ''}`} />
              </DaisyButton>
              
              <DaisyDropdownMenu >
                  <DaisyDropdownMenuTrigger asChild >
                    <DaisyButton variant="ghost" size="sm" >
  <MoreVertical className="w-4 h-4" />
</DaisyDropdownMenu>
                  </DaisyButton>
                </DaisyDropdownMenuTrigger>
                <DaisyDropdownMenuContent >
                    <DaisyDropdownMenuItem onClick={() => handleView(questionnaire.id)} />
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </DaisyDropdownMenuContent>
                  <DaisyDropdownMenuItem onClick={() => handleEdit(questionnaire.id)} />
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </DaisyDropdownMenuItem>
                  <DaisyDropdownMenuItem onClick={() => handleDuplicate(questionnaire.id)} />
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </DaisyDropdownMenuItem>
                  <DaisyDropdownMenuSeparator />
<DaisyDropdownMenuItem >
                      <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </DaisyDropdownMenuSeparator>
                  <DaisyDropdownMenuItem >
                      <Download className="w-4 h-4 mr-2" />
                    Export
                  </DaisyDropdownMenuItem>
                  <DaisyDropdownMenuSeparator />
<DaisyDropdownMenuItem 
                    onClick={() => handleDelete(questionnaire.id)}
                    className="text-red-600" />
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DaisyDropdownMenuSeparator>
                </DaisyDropdownMenuContent>
              </DaisyDropdownMenu>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {questionnaire.description}
          </p>
        </DaisyCardBody>
        
        <DaisyCardBody className="space-y-4" >
  {/* Status and Priority Badges */}
</DaisyCardBody>
          <div className="flex items-center space-x-2">
            <DaisyBadge className={getStatusColor(questionnaire.status)} >
  {questionnaire.status.replace('_', ' ')}
</DaisyBadge>
            </DaisyBadge>
            <DaisyBadge className={getPriorityColor(questionnaire.priority)} >
  {questionnaire.priority}
</DaisyBadge>
            </DaisyBadge>
            <DaisyBadge variant="outline" >
  v{questionnaire.version}
</DaisyBadge>
            </DaisyBadge>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span>{questionnaire.responseCount} responses</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              <span>{questionnaire.completionRate}% complete</span>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <span>{questionnaire.averageScore}/100</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>{questionnaire.estimatedTime}min</span>
            </div>
          </div>

          {/* Tags */}
          {questionnaire.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {questionnaire.tags.slice(0, 3).map(tagId => {
                const tag = tags.find(t => t.id === tagId);
                return tag ? (
                  <DaisyBadge key={tagId} variant="outline" className="text-xs" >
  <Tag className="w-3 h-3 mr-1" />
</DaisyBadge>
                    {tag.name}
                  </DaisyBadge>
                ) : null;
              })}
              {questionnaire.tags.length > 3 && (
                <DaisyBadge variant="outline" className="text-xs" >
  +{questionnaire.tags.length - 3} more
</DaisyBadge>
                </DaisyBadge>
              )}
            </div>
          )}

          {/* Footer Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center space-x-2">
              <User className="w-3 h-3" />
              <span>{questionnaire.createdBy}</span>
            </div>
            <div className="flex items-center space-x-2">
              <DaisyCalendar className="w-3 h-3" />
<span>{questionnaire.lastModified.toLocaleDateString()}</span>
            </div>
          </div>

          {/* Deadline Warning */}
          {questionnaire.hasDeadline && questionnaire.deadline && (
            <div className="flex items-center space-x-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
              <DaisyAlertCircle className="w-3 h-3" >
  <span>
</DaisyCalendar>Due: {questionnaire.deadline.toLocaleDateString()}</span>
            </div>
          )}
        </DaisyCardBody>
      </DaisyCard>
    </motion.div>
  );}

  // Render questionnaire list item
  const renderQuestionnaireListItem = (_questionnaire: EnhancedQuestionnaire) => (
    <motion.div
      key={questionnaire.id}
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="border-b last:border-b-0"
    >
      <div className="flex items-center space-x-4 p-4 hover:bg-gray-50">
        <DaisyCheckbox
          checked={selectedItems.includes(questionnaire.id)}
          onCheckedChange={() =>
{
            setSelectedItems(prev =>
              prev.includes(questionnaire.id)
                ? prev.filter(id => id !== questionnaire.id)
                : [...prev, questionnaire.id]
            )
          }} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            {getCategoryIcon(questionnaire.category)}
            <h3 className="font-semibold truncate">{questionnaire.title}</h3>
            <div className="flex items-center space-x-2">
              <DaisyBadge className={getStatusColor(questionnaire.status)} >
  {questionnaire.status.replace('_', ' ')}
</DaisyCheckbox>
              </DaisyBadge>
              <DaisyBadge className={getPriorityColor(questionnaire.priority)} >
  {questionnaire.priority}
</DaisyBadge>
              </DaisyBadge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1 truncate">
            {questionnaire.description}
          </p>
          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
            <span>{questionnaire.responseCount} responses</span>
            <span>{questionnaire.completionRate}% complete</span>
            <span>Score: {questionnaire.averageScore}/100</span>
            <span>{questionnaire.estimatedTime}min</span>
            <span>Modified: {questionnaire.lastModified.toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <DaisyButton
            variant="ghost"
            size="sm"
            onClick={() => toggleStar(questionnaire.id)}
            className={questionnaire.isStarred ? 'text-yellow-500' : 'text-gray-400'} />
            <Star className={`w-4 h-4 ${questionnaire.isStarred ? 'fill-current' : ''}`} />
          </DaisyButton>
          
          <DaisyDropdownMenu >
              <DaisyDropdownMenuTrigger asChild >
                <DaisyButton variant="ghost" size="sm" >
  <MoreVertical className="w-4 h-4" />
</DaisyDropdownMenu>
              </DaisyButton>
            </DaisyDropdownMenuTrigger>
            <DaisyDropdownMenuContent >
                <DaisyDropdownMenuItem onClick={() => handleView(questionnaire.id)} />
                <Eye className="w-4 h-4 mr-2" />
                View
              </DaisyDropdownMenuContent>
              <DaisyDropdownMenuItem onClick={() => handleEdit(questionnaire.id)} />
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </DaisyDropdownMenuItem>
              <DaisyDropdownMenuItem onClick={() => handleDuplicate(questionnaire.id)} />
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DaisyDropdownMenuItem>
              <DaisyDropdownMenuSeparator />
<DaisyDropdownMenuItem 
                onClick={() => handleDelete(questionnaire.id)}
                className="text-red-600" />
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DaisyDropdownMenuSeparator>
            </DaisyDropdownMenuContent>
          </DaisyDropdownMenu>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Advanced Search and Filter Component */}
      <AdvancedSearchFilter
        items={questionnaires}
        onFilteredItemsChange={handleFilteredItemsChange}
        onSelectionChange={handleSelectionChange}
        searchableFields={searchableFields}
        availableTags={tags}
        onTagsChange={handleTagsChange} />

      {/* View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <DaisyLabel className="text-sm font-medium">Sort by:</DaisyLabel>
            <DaisySelect value={sortField} onValueChange={(value) => setSortField(value as keyof EnhancedQuestionnaire)} />
              <DaisySelectTrigger className="w-40">
                  <DaisySelectValue />
</DaisySelect>
              <DaisySelectContent >
                  <DaisySelectItem value="lastModified">Last Modified</DaisySelectItem>
                <DaisySelectItem value="title">Title</DaisySelectItem>
                <DaisySelectItem value="createdAt">Created Date</DaisySelectItem>
                <DaisySelectItem value="responseCount">Response Count</DaisySelectItem>
                <DaisySelectItem value="completionRate">Completion Rate</DaisySelectItem>
                <DaisySelectItem value="averageScore">Average Score</DaisySelectItem>
                <DaisySelectItem value="priority">Priority</DaisySelectItem>
                <DaisySelectItem value="status">Status</DaisySelectItem>
              </DaisySelectContent>
            </DaisySelect>
            
            <DaisyButton
              variant="outline"
              size="sm"
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')} />
              {sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </DaisyButton>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <DaisyButton
            variant={viewMode === 'grid' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')} />
            <Grid className="w-4 h-4" />
          </DaisyButton>
          <DaisyButton
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')} />
            <List className="w-4 h-4" />
          </DaisyButton>
        </div>
      </div>

      {/* Questionnaires Display */}
      <AnimatePresence mode="wait">
        {sortedQuestionnaires.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questionnaires found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or create a new questionnaire.</p>
          </motion.div>
        ) : (
          <motion.div
            key={viewMode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedQuestionnaires.map(renderQuestionnaireCard)}
              </div>
            ) : (
              <DaisyCard >
  <div className="divide-y">
</DaisyCard>
                  {sortedQuestionnaires.map(renderQuestionnaireListItem)}
                </div>
              </DaisyCard>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 