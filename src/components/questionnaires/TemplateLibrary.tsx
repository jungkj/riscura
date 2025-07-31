'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyDialog, DaisyDialogContent, DaisyDialogDescription, DaisyDialogHeader, DaisyDialogTitle } from '@/components/ui/DaisyDialog';
import { DaisySelect } from '@/components/ui/DaisySelect';

import { Search, Eye, Copy, Star, Shield, FileCheck, AlertTriangle, Building, CheckCircle, Tag, TrendingUp, Grid3X3, List, BookOpen, Download } from 'lucide-react';

// Mock template data
const templateCategories = [
  { id: 'all', name: 'All Templates', icon: Grid3X3, count: 24 },
  { id: 'risk-assessment', name: 'Risk Assessment', icon: AlertTriangle, count: 8 },
  { id: 'compliance', name: 'Compliance', icon: FileCheck, count: 6 },
  { id: 'security', name: 'Security', icon: Shield, count: 5 },
  { id: 'vendor', name: 'Vendor Management', icon: Building, count: 3 },
  { id: 'audit', name: 'Audit & Review', icon: CheckCircle, count: 2 }
];

const mockTemplates = [
  {
    id: 'cyber-risk-basic',
    title: 'Cybersecurity Risk Assessment',
    description: 'Comprehensive cybersecurity risk evaluation covering network security, data protection, and incident response capabilities.',
    category: 'security',
    subcategory: 'Cybersecurity',
    difficulty: 'Intermediate',
    estimatedTime: '45-60 minutes',
    questions: 42,
    rating: 4.8,
    uses: 1247,
    tags: ['cybersecurity', 'risk', 'network', 'data-protection'],
    lastUpdated: '2024-01-15',
    isPopular: true,
    isFeatured: true,
    preview: {
      sections: ['Network Security Controls', 'Data Protection Measures', 'Incident Response Procedures', 'Access Management', 'Security Monitoring'],
      sampleQuestions: ['Do you have documented network security policies?', 'How frequently are security assessments conducted?', 'What encryption standards are used for data at rest?']
    }
  },
  {
    id: 'gdpr-compliance',
    title: 'GDPR Compliance Assessment',
    description: 'Evaluate GDPR compliance readiness including data processing, privacy rights, and regulatory requirements.',
    category: 'compliance',
    subcategory: 'Data Privacy',
    difficulty: 'Advanced',
    estimatedTime: '60-90 minutes',
    questions: 56,
    rating: 4.9,
    uses: 892,
    tags: ['gdpr', 'privacy', 'compliance', 'data-protection'],
    lastUpdated: '2024-01-10',
    isPopular: true,
    isFeatured: false,
    preview: {
      sections: ['Lawful Basis for Processing', 'Data Subject Rights', 'Privacy by Design', 'Data Protection Impact Assessments', 'International Transfers'],
      sampleQuestions: ['Have you identified the lawful basis for all data processing activities?', 'Do you have procedures for handling data subject access requests?', 'How do you ensure privacy by design in new systems?']
    }
  },
  {
    id: 'vendor-security',
    title: 'Vendor Security Assessment',
    description: 'Assess third-party vendor security posture and compliance with your organization\'s security standards.',
    category: 'vendor',
    subcategory: 'Third-Party Risk',
    difficulty: 'Intermediate',
    estimatedTime: '30-45 minutes',
    questions: 35,
    rating: 4.6,
    uses: 634,
    tags: ['vendor', 'third-party', 'security', 'risk'],
    lastUpdated: '2024-01-12',
    isPopular: false,
    isFeatured: true,
    preview: {
      sections: ['Security Policies', 'Data Handling Practices', 'Incident Response', 'Compliance Certifications', 'Business Continuity'],
      sampleQuestions: ['What security certifications does your organization hold?', 'How do you handle data breaches involving client data?', 'What backup and recovery procedures are in place?']
    }
  }
];

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  difficulty: string;
  estimatedTime: string;
  questions: number;
  rating: number;
  uses: number;
  tags: string[];
  lastUpdated: string;
  isPopular: boolean;
  isFeatured: boolean;
  preview: {
    sections: string[];
    sampleQuestions: string[];
  };
}

interface TemplateLibraryProps {
  className?: string;
}

export function TemplateLibrary({ className }: TemplateLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating' | 'title'>('popular');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let filtered = mockTemplates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.title.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query)) ||
        template.subcategory.toLowerCase().includes(query)
      );
    }

    // Sort templates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.uses - a.uses;
        case 'recent':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        case 'rating':
          return b.rating - a.rating;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [selectedCategory, searchQuery, sortBy]);

  const handlePreviewTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleCloneTemplate = (template: Template) => {
    console.log(`Cloning template: ${template.title}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = templateCategories.find(cat => cat.id === categoryId);
    return category?.icon || Grid3X3;
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-notion-text-primary">Template Library</h2>
          <p className="text-sm text-notion-text-secondary">
            Browse and import pre-built questionnaire templates
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-notion-text-tertiary w-4 h-4" />
            <DaisyInput
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <DaisySelect value={sortBy} onValueChange={(value: any) => setSortBy(value)} />
            <DaisySelectTrigger className="w-32" />
              <DaisySelectValue /></DaisyInput>
            <DaisySelectContent />
              <DaisySelectItem value="popular">Popular</DaisySelectContent>
              <DaisySelectItem value="recent">Recent</DaisySelectItem>
              <DaisySelectItem value="rating">Rating</DaisySelectItem>
              <DaisySelectItem value="title">Title</DaisySelectItem>
            </DaisySelectContent>
          </DaisySelect>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar - Categories */}
        <div className="lg:w-64 space-y-4">
          <DaisyCard >
  <DaisyCardHeader />
</DaisyCard>
              <DaisyCardTitle className="text-lg">Categories</DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent className="space-y-2" >
  {templateCategories.map((category) => {
</DaisyCardContent>
                const Icon = category.icon;
                const isSelected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'bg-notion-blue text-white'
                        : 'hover:bg-notion-bg-tertiary text-notion-text-primary'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <DaisyBadge variant={isSelected ? 'secondary' : 'outline'} className="text-xs" >
  {category.count}
</DaisyBadge>
                    </DaisyBadge>
                  </button>
                );
              })}
            </DaisyCardContent>
          </DaisyCard>

          {/* Featured Templates */}
          <DaisyCard >
  <DaisyCardHeader />
</DaisyCard>
              <DaisyCardTitle className="text-lg flex items-center" >
  <Star className="w-4 h-4 mr-2 text-yellow-500" />
</DaisyCardTitle>
                Featured
              </DaisyCardTitle>
        </DaisyCardHeader>
        <DaisyCardContent className="space-y-3" >
  {mockTemplates.filter(t => t.isFeatured).slice(0, 3).map((template) => (
</DaisyCardContent>
                <div
                  key={template.id}
                  className="p-3 border border-notion-border rounded-lg hover:bg-notion-bg-tertiary cursor-pointer transition-colors"
                  onClick={() => handlePreviewTemplate(template)}
                >
                  <p className="font-medium text-sm text-notion-text-primary line-clamp-2">
                    {template.title}
                  </p>
                  <div className="flex items-center mt-2 space-x-2">
                    <div className="flex items-center">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-xs text-notion-text-secondary ml-1">
                        {template.rating}
                      </span>
                    </div>
                    <span className="text-xs text-notion-text-tertiary">•</span>
                    <span className="text-xs text-notion-text-secondary">
                      {template.questions} questions
                    </span>
                  </div>
                </div>
              ))}
            </DaisyCardContent>
          </DaisyCard>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-notion-text-secondary">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {/* Templates Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {filteredTemplates.map((template, index) => {
              const Icon = getCategoryIcon(template.category);
              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <DaisyCard className="h-full hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer" >
  <DaisyCardHeader className="pb-3" />
</DaisyCard>
                      <div className="flex items-start justify-between mb-2">
                        <div className="w-10 h-10 bg-notion-bg-tertiary rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-notion-text-secondary" />
                        </div>
                        <div className="flex items-center space-x-1">
                          {template.isPopular && (
                            <DaisyBadge variant="secondary" className="text-xs" >
  <TrendingUp className="w-3 h-3 mr-1" />
</DaisyBadge>
                              Popular
                            </DaisyBadge>
                          )}
                          {template.isFeatured && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                      </div>
                      <DaisyCardTitle className="text-lg line-clamp-2">{template.title}</DaisyCardTitle>
                      <p className="text-sm text-notion-text-secondary line-clamp-3">
                        {template.description}
                      </p>
                    
                    <DaisyCardContent className="pt-0" >
  <div className="space-y-3">
</DaisyCardContent>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-notion-text-tertiary">{template.questions} questions</span>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="font-medium">{template.rating}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-notion-text-tertiary">{template.estimatedTime}</span>
                          <span className="text-notion-text-tertiary">{template.uses.toLocaleString()} uses</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <DaisyBadge className={getDifficultyColor(template.difficulty)} >
  {template.difficulty}
</DaisyBadge>
                          </DaisyBadge>
                          <span className="text-xs text-notion-text-tertiary">
                            Updated {new Date(template.lastUpdated).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                          <DaisyButton 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handlePreviewTemplate(template)} 
                            className="flex-1" />
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </DaisyButton>
                          <DaisyButton 
                            variant="primary" 
                            size="sm" 
                            onClick={() => handleCloneTemplate(template)} 
                            className="flex-1" />
                            <Copy className="w-4 h-4 mr-1" />
                            Clone
                          </DaisyButton>
                        </div>
                      </div>
                    </DaisyCardContent>
                  </DaisyCard>
                </motion.div>
              );
            })}
          </motion.div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-notion-text-tertiary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-notion-text-primary mb-2">
                No templates found
              </h3>
              <p className="text-notion-text-secondary">
                Try adjusting your search terms or browse different categories
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Template Preview Dialog */}
      <DaisyDialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen} />
        <DaisyDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" >
  {selectedTemplate && (
</DaisyDialog>
            <TemplatePreview
              template={selectedTemplate}
              onClone={() => handleCloneTemplate(selectedTemplate)}
              getDifficultyColor={getDifficultyColor}
              getCategoryIcon={getCategoryIcon}
            />
          )}
        </DaisyDialogContent>
      </DaisyDialog>
    </div>
  );
}

// Template Preview Component
interface TemplatePreviewProps {
  template: Template;
  onClone: () => void;
  getDifficultyColor: (difficulty: string) => string;
  getCategoryIcon: (categoryId: string) => any;
}

function TemplatePreview({ 
  template, 
  onClone, 
  getDifficultyColor,
  getCategoryIcon 
}: TemplatePreviewProps) {
  const Icon = getCategoryIcon(template.category);

  return (
    <>
      <DaisyDialogHeader >
  <div className="flex items-center space-x-3 mb-2">
</DaisyDialogHeader>
          <div className="w-12 h-12 bg-notion-bg-tertiary rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-notion-text-secondary" />
          </div>
          <div>
            <DaisyDialogTitle className="text-xl">{template.title}</DaisyDialogTitle>
            <DaisyDialogDescription className="text-notion-text-secondary" >
  {template.subcategory} • {template.questions} questions • {template.estimatedTime}
</DaisyDialogDescription>
            </DaisyDialogDescription>
          </div>
        </div>
      </DaisyDialogHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="font-semibold text-notion-text-primary mb-2">Description</h3>
            <p className="text-notion-text-secondary">{template.description}</p>
          </div>

          <div>
            <h3 className="font-semibold text-notion-text-primary mb-3">Sections Covered</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {template.preview.sections.map((section, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-notion-text-secondary">{section}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-notion-text-primary mb-3">Sample Questions</h3>
            <div className="space-y-3">
              {template.preview.sampleQuestions.map((question, index) => (
                <div key={index} className="p-3 bg-notion-bg-tertiary rounded-lg">
                  <p className="text-sm text-notion-text-secondary">{question}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-notion-text-primary mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {template.tags.map((tag, index) => (
                <DaisyBadge key={index} variant="outline" className="text-xs" >
  <Tag className="w-3 h-3 mr-1" />
</DaisyBadge>
                  {tag}
                </DaisyBadge>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Actions */}
        <div className="space-y-6">
          <div className="p-4 bg-notion-bg-tertiary rounded-lg">
            <h3 className="font-semibold text-notion-text-primary mb-3">Template Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-notion-text-secondary">Rating</span>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="font-medium">{template.rating}</span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-notion-text-secondary">Uses</span>
                <span className="font-medium">{template.uses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-notion-text-secondary">Difficulty</span>
                <DaisyBadge className={getDifficultyColor(template.difficulty)} >
  {template.difficulty}
</DaisyBadge>
                </DaisyBadge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-notion-text-secondary">Last Updated</span>
                <span className="font-medium">
                  {new Date(template.lastUpdated).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <DaisyButton onClick={onClone} className="w-full" >
  <Copy className="w-4 h-4 mr-2" />
</DaisyButton>
              Clone Template
            </DaisyButton>
            <DaisyButton variant="outline" className="w-full" >
  <Download className="w-4 h-4 mr-2" />
</DaisyButton>
              Import to Library
            </DaisyButton>
          </div>

          <div className="p-4 border border-notion-border rounded-lg">
            <h4 className="font-medium text-notion-text-primary mb-2">What's included:</h4>
            <ul className="space-y-1 text-sm text-notion-text-secondary">
              <li>✓ Pre-written questions</li>
              <li>✓ Response scoring logic</li>
              <li>✓ Reporting templates</li>
              <li>✓ Best practice guidance</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
} 