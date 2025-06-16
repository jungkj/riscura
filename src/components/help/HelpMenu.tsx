'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import GuidedTour, { TourLauncher } from '@/components/help/GuidedTour';
import {
  HelpCircle,
  Play,
  BookOpen,
  Video,
  MessageCircle,
  ExternalLink,
  Lightbulb,
  Target,
  Shield,
  BarChart3,
  FileText,
  Settings,
  Clock,
  Star
} from 'lucide-react';

interface HelpResource {
  id: string;
  title: string;
  description: string;
  type: 'tour' | 'guide' | 'video' | 'article' | 'support';
  icon: React.ComponentType<any>;
  href?: string;
  tourId?: string;
  duration?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  isNew?: boolean;
  isPopular?: boolean;
}

interface HelpMenuProps {
  onStartTour?: (tourId: string) => void;
  className?: string;
}

export default function HelpMenu({ onStartTour, className = '' }: HelpMenuProps) {
  const [showTour, setShowTour] = useState(false);
  const [selectedTourId, setSelectedTourId] = useState<string>('platform-overview');

  const helpResources: HelpResource[] = [
    {
      id: 'platform-overview-tour',
      title: 'Platform Overview Tour',
      description: 'Get familiar with the main features and navigation',
      type: 'tour',
      icon: Play,
      tourId: 'platform-overview',
      duration: '5-7 min',
      difficulty: 'beginner',
      isPopular: true
    },
    {
      id: 'risk-assessment-tour',
      title: 'Risk Assessment Workflow',
      description: 'Learn how to conduct comprehensive risk assessments',
      type: 'tour',
      icon: Shield,
      tourId: 'risk-assessment-workflow',
      duration: '8-10 min',
      difficulty: 'intermediate'
    },
    {
      id: 'quick-start-guide',
      title: 'Quick Start Guide',
      description: 'Essential steps to get started with risk management',
      type: 'guide',
      icon: BookOpen,
      href: '/help/quick-start',
      duration: '10 min read',
      difficulty: 'beginner',
      isNew: true
    },
    {
      id: 'video-tutorials',
      title: 'Video Tutorials',
      description: 'Watch step-by-step video guides for key features',
      type: 'video',
      icon: Video,
      href: '/help/videos',
      duration: 'Various',
      difficulty: 'beginner'
    },
    {
      id: 'reporting-guide',
      title: 'Advanced Reporting',
      description: 'Create custom reports and dashboards',
      type: 'article',
      icon: BarChart3,
      href: '/help/reporting',
      duration: '15 min read',
      difficulty: 'advanced'
    },
    {
      id: 'compliance-setup',
      title: 'Compliance Framework Setup',
      description: 'Configure compliance frameworks and controls',
      type: 'guide',
      icon: FileText,
      href: '/help/compliance',
      duration: '20 min read',
      difficulty: 'intermediate'
    },
    {
      id: 'contact-support',
      title: 'Contact Support',
      description: 'Get help from our support team',
      type: 'support',
      icon: MessageCircle,
      href: 'mailto:support@riscura.com'
    }
  ];

  const handleResourceClick = (resource: HelpResource) => {
    if (resource.type === 'tour' && resource.tourId) {
      setSelectedTourId(resource.tourId);
      setShowTour(true);
      onStartTour?.(resource.tourId);
    } else if (resource.href) {
      if (resource.href.startsWith('mailto:')) {
        window.location.href = resource.href;
      } else {
        window.open(resource.href, '_blank');
      }
    }
  };

  const handleTourComplete = () => {
    setShowTour(false);
  };

  const handleTourSkip = () => {
    setShowTour(false);
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-50';
      case 'intermediate': return 'text-orange-600 bg-orange-50';
      case 'advanced': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tour': return Play;
      case 'guide': return BookOpen;
      case 'video': return Video;
      case 'article': return FileText;
      case 'support': return MessageCircle;
      default: return HelpCircle;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Guided Tour Component */}
      {showTour && (
        <GuidedTour
          tourId={selectedTourId}
          autoStart={true}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
          showProgress={true}
          allowSkip={true}
        />
      )}

      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full">
          <HelpCircle className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Help & Resources</h1>
        <p className="text-gray-600">Get the most out of your risk management platform</p>
      </div>

      {/* Quick Tours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Guided Tours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {helpResources.filter(r => r.type === 'tour').map((resource) => (
              <div
                key={resource.id}
                onClick={() => handleResourceClick(resource)}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                  <resource.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">{resource.title}</h3>
                    {resource.isPopular && (
                      <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">
                        <Star className="w-3 h-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {resource.duration}
                    </span>
                    {resource.difficulty && (
                      <Badge className={`text-xs ${getDifficultyColor(resource.difficulty)}`}>
                        {resource.difficulty}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Start Tour
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Other Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-green-600" />
            Documentation & Guides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {helpResources.filter(r => r.type !== 'tour').map((resource) => (
              <div
                key={resource.id}
                onClick={() => handleResourceClick(resource)}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                  <resource.icon className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">{resource.title}</h3>
                    {resource.isNew && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                        New
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                  {resource.duration && (
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {resource.duration}
                      </span>
                      {resource.difficulty && (
                        <Badge className={`text-xs ${getDifficultyColor(resource.difficulty)}`}>
                          {resource.difficulty}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedTourId('platform-overview');
                setShowTour(true);
              }}
              className="flex items-center gap-2 h-auto p-4"
            >
              <Play className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">Restart Tour</div>
                <div className="text-xs text-gray-500">Platform overview</div>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('/help/keyboard-shortcuts', '_blank')}
              className="flex items-center gap-2 h-auto p-4"
            >
              <Target className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">Shortcuts</div>
                <div className="text-xs text-gray-500">Keyboard shortcuts</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 