'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisyLabel } from '@/components/ui/DaisyLabel';
import { DaisySwitch } from '@/components/ui/DaisySwitch';
import { DaisySelect } from '@/components/ui/DaisySelect';
import { DaisyTabs, DaisyTabsContent, DaisyTabsList, DaisyTabsTrigger } from '@/components/ui/DaisyTabs';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { DaisyAvatar, DaisyAvatarFallback, DaisyAvatarImage } from '@/components/ui/DaisyAvatar';
import { DaisyScrollArea } from '@/components/ui/DaisyScrollArea';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  Users, MessageCircle, GitBranch, Share2, UserPlus, Bell,
  Clock, Eye, Edit3, Star, Heart, ThumbsUp, Reply, Trash2,
  MoreVertical, Send, Plus, X, Calendar, User, Activity,
  Copy, Link, Mail, Settings, Globe, Lock, Shield, Crown,
  Zap, CheckCircle, AlertCircle, Info, History, Download,
  Upload, Merge, Tag, FileText, Image, Video,
  Paperclip, Hash, Smile, Bookmark, Flag, Filter
} from 'lucide-react';

// Types for collaboration features
interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer' | 'commenter';
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Date;
  permissions: string[];
}

interface Comment {
  id: string;
  content: string;
  authorId: string;
  author: CollaborationUser;
  createdAt: Date;
  updatedAt?: Date;
  parentId?: string;
  replies: Comment[];
  reactions: Reaction[];
  attachments: Attachment[];
  mentions: string[];
  isResolved: boolean;
  isEdited: boolean;
  targetType: 'questionnaire' | 'section' | 'question';
  targetId: string;
  position?: { x: number; y: number };
}

interface Reaction {
  id: string;
  type: 'like' | 'love' | 'laugh' | 'angry' | 'sad' | 'celebrate';
  userId: string;
  user: CollaborationUser;
  createdAt: Date;
}

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'video' | 'audio' | 'link';
  url: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
}

interface Version {
  id: string;
  version: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  changes: Change[];
  isPublished: boolean;
  isCurrent: boolean;
  parentVersion?: string;
  branchName?: string;
  tags: string[];
}

interface Change {
  id: string;
  type: 'create' | 'update' | 'delete' | 'move' | 'rename';
  target: string;
  targetType: 'questionnaire' | 'section' | 'question' | 'option';
  before?: any;
  after?: any;
  description: string;
  timestamp: Date;
  userId: string;
}

interface Activity {
  id: string;
  type: 'comment' | 'edit' | 'share' | 'assign' | 'version' | 'permission' | 'reaction';
  description: string;
  userId: string;
  user: CollaborationUser;
  timestamp: Date;
  metadata: any;
  targetType: 'questionnaire' | 'section' | 'question';
  targetId: string;
}

interface ShareSettings {
  id: string;
  type: 'public' | 'private' | 'organization' | 'team' | 'custom';
  allowedUsers: string[];
  allowedRoles: string[];
  permissions: {
    view: boolean;
    comment: boolean;
    edit: boolean;
    admin: boolean;
    share: boolean;
  };
  expiresAt?: Date;
  requiresApproval: boolean;
  allowDownload: boolean;
  watermark: boolean;
}

interface Assignment {
  id: string;
  questionnaireId: string;
  assignedTo: string[];
  assignedBy: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'review' | 'completed' | 'overdue';
  instructions?: string;
  completedAt?: Date;
  createdAt: Date;
}

interface CollaborationPanelProps {
  questionnaireId: string;
  currentUser: CollaborationUser;
  onUserActivity?: (activity: Activity) => void;
  className?: string;
}

export function CollaborationPanel({
  questionnaireId,
  currentUser,
  onUserActivity,
  className
}: CollaborationPanelProps) {
  // State management
  const [activeUsers, setActiveUsers] = useState<CollaborationUser[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [shareSettings, setShareSettings] = useState<ShareSettings | null>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState('comments');
  const [newComment, setNewComment] = useState('');
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [commentFilter, setCommentFilter] = useState<'all' | 'unresolved' | 'mentions'>('all');
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);

  // Mock data initialization
  useEffect(() => {
    initializeMockData();
    
    if (isRealTimeEnabled) {
      const interval = setInterval(() => {
        simulateRealTimeUpdates();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [isRealTimeEnabled]);

  const initializeMockData = () => {
    // Mock active users
    const mockUsers: CollaborationUser[] = [
      {
        id: 'user-1',
        name: 'John Smith',
        email: 'john.smith@company.com',
        avatar: '/avatars/john.jpg',
        role: 'editor',
        status: 'online',
        lastSeen: new Date(),
        permissions: ['view', 'edit', 'comment']
      },
      {
        id: 'user-2',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        avatar: '/avatars/sarah.jpg',
        role: 'admin',
        status: 'online',
        lastSeen: new Date(Date.now() - 300000),
        permissions: ['view', 'edit', 'comment', 'admin', 'share']
      },
      {
        id: 'user-3',
        name: 'Mike Wilson',
        email: 'mike.wilson@company.com',
        role: 'viewer',
        status: 'away',
        lastSeen: new Date(Date.now() - 900000),
        permissions: ['view', 'comment']
      },
      {
        id: 'user-4',
        name: 'Emily Chen',
        email: 'emily.chen@company.com',
        role: 'owner',
        status: 'online',
        lastSeen: new Date(),
        permissions: ['view', 'edit', 'comment', 'admin', 'share', 'delete']
      }
    ];

    // Mock comments
    const mockComments: Comment[] = [
      {
        id: 'comment-1',
        content: 'This question needs clarification. The wording could be more specific about compliance requirements.',
        authorId: 'user-1',
        author: mockUsers[0],
        createdAt: new Date(Date.now() - 3600000),
        parentId: undefined,
        replies: [],
        reactions: [
          {
            id: 'reaction-1',
            type: 'like',
            userId: 'user-2',
            user: mockUsers[1],
            createdAt: new Date(Date.now() - 3000000)
          }
        ],
        attachments: [],
        mentions: [],
        isResolved: false,
        isEdited: false,
        targetType: 'question',
        targetId: 'question-1'
      },
      {
        id: 'comment-2',
        content: 'Great suggestion! I\'ve updated the question to be more specific. @sarah.johnson please review.',
        authorId: 'user-4',
        author: mockUsers[3],
        createdAt: new Date(Date.now() - 1800000),
        parentId: 'comment-1',
        replies: [],
        reactions: [],
        attachments: [],
        mentions: ['user-2'],
        isResolved: false,
        isEdited: false,
        targetType: 'question',
        targetId: 'question-1'
      }
    ];

    // Mock versions
    const mockVersions: Version[] = [
      {
        id: 'version-1',
        version: '1.0',
        title: 'Initial Version',
        description: 'First version of the questionnaire',
        createdBy: 'user-4',
        createdAt: new Date(Date.now() - 86400000),
        changes: [],
        isPublished: true,
        isCurrent: false,
        branchName: 'main',
        tags: ['initial', 'baseline']
      },
      {
        id: 'version-2',
        version: '1.1',
        title: 'Security Questions Update',
        description: 'Added new security compliance questions',
        createdBy: 'user-1',
        createdAt: new Date(Date.now() - 43200000),
        changes: [
          {
            id: 'change-1',
            type: 'create',
            target: 'question-5',
            targetType: 'question',
            description: 'Added new security question about data encryption',
            timestamp: new Date(Date.now() - 43200000),
            userId: 'user-1'
          }
        ],
        isPublished: false,
        isCurrent: true,
        parentVersion: 'version-1',
        branchName: 'main',
        tags: ['security', 'compliance']
      }
    ];

    // Mock activities
    const mockActivities: Activity[] = [
      {
        id: 'activity-1',
        type: 'comment',
        description: 'John Smith commented on Question 1',
        userId: 'user-1',
        user: mockUsers[0],
        timestamp: new Date(Date.now() - 3600000),
        metadata: { commentId: 'comment-1' },
        targetType: 'question',
        targetId: 'question-1'
      },
      {
        id: 'activity-2',
        type: 'edit',
        description: 'Emily Chen updated Section 2',
        userId: 'user-4',
        user: mockUsers[3],
        timestamp: new Date(Date.now() - 7200000),
        metadata: { changes: 3 },
        targetType: 'section',
        targetId: 'section-2'
      }
    ];

    setActiveUsers(mockUsers);
    setComments(mockComments);
    setVersions(mockVersions);
    setActivities(mockActivities);
  };

  const simulateRealTimeUpdates = () => {
    // Simulate random user status updates
    setActiveUsers(prev => prev.map(user => ({
      ...user,
      status: Math.random() > 0.7 ? 'away' : user.status,
      lastSeen: user.status === 'online' ? new Date() : user.lastSeen
    })));
  };

  // Comment functions
  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      content: newComment,
      authorId: currentUser.id,
      author: currentUser,
      createdAt: new Date(),
      parentId: selectedComment?.id,
      replies: [],
      reactions: [],
      attachments: [],
      mentions: [],
      isResolved: false,
      isEdited: false,
      targetType: 'questionnaire',
      targetId: questionnaireId
    };

    if (selectedComment) {
      setComments(prev => prev.map(c => 
        c.id === selectedComment.id 
          ? { ...c, replies: [...c.replies, comment] }
          : c
      ));
    } else {
      setComments(prev => [comment, ...prev]);
    }

    const activity: Activity = {
      id: `activity-${Date.now()}`,
      type: 'comment',
      description: `${currentUser.name} added a comment`,
      userId: currentUser.id,
      user: currentUser,
      timestamp: new Date(),
      metadata: { commentId: comment.id },
      targetType: 'questionnaire',
      targetId: questionnaireId
    };

    setActivities(prev => [activity, ...prev]);
    onUserActivity?.(activity);

    setNewComment('');
    setSelectedComment(null);

    toast({
      title: 'Comment Added',
      description: 'Your comment has been posted successfully.',
    });
  };

  const handleReactionAdd = (commentId: string, reactionType: Reaction['type']) => {
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        const existingReaction = comment.reactions.find(r => r.userId === currentUser.id);
        if (existingReaction) {
          return {
            ...comment,
            reactions: comment.reactions.filter(r => r.userId !== currentUser.id)
          };
        } else {
          return {
            ...comment,
            reactions: [...comment.reactions, {
              id: `reaction-${Date.now()}`,
              type: reactionType,
              userId: currentUser.id,
              user: currentUser,
              createdAt: new Date()
            }]
          };
        }
      }
      return comment;
    }));
  };

  const handleResolveComment = (commentId: string) => {
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, isResolved: !c.isResolved } : c
    ));
  };

  // Version control functions
  const handleCreateVersion = (title: string, description: string) => {
    const newVersion: Version = {
      id: `version-${Date.now()}`,
      version: `1.${versions.length + 1}`,
      title,
      description,
      createdBy: currentUser.id,
      createdAt: new Date(),
      changes: [],
      isPublished: false,
      isCurrent: true,
      parentVersion: versions.find(v => v.isCurrent)?.id,
      branchName: 'main',
      tags: []
    };

    setVersions(prev => [
      newVersion,
      ...prev.map(v => ({ ...v, isCurrent: false }))
    ]);

    toast({
      title: 'Version Created',
      description: `Version ${newVersion.version} has been created.`,
    });
  };

  // Share functions
  const handleShare = (settings: Partial<ShareSettings>) => {
    const shareSettings: ShareSettings = {
      id: `share-${Date.now()}`,
      type: 'private',
      allowedUsers: [],
      allowedRoles: [],
      permissions: {
        view: true,
        comment: false,
        edit: false,
        admin: false,
        share: false
      },
      requiresApproval: false,
      allowDownload: true,
      watermark: false,
      ...settings
    };

    setShareSettings(shareSettings);

    toast({
      title: 'Sharing Updated',
      description: 'Questionnaire sharing settings have been updated.',
    });
  };

  // Filter comments
  const filteredComments = useMemo(() => {
    switch (commentFilter) {
      case 'unresolved':
        return comments.filter(c => !c.isResolved);
      case 'mentions':
        return comments.filter(c => c.mentions.includes(currentUser.id));
      default:
        return comments;
    }
  }, [comments, commentFilter, currentUser.id]);

  // Get user status color
  const getUserStatusColor = (status: CollaborationUser['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: CollaborationUser['role']) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'editor': return 'bg-blue-100 text-blue-800';
      case 'commenter': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Render comment component
  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`space-y-3 ${isReply ? 'ml-8 pl-4 border-l-2 border-gray-200' : ''}`}>
      <div className="flex items-start space-x-3">
        <DaisyAvatar className="w-8 h-8">
          <DaisyAvatarImage src={comment.author.avatar} />
          <DaisyAvatarFallback>{comment.author.name.split(' ').map(n => n[0]).join('')}</DaisyAvatarFallback>
        </DaisyAvatar>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm">{comment.author.name}</span>
            <DaisyBadge className={`text-xs ${getRoleBadgeColor(comment.author.role)}`}>
              {comment.author.role}
            </DaisyBadge>
            <span className="text-xs text-gray-500">
              {comment.createdAt.toLocaleString()}
            </span>
            {comment.isEdited && (
              <DaisyBadge variant="outline" className="text-xs">edited</DaisyBadge>
            )}
          </div>
          
          <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">
            {comment.content}
          </div>
          
          {/* Reactions */}
          {comment.reactions.length > 0 && (
            <div className="flex items-center space-x-1">
              {['like', 'love', 'laugh'].map(type => {
                const reactions = comment.reactions.filter(r => r.type === type);
                if (reactions.length === 0) return null;
                
                return (
                  <DaisyButton
                    key={type}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleReactionAdd(comment.id, type as Reaction['type'])}
                  >
                    {type === 'like' && '👍'}
                    {type === 'love' && '❤️'}
                    {type === 'laugh' && '😄'}
                    <span className="ml-1">{reactions.length}</span>
                  </DaisyButton>
                );
              })}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center space-x-2 text-xs">
            <DaisyButton 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2"
              onClick={() => handleReactionAdd(comment.id, 'like')}
            >
              <ThumbsUp className="w-3 h-3 mr-1" />
              Like
            </DaisyButton>
            <DaisyButton 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2"
              onClick={() => setSelectedComment(comment)}
            >
              <Reply className="w-3 h-3 mr-1" />
              Reply
            </DaisyButton>
            <DaisyButton 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2"
              onClick={() => handleResolveComment(comment.id)}
            >
              <CheckCircle className={`w-3 h-3 mr-1 ${comment.isResolved ? 'text-green-600' : ''}`} />
              {comment.isResolved ? 'Resolved' : 'Resolve'}
            </DaisyButton>
          </div>
        </div>
      </div>
      
      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <DaisyTooltipProvider>
      <DaisyCard className={`h-full ${className}`}>
        <DaisyCardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <DaisyCardTitle className="text-lg flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Collaboration
            </DaisyCardTitle>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {activeUsers.slice(0, 4).map(user => (
                  <DaisyTooltip key={user.id}>
                    <DaisyTooltipTrigger>
                      <div className="relative">
                        <DaisyAvatar className="w-6 h-6">
                          <DaisyAvatarImage src={user.avatar} />
                          <DaisyAvatarFallback className="text-xs">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </DaisyAvatarFallback>
                        </DaisyAvatar>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${getUserStatusColor(user.status)}`} />
                      </div>
                    </DaisyTooltipTrigger>
                    <DaisyTooltipContent>
                      <p>{user.name} - {user.status}</p>
                    </DaisyTooltipContent>
                  </DaisyTooltip>
                ))}
                {activeUsers.length > 4 && (
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium">
                    +{activeUsers.length - 4}
                  </div>
                )}
              </div>
              
              <DaisySeparator orientation="vertical" className="h-4" />
              
              <DaisyButton variant="ghost" size="sm" onClick={() => setShowShareDialog(true)}>
                <Share2 className="w-4 h-4" />
              </DaisyButton>
              
              <DaisyButton variant="ghost" size="sm" onClick={() => setShowAssignDialog(true)}>
                <UserPlus className="w-4 h-4" />
              </DaisyButton>
            </div>
          </div>
        
        
        <DaisyCardContent className="p-0">
          <DaisyTabs value={activeTab} onValueChange={setActiveTab}>
            <div className="px-6">
              <DaisyTabsList className="grid w-full grid-cols-4">
                <DaisyTabsTrigger value="comments" className="text-xs">
                  Comments
                  {comments.length > 0 && (
                    <DaisyBadge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                      {comments.length}
                    </DaisyBadge>
                  )}
                </DaisyTabsTrigger>
                <DaisyTabsTrigger value="versions" className="text-xs">
                  Versions
                </DaisyTabsTrigger>
                <DaisyTabsTrigger value="activity" className="text-xs">
                  Activity
                </DaisyTabsTrigger>
                <DaisyTabsTrigger value="team" className="text-xs">
                  Team
                </DaisyTabsTrigger>
              </DaisyTabsList>
            </div>
            
            {/* Comments Tab */}
            <DaisyTabsContent value="comments" className="mt-0">
              <div className="px-6 py-4 border-b">
                <div className="flex items-center justify-between mb-4">
                  <DaisySelect value={commentFilter} onValueChange={(value: any) => setCommentFilter(value)}>
                    <DaisySelectTrigger className="w-32">
                      <DaisySelectValue />
                    </SelectTrigger>
                    <DaisySelectContent>
                      <DaisySelectItem value="all">All</SelectItem>
                      <DaisySelectItem value="unresolved">Unresolved</SelectItem>
                      <DaisySelectItem value="mentions">Mentions</SelectItem>
                    </SelectContent>
                  </DaisySelect>
                  
                  <div className="flex items-center space-x-2">
                    <DaisySwitch
                      checked={isRealTimeEnabled}
                      onCheckedChange={setIsRealTimeEnabled}
                    />
                    <DaisyLabel className="text-sm">Real-time</DaisyLabel>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <DaisyTextarea
                    placeholder={selectedComment ? `Reply to ${selectedComment.author.name}...` : "Add a comment..."}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px]"
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {selectedComment && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Reply className="w-4 h-4" />
                          Replying to {selectedComment.author.name}
                          <DaisyButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedComment(null)}
                          >
                            <X className="w-3 h-3" />
                          </DaisyButton>
                        </div>
                      )}
                    </div>
                    
                    <DaisyButton size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                      <Send className="w-4 h-4 mr-2" />
                      {selectedComment ? 'Reply' : 'Comment'}
                    </DaisyButton>
                  </div>
                </div>
              </div>
              
              <DaisyScrollArea className="h-[400px] px-6">
                <div className="space-y-6 py-4">
                  {filteredComments.map(comment => renderComment(comment))}
                  
                  {filteredComments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No comments yet</p>
                      <p className="text-sm">Be the first to start a conversation</p>
                    </div>
                  )}
                </div>
              </DaisyScrollArea>
            </DaisyTabsContent>
            
            {/* Versions Tab */}
            <DaisyTabsContent value="versions" className="mt-0">
              <div className="px-6 py-4 border-b">
                <DaisyButton size="sm" onClick={() => setShowVersionDialog(true)}>
                  <GitBranch className="w-4 h-4 mr-2" />
                  Create Version
                </DaisyButton>
              </div>
              
              <DaisyScrollArea className="h-[400px] px-6">
                <div className="space-y-4 py-4">
                  {versions.map(version => (
                    <div key={version.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <DaisyBadge variant={version.isCurrent ? "default" : "outline"}>
                            v{version.version}
                          </DaisyBadge>
                          {version.isCurrent && (
                            <DaisyBadge variant="secondary">Current</DaisyBadge>
                          )}
                          {version.isPublished && (
                            <DaisyBadge className="bg-green-100 text-green-800">Published</DaisyBadge>
                          )}
                        </div>
                        
                        <DaisyDropdownMenu>
                          <DaisyDropdownMenuTrigger asChild>
                            <DaisyButton variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </DaisyButton>
                          </DaisyDropdownMenuTrigger>
                          <DaisyDropdownMenuContent>
                            <DaisyDropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Changes
                            </DaisyDropdownMenuItem>
                            <DaisyDropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DaisyDropdownMenuItem>
                            <DaisyDropdownMenuSeparator />
                            <DaisyDropdownMenuItem>
                              <GitBranch className="w-4 h-4 mr-2" />
                              Create Branch
                            </DaisyDropdownMenuItem>
                          </DaisyDropdownMenuContent>
                        </DaisyDropdownMenu>
                      </div>
                      
                      <div>
                        <h4 className="font-medium">{version.title}</h4>
                        <p className="text-sm text-gray-600">{version.description}</p>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{version.createdAt.toLocaleString()}</span>
                        <span>{version.changes.length} changes</span>
                      </div>
                      
                      {version.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {version.tags.map(tag => (
                            <DaisyBadge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </DaisyBadge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </DaisyScrollArea>
            </DaisyTabsContent>
            
            {/* Activity Tab */}
            <DaisyTabsContent value="activity" className="mt-0">
              <DaisyScrollArea className="h-[500px] px-6">
                <div className="space-y-4 py-4">
                  {activities.map(activity => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <DaisyAvatar className="w-8 h-8">
                        <DaisyAvatarImage src={activity.user.avatar} />
                        <DaisyAvatarFallback className="text-xs">
                          {activity.user.name.split(' ').map(n => n[0]).join('')}
                        </DaisyAvatarFallback>
                      </DaisyAvatar>
                      
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {activity.timestamp.toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center">
                        {activity.type === 'comment' && <MessageCircle className="w-4 h-4 text-blue-500" />}
                        {activity.type === 'edit' && <Edit3 className="w-4 h-4 text-green-500" />}
                        {activity.type === 'share' && <Share2 className="w-4 h-4 text-purple-500" />}
                        {activity.type === 'version' && <GitBranch className="w-4 h-4 text-orange-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </DaisyScrollArea>
            </DaisyTabsContent>
            
            {/* Team Tab */}
            <DaisyTabsContent value="team" className="mt-0">
              <div className="px-6 py-4 border-b">
                <DaisyButton size="sm" onClick={() => setShowAssignDialog(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Member
                </DaisyButton>
              </div>
              
              <DaisyScrollArea className="h-[400px] px-6">
                <div className="space-y-4 py-4">
                  {activeUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <DaisyAvatar className="w-10 h-10">
                            <DaisyAvatarImage src={user.avatar} />
                            <DaisyAvatarFallback>
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </DaisyAvatarFallback>
                          </DaisyAvatar>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getUserStatusColor(user.status)}`} />
                        </div>
                        
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <DaisyBadge className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </DaisyBadge>
                        
                        <DaisyDropdownMenu>
                          <DaisyDropdownMenuTrigger asChild>
                            <DaisyButton variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </DaisyButton>
                          </DaisyDropdownMenuTrigger>
                          <DaisyDropdownMenuContent>
                            <DaisyDropdownMenuItem>
                              <Edit3 className="w-4 h-4 mr-2" />
                              Change Role
                            </DaisyDropdownMenuItem>
                            <DaisyDropdownMenuItem>
                              <Mail className="w-4 h-4 mr-2" />
                              Send Message
                            </DaisyDropdownMenuItem>
                            <DaisyDropdownMenuSeparator />
                            <DaisyDropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
                            </DaisyDropdownMenuItem>
                          </DaisyDropdownMenuContent>
                        </DaisyDropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </DaisyScrollArea>
            </DaisyTabsContent>
          </DaisyTabs>
        </DaisyCardBody>
        
        {/* Share Dialog */}
        <DaisyDialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DaisyDialogContent className="max-w-2xl">
            <DaisyDialogHeader>
              <DaisyDialogTitle>Share Questionnaire</DaisyDialogTitle>
              <DaisyDialogDescription>
                Configure sharing settings and permissions for this questionnaire.
              </DaisyDialogDescription>
            </DaisyDialogHeader>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <DaisyLabel>Sharing Type</DaisyLabel>
                <DaisySelect defaultValue="private">
                  <DaisySelectTrigger>
                    <DaisySelectValue />
                  </SelectTrigger>
                  <DaisySelectContent>
                    <DaisySelectItem value="private">Private - Specific people</SelectItem>
                    <DaisySelectItem value="organization">Organization - Anyone in org</SelectItem>
                    <DaisySelectItem value="public">Public - Anyone with link</SelectItem>
                  </SelectContent>
                </DaisySelect>
              </div>
              
              <div className="space-y-4">
                <DaisyLabel>Permissions</DaisyLabel>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">View</p>
                      <p className="text-sm text-gray-600">Can view the questionnaire</p>
                    </div>
                    <DaisySwitch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Comment</p>
                      <p className="text-sm text-gray-600">Can add comments</p>
                    </div>
                    <DaisySwitch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Edit</p>
                      <p className="text-sm text-gray-600">Can edit content</p>
                    </div>
                    <DaisySwitch />
                  </div>
                </div>
              </div>
            </div>
            
            <DaisyDialogFooter>
              <DaisyButton variant="outline" onClick={() => setShowShareDialog(false)}>
                Cancel
              </DaisyButton>
              <DaisyButton onClick={() => {
                handleShare({});
                setShowShareDialog(false);
              }}>
                Share
              </DaisyButton>
            </DaisyDialogFooter>
          </DaisyDialogContent>
        </DaisyDialog>
        
        {/* Version Dialog */}
        <DaisyDialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
          <DaisyDialogContent>
            <DaisyDialogHeader>
              <DaisyDialogTitle>Create New Version</DaisyDialogTitle>
              <DaisyDialogDescription>
                Create a new version of this questionnaire.
              </DaisyDialogDescription>
            </DaisyDialogHeader>
            
            <div className="space-y-4">
              <div>
                <DaisyLabel>Version Title</DaisyLabel>
                <DaisyInput placeholder="Enter version title" />
              </div>
              <div>
                <DaisyLabel>Description</DaisyLabel>
                <DaisyTextarea placeholder="Describe the changes in this version" />
              </div>
            </div>
            
            <DaisyDialogFooter>
              <DaisyButton variant="outline" onClick={() => setShowVersionDialog(false)}>
                Cancel
              </DaisyButton>
              <DaisyButton onClick={() => {
                handleCreateVersion('New Version', 'Updated questionnaire');
                setShowVersionDialog(false);
              }}>
                Create Version
              </DaisyButton>
            </DaisyDialogFooter>
          </DaisyDialogContent>
        </DaisyDialog>
      </DaisyCard>
    
  );
} 