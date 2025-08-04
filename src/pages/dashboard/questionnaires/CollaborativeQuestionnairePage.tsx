'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { toast } from '@/hooks/use-toast';
import { CollaborationPanel } from '@/components/collaboration/CollaborationPanel';
import { RealTimeEditor } from '@/components/collaboration/RealTimeEditor';
import { ShareDialog } from '@/components/collaboration/ShareDialog';

import {
  Users,
  Share2,
  GitBranch,
  MessageCircle,
  Activity,
  Clock,
  Save,
  Eye,
  Edit3,
  Settings,
  ArrowLeft,
  MoreVertical,
  Bell,
  Star,
  BookOpen,
  Download,
  Upload,
  Lock,
  Unlock,
} from 'lucide-react';

// Mock user data for CollaborationPanel
const mockCollaborationUser = {
  id: 'current-user',
  name: 'John Doe',
  email: 'john.doe@company.com',
  avatar: '/avatars/john.jpg',
  role: 'owner' as const,
  status: 'online' as const,
  lastSeen: new Date(),
  permissions: ['view', 'edit', 'comment', 'admin', 'share', 'delete'],
};

// Mock user data for RealTimeEditor
const mockEditorUser = {
  id: 'current-user',
  name: 'John Doe',
  email: 'john.doe@company.com',
  avatar: '/avatars/john.jpg',
  color: '#3b82f6',
  isTyping: false,
  lastActivity: new Date(),
};

// Mock user data for ShareDialog
const mockShareUser = {
  id: 'current-user',
  name: 'John Doe',
  email: 'john.doe@company.com',
  avatar: '/avatars/john.jpg',
  role: 'owner' as const,
  permissions: [
    {
      id: 'perm-1',
      type: 'view' as const,
      granted: true,
      grantedBy: 'system',
      grantedAt: new Date(),
    },
    {
      id: 'perm-2',
      type: 'edit' as const,
      granted: true,
      grantedBy: 'system',
      grantedAt: new Date(),
    },
    {
      id: 'perm-3',
      type: 'comment' as const,
      granted: true,
      grantedBy: 'system',
      grantedAt: new Date(),
    },
    {
      id: 'perm-4',
      type: 'admin' as const,
      granted: true,
      grantedBy: 'system',
      grantedAt: new Date(),
    },
    {
      id: 'perm-5',
      type: 'share' as const,
      granted: true,
      grantedBy: 'system',
      grantedAt: new Date(),
    },
    {
      id: 'perm-6',
      type: 'delete' as const,
      granted: true,
      grantedBy: 'system',
      grantedAt: new Date(),
    },
  ],
  addedBy: 'system',
  addedAt: new Date(),
  status: 'active' as const,
};

// Generic user for display
const mockCurrentUser = {
  id: 'current-user',
  name: 'John Doe',
  email: 'john.doe@company.com',
  avatar: '/avatars/john.jpg',
  role: 'owner' as const,
};

interface CollaborativeQuestionnairePageProps {
  questionnaireId?: string;
  mode?: 'edit' | 'view' | 'collaborate';
}

export default function CollaborativeQuestionnairePage({
  questionnaireId = 'questionnaire-1',
  mode = 'collaborate',
}: CollaborativeQuestionnairePageProps) {
  // State management
  const [currentMode, setCurrentMode] = useState(mode);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [collaborationPanelOpen, setCollaborationPanelOpen] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [isStarred, setIsStarred] = useState(false);
  const [viewerCount, setViewerCount] = useState(4);

  // Questionnaire data
  const [questionnaire, setQuestionnaire] = useState({
    id: questionnaireId,
    title: 'Enterprise Security Risk Assessment',
    description:
      'Comprehensive cybersecurity risk assessment questionnaire for enterprise environments',
    status: 'draft' as const,
    version: '1.2',
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 3600000),
    createdBy: mockCurrentUser,
    lastEditedBy: mockCurrentUser,
    tags: ['security', 'compliance', 'enterprise'],
    category: 'Security Assessment',
    isPublic: false,
    responseCount: 12,
    completionRate: 85,
  });

  // Simulate auto-save
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        // 30% chance of auto-save trigger
        handleAutoSave();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleAutoSave = () => {
    setIsAutoSaving(true);
    setTimeout(() => {
      setIsAutoSaving(false);
      setLastSaved(new Date());

      toast({
        title: 'Auto-saved',
        description: 'Your changes have been automatically saved.',
        duration: 2000,
      });
    }, 1500);
  };

  const handleContentChange = (content: any) => {
    // Update questionnaire content
    setQuestionnaire((prev) => ({
      ...prev,
      updatedAt: new Date(),
      lastEditedBy: mockCurrentUser,
    }));
  };

  const handleUserActivity = (activity: any) => {
    setActivities((prev) => [activity, ...prev.slice(0, 49)]); // Keep last 50 activities
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const handleStar = () => {
    setIsStarred(!isStarred);
    toast({
      title: isStarred ? 'Removed from favorites' : 'Added to favorites',
      description: isStarred
        ? 'Questionnaire removed from your starred list.'
        : 'Questionnaire added to your starred list.',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left section */}
            <div className="flex items-center space-x-4">
              <DaisyButton variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Questionnaires
              </DaisyButton>

              <DaisySeparator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-3">
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{questionnaire.title}</h1>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>v{questionnaire.version}</span>
                    <span>•</span>
                    <DaisyBadge className={getStatusColor(questionnaire.status)}>
                      {questionnaire.status}
                    </DaisyBadge>
                    <span>•</span>
                    <span>{viewerCount} viewing</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-3">
              {/* Auto-save indicator */}
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                {isAutoSaving ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Save className="w-4 h-4" />
                    </motion.div>
                    <span>Saving...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <Save className="w-4 h-4 text-green-500" />
                    <span>Saved {lastSaved.toLocaleTimeString()}</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>Not saved</span>
                  </>
                )}
              </div>

              <DaisySeparator orientation="vertical" className="h-6" />
              {/* Action buttons */}
              <div className="flex items-center space-x-2">
                <DaisyButton variant="ghost" size="sm" onClick={handleStar}>
                  <Star
                    className={`w-4 h-4 ${isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`}
                  />
                </DaisyButton>

                <DaisyButton variant="ghost" size="sm">
                  <Bell className="w-4 h-4" />
                </DaisyButton>

                <DaisyButton variant="ghost" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                </DaisyButton>

                <DaisyButton variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </DaisyButton>

                <DaisyButton variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </DaisyButton>
              </div>

              <DaisySeparator orientation="vertical" className="h-6" />
              {/* Mode switcher */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <DaisyButton
                  variant={currentMode === 'view' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentMode('view')}
                  className="h-8 px-3"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </DaisyButton>
                <DaisyButton
                  variant={currentMode === 'edit' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentMode('edit')}
                  className="h-8 px-3"
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Edit
                </DaisyButton>
                <DaisyButton
                  variant={currentMode === 'collaborate' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentMode('collaborate')}
                  className="h-8 px-3"
                >
                  <Users className="w-4 h-4 mr-1" />
                  Collaborate
                </DaisyButton>
              </div>

              {/* Collaboration toggle */}
              <DaisyButton
                variant="outline"
                size="sm"
                onClick={() => setCollaborationPanelOpen(!collaborationPanelOpen)}
                className={collaborationPanelOpen ? 'bg-blue-50 border-blue-200' : ''}
              >
                <MessageCircle className="w-4 h-4" />
              </DaisyButton>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Main editor area */}
          <div
            className={`flex-1 transition-all duration-300 ${collaborationPanelOpen ? 'mr-80' : ''}`}
          >
            {currentMode === 'collaborate' ? (
              <RealTimeEditor
                documentId={questionnaireId}
                currentUser={mockEditorUser}
                onContentChange={handleContentChange}
                className="h-full"
              />
            ) : (
              <DaisyCard className="h-full">
                <DaisyCardBody>
                  <DaisyCardTitle>
                    {currentMode === 'view' ? 'Preview Mode' : 'Edit Mode'}
                  </DaisyCardTitle>
                </DaisyCardBody>
                <DaisyCardBody>
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{questionnaire.title}</h2>
                      <p className="text-gray-600">{questionnaire.description}</p>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-start space-x-3">
                          <span className="text-sm font-medium text-gray-500 mt-1">1.</span>
                          <div className="flex-1">
                            <p className="font-medium">
                              Does your organization have a documented information security policy?
                            </p>
                            <div className="mt-2 space-x-3">
                              <label className="inline-flex items-center">
                                <input type="radio" name="q1" className="form-radio" />
                                <span className="ml-2">Yes</span>
                              </label>
                              <label className="inline-flex items-center">
                                <input type="radio" name="q1" className="form-radio" />
                                <span className="ml-2">No</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-start space-x-3">
                          <span className="text-sm font-medium text-gray-500 mt-1">2.</span>
                          <div className="flex-1">
                            <p className="font-medium">
                              Are security controls regularly reviewed and updated?
                            </p>
                            <div className="mt-2 space-x-3">
                              <label className="inline-flex items-center">
                                <input type="radio" name="q2" className="form-radio" />
                                <span className="ml-2">Yes</span>
                              </label>
                              <label className="inline-flex items-center">
                                <input type="radio" name="q2" className="form-radio" />
                                <span className="ml-2">No</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </DaisyCardBody>
              </DaisyCard>
            )}
          </div>

          {/* Collaboration panel */}
          <AnimatePresence>
            {collaborationPanelOpen && (
              <motion.div
                initial={{ x: 320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 320, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed right-6 top-20 bottom-6 w-80 z-30"
              >
                <CollaborationPanel
                  questionnaireId={questionnaireId}
                  currentUser={mockCollaborationUser}
                  onUserActivity={handleUserActivity}
                  className="h-full shadow-lg"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Share Dialog */}
      <ShareDialog
        questionnaireId={questionnaireId}
        questionnaireName={questionnaire.title}
        currentUser={mockShareUser}
        isOpen={showShareDialog}
        onOpenChange={setShowShareDialog}
        onShare={(settings) => {
          console.log('Share settings:', settings);
          setShowShareDialog(false);
          toast({
            title: 'Questionnaire Shared',
            description: 'Sharing settings have been updated.',
          });
        }}
      />
    </div>
  );
}
