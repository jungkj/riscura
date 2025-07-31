'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyAvatar, DaisyAvatarFallback, DaisyAvatarImage } from '@/components/ui/DaisyAvatar';
import { DaisyCard, DaisyCardBody } from '@/components/ui/DaisyCard';
import { DaisyScrollArea } from '@/components/ui/DaisyScrollArea';
import { DaisyDialog, DaisyDialogContent, DaisyDialogHeader, DaisyDialogTitle } from '@/components/ui/DaisyDialog';
import { DaisyPopover, DaisyPopoverContent, DaisyPopoverTrigger } from '@/components/ui/DaisyPopover';
import { DaisyDropdownMenu, DaisyDropdownMenuContent, DaisyDropdownMenuItem, DaisyDropdownMenuTrigger } from '@/components/ui/DaisyDropdown';
import {
  MessageSquare,
  Reply,
  MoreHorizontal,
  Edit,
  Trash2,
  Heart,
  AtSign,
  Pin,
  Eye,
  EyeOff,
  Clock,
  Check,
  X,
  Plus,
  Filter,
  Search,
  Send,
  Paperclip,
  Image,
  AlertCircle,
  Users,
  User,
  Calendar,
  Link,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Dot,
} from 'lucide-react';

// Types
interface Comment {
  id: string;
  content: string;
  author: User;
  entityType: 'risk' | 'control' | 'document' | 'task';
  entityId: string;
  parentId?: string; // for threaded comments
  mentions: string[]; // user IDs mentioned
  attachments?: Attachment[];
  reactions: Reaction[];
  isResolved: boolean;
  isPinned: boolean;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  editHistory?: EditHistory[];
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  department: string;
  isOnline: boolean;
}

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'link';
  url: string;
  size?: number;
}

interface Reaction {
  emoji: string;
  users: string[]; // user IDs
  count: number;
}

interface EditHistory {
  id: string;
  content: string;
  editedAt: Date;
  editedBy: string;
}

interface Mention {
  id: string;
  user: User;
  position: number;
  length: number;
}

// Sample Users
const sampleUsers: User[] = [
  {
    id: 'user-1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    avatar: '/avatars/sarah.jpg',
    role: 'Risk Manager',
    department: 'Risk & Compliance',
    isOnline: true,
  },
  {
    id: 'user-2',
    name: 'Michael Chen',
    email: 'michael.chen@company.com',
    avatar: '/avatars/michael.jpg',
    role: 'Compliance Officer',
    department: 'Risk & Compliance',
    isOnline: false,
  },
  {
    id: 'user-3',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@company.com',
    avatar: '/avatars/emily.jpg',
    role: 'Security Analyst',
    department: 'IT Security',
    isOnline: true,
  },
  {
    id: 'user-4',
    name: 'David Kim',
    email: 'david.kim@company.com',
    avatar: '/avatars/david.jpg',
    role: 'Audit Manager',
    department: 'Internal Audit',
    isOnline: true,
  },
];

// Sample Comments
const sampleComments: Comment[] = [
  {
    id: 'comment-1',
    content: 'We need to review the likelihood assessment for this risk. @Michael Chen can you provide the latest threat intelligence data?',
    author: sampleUsers[0],
    entityType: 'risk',
    entityId: 'RSK-001',
    mentions: ['user-2'],
    reactions: [
      { emoji: '👍', users: ['user-2', 'user-3'], count: 2 },
      { emoji: '🎯', users: ['user-4'], count: 1 },
    ],
    isResolved: false,
    isPinned: true,
    isPrivate: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'comment-2',
    content: 'Based on the Q4 threat report, I recommend increasing the likelihood to High (4). The attack vectors have evolved significantly.',
    author: sampleUsers[1],
    entityType: 'risk',
    entityId: 'RSK-001',
    parentId: 'comment-1',
    mentions: [],
    attachments: [
      {
        id: 'att-1',
        name: 'Q4-Threat-Report.pdf',
        type: 'document',
        url: '/documents/Q4-Threat-Report.pdf',
        size: 2048576,
      },
    ],
    reactions: [
      { emoji: '✅', users: ['user-1'], count: 1 },
    ],
    isResolved: false,
    isPinned: false,
    isPrivate: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: 'comment-3',
    content: 'Agreed. Let\'s schedule a risk review meeting to discuss this change. @Emily Rodriguez @David Kim please join us.',
    author: sampleUsers[0],
    entityType: 'risk',
    entityId: 'RSK-001',
    parentId: 'comment-1',
    mentions: ['user-3', 'user-4'],
    reactions: [],
    isResolved: true,
    isPinned: false,
    isPrivate: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
  },
];

// Mention Input Component
const MentionInput: React.FC<{
  value: string;
  onChange: (value: string, mentions: Mention[]) => void;
  placeholder?: string;
  users: User[];
  autoFocus?: boolean;
}> = ({ value, onChange, placeholder, users, autoFocus = false }) => {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursor = e.target.selectionStart;
    setCursorPosition(cursor);

    // Check for @ mentions
    const beforeCursor = newValue.slice(0, cursor);
    const atIndex = beforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1 && (atIndex === 0 || /\s/.test(beforeCursor[atIndex - 1]))) {
      const searchTerm = beforeCursor.slice(atIndex + 1);
      if (!searchTerm.includes(' ')) {
        setMentionSearch(searchTerm);
        setMentionPosition(atIndex);
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }

    onChange(newValue, []); // TODO: Extract mentions from text
  };

  const insertMention = (user: User) => {
    if (!textareaRef.current) return;

    const before = value.slice(0, mentionPosition);
    const after = value.slice(cursorPosition);
    const newValue = `${before}@${user.name} ${after}`;

    onChange(newValue, []);
    setShowMentions(false);
    
    // Focus back to textarea
    setTimeout(() => {
      textareaRef.current?.focus();
      const newCursor = mentionPosition + user.name.length + 2;
      textareaRef.current?.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  return (
    <div className="relative">
      <DaisyTextarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="min-h-[80px] resize-none"
      />

      {showMentions && (
        <DaisyCard className="absolute z-50 w-64 mt-1 shadow-lg" >
  <DaisyCardContent className="p-2" >
  </DaisyTextarea>
</DaisyCardContent>
            <div className="text-caption text-text-secondary mb-2 px-2">
              Mention someone
            </div>
            <div className="space-y-1">
              {filteredUsers.slice(0, 5).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-2 p-2 rounded hover:bg-surface-secondary cursor-pointer"
                  onClick={() => insertMention(user)}
                >
                  <DaisyAvatar className="h-6 w-6" />
                    <DaisyAvatarImage src={user.avatar} />
                    <DaisyAvatarFallback className="text-caption" />
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </DaisyAvatar>
                  </DaisyAvatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-body-sm font-medium truncate">{user.name}</div>
                    <div className="text-caption text-text-secondary truncate">{user.role}</div>
                  </div>
                  {user.isOnline && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="p-2 text-caption text-text-secondary text-center">
                  No users found
                </div>
              )}
            </div>
          </DaisyCardContent>
        </DaisyCard>
      )}
    </div>
  );
};

MentionInput.displayName = 'MentionInput';

// Comment Component
const CommentComponent: React.FC<{
  comment: Comment;
  replies?: Comment[];
  onReply: (parentId: string) => void;
  onEdit: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onReact: (commentId: string, emoji: string) => void;
  onResolve: (commentId: string) => void;
  onPin: (commentId: string) => void;
  level?: number;
}> = ({ 
  comment, 
  replies = [], 
  onReply, 
  onEdit, 
  onDelete, 
  onReact, 
  onResolve, 
  onPin,
  level = 0 
}) => {
  const [showReplies, setShowReplies] = useState(true);
  const [showReactions, setShowReactions] = useState(false);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const renderMentions = (content: string, mentions: string[]) => {
    if (mentions.length === 0) return content;

    let result = content;
    mentions.forEach(userId => {
      const user = sampleUsers.find(u => u.id === userId);
      if (user) {
        result = result.replace(
          `@${user.name}`,
          `<span class="bg-blue-100 text-blue-800 px-1 rounded font-medium">@${user.name}</span>`
        );
      }
    });

    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  };

  const commonReactions = ['👍', '❤️', '😊', '🎯', '✅', '🔥'];

  return (
    <div className={cn(
      "space-y-enterprise-3",
      level > 0 && "ml-enterprise-6 pl-enterprise-4 border-l border-border"
    )}>
      <div className={cn(
        "p-enterprise-4 rounded-lg border border-border bg-white",
        comment.isPinned && "border-blue-200 bg-blue-50/30",
        comment.isResolved && "border-green-200 bg-green-50/30"
      )}>
        {/* Header */}
        <div className="flex items-start justify-between mb-enterprise-3">
          <div className="flex items-center space-x-enterprise-3">
            <DaisyAvatar className="h-8 w-8" />
              <DaisyAvatarImage src={comment.author.avatar} />
              <DaisyAvatarFallback className="text-caption" />
                {comment.author.name.split(' ').map(n => n[0]).join('')}
              </DaisyAvatar>
            </DaisyAvatar>
            <div>
              <div className="flex items-center space-x-enterprise-2">
                <span className="text-body-sm font-medium">{comment.author.name}</span>
                <DaisyBadge variant="outline" className="text-caption" >
  {comment.author.role}
</DaisyBadge>
                </DaisyBadge>
                {comment.author.isOnline && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </div>
              <div className="flex items-center space-x-enterprise-2 text-caption text-text-secondary">
                <Clock className="h-3 w-3" />
                <span>{formatTime(comment.createdAt)}</span>
                {comment.updatedAt > comment.createdAt && (
                  <span>(edited)</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-enterprise-1">
            {comment.isPinned && (
              <Pin className="h-3 w-3 text-blue-600" />
            )}
            {comment.isResolved && (
              <Check className="h-3 w-3 text-green-600" />
            )}
            {comment.isPrivate && (
              <EyeOff className="h-3 w-3 text-text-tertiary" />
            )}
            
            <DaisyDropdownMenu />
              <DaisyDropdownMenuTrigger asChild />
                <DaisyButton variant="ghost" size="sm" className="h-6 w-6 p-0" >
  <MoreHorizontal className="h-3 w-3" />
</DaisyDropdownMenu>
                </DaisyButton>
              </DaisyDropdownMenuTrigger>
              <DaisyDropdownMenuContent align="end" />
                <DaisyDropdownMenuItem onClick={() => onEdit(comment.id)} />
                  <Edit className="h-3 w-3 mr-enterprise-2" />
                  Edit
                </DaisyDropdownMenuContent>
                <DaisyDropdownMenuItem onClick={() => onPin(comment.id)} />
                  <Pin className="h-3 w-3 mr-enterprise-2" />
                  {comment.isPinned ? 'Unpin' : 'Pin'}
                </DaisyDropdownMenuItem>
                <DaisyDropdownMenuItem onClick={() => onResolve(comment.id)} />
                  <Check className="h-3 w-3 mr-enterprise-2" />
                  {comment.isResolved ? 'Unresolve' : 'Resolve'}
                </DaisyDropdownMenuItem>
                <DaisyDropdownMenuItem 
                  onClick={() => onDelete(comment.id)}
                  className="text-semantic-error" />
                  <Trash2 className="h-3 w-3 mr-enterprise-2" />
                  Delete
                </DaisyDropdownMenuItem>
              </DaisyDropdownMenuContent>
            </DaisyDropdownMenu>
          </div>
        </div>

        {/* Content */}
        <div className="mb-enterprise-3">
          <p className="text-body-sm leading-relaxed">
            {renderMentions(comment.content, comment.mentions)}
          </p>
        </div>

        {/* Attachments */}
        {comment.attachments && comment.attachments.length > 0 && (
          <div className="mb-enterprise-3 space-y-enterprise-2">
            {comment.attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center space-x-enterprise-2 p-enterprise-2 border border-border rounded bg-surface-secondary">
                <Paperclip className="h-4 w-4 text-text-secondary" />
                <div className="flex-1 min-w-0">
                  <div className="text-body-sm font-medium truncate">{attachment.name}</div>
                  {attachment.size && (
                    <div className="text-caption text-text-secondary">
                      {(attachment.size / 1024 / 1024).toFixed(1)} MB
                    </div>
                  )}
                </div>
                <DaisyButton variant="ghost" size="sm" className="h-6 w-6 p-0" >
  <ExternalLink className="h-3 w-3" />
</DaisyButton>
                </DaisyButton>
              </div>
            ))}
          </div>
        )}

        {/* Reactions */}
        {comment.reactions.length > 0 && (
          <div className="flex items-center space-x-enterprise-2 mb-enterprise-3">
            {comment.reactions.map((reaction) => (
              <DaisyButton
                key={reaction.emoji}
                variant="outline"
                size="sm"
                className="h-6 px-enterprise-2"
                onClick={() => onReact(comment.id, reaction.emoji)} />
                <span className="mr-enterprise-1">{reaction.emoji}</span>
                <span className="text-caption">{reaction.count}</span>
              </DaisyButton>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-enterprise-4 text-caption">
          <DaisyButton
            variant="ghost"
            size="sm"
            className="h-6 px-0 text-text-secondary hover:text-text-primary"
            onClick={() => onReply(comment.id)} />
            <Reply className="h-3 w-3 mr-enterprise-1" />
            Reply
          </DaisyButton>

          <DaisyPopover open={showReactions} onOpenChange={setShowReactions} />
            <DaisyPopoverTrigger asChild />
              <DaisyButton
                variant="ghost"
                size="sm"
                className="h-6 px-0 text-text-secondary hover:text-text-primary" >
  <Heart className="h-3 w-3 mr-enterprise-1" />
</DaisyPopover>
                React
              </DaisyButton>
            </DaisyPopoverTrigger>
            <DaisyPopoverContent className="w-auto p-2" />
              <div className="flex space-x-1">
                {commonReactions.map((emoji) => (
                  <DaisyButton
                    key={emoji}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      onReact(comment.id, emoji);
                      setShowReactions(false);
                    }}
                  >
                    {emoji}
                  </DaisyPopoverContent>
                ))}
              </div>
            </DaisyPopoverContent>
          </DaisyPopover>

          {replies.length > 0 && (
            <DaisyButton
              variant="ghost"
              size="sm"
              className="h-6 px-0 text-text-secondary hover:text-text-primary"
              onClick={() => setShowReplies(!showReplies)} />
              {showReplies ? (
                <ChevronDown className="h-3 w-3 mr-enterprise-1" />
              ) : (
                <ChevronRight className="h-3 w-3 mr-enterprise-1" />
              )}
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </DaisyButton>
          )}
        </div>
      </div>

      {/* Replies */}
      {showReplies && replies.length > 0 && (
        <div className="space-y-enterprise-3">
          {replies.map((reply) => (
            <CommentComponent
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onReact={onReact}
              onResolve={onResolve}
              onPin={onPin}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

CommentComponent.displayName = 'CommentComponent';

// Main Comment System Component
export const CommentSystem: React.FC<{
  entityType: 'risk' | 'control' | 'document' | 'task';
  entityId: string;
  isInline?: boolean;
  showHeader?: boolean;
}> = ({ entityType, entityId, isInline = false, showHeader = true }) => {
  const [comments, setComments] = useState<Comment[]>(
    sampleComments.filter(c => c.entityType === entityType && c.entityId === entityId)
  );
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [filterBy, setFilterBy] = useState<'all' | 'mentions' | 'pinned'>('all');

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      content: newComment,
      author: sampleUsers[0], // Current user
      entityType,
      entityId,
      parentId: replyingTo || undefined,
      mentions: [], // TODO: Extract mentions
      reactions: [],
      isResolved: false,
      isPinned: false,
      isPrivate: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setComments(prev => [...prev, comment]);
    setNewComment('');
    setReplyingTo(null);
  };

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
  };

  const handleEdit = (commentId: string) => {
    setEditingComment(commentId);
  };

  const handleDelete = (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleReact = (commentId: string, emoji: string) => {
    setComments(prev => prev.map(comment => {
      if (comment.id !== commentId) return comment;

      const existingReaction = comment.reactions.find(r => r.emoji === emoji);
      if (existingReaction) {
        const userId = sampleUsers[0].id;
        if (existingReaction.users.includes(userId)) {
          // Remove reaction
          return {
            ...comment,
            reactions: comment.reactions.map(r => 
              r.emoji === emoji 
                ? { ...r, users: r.users.filter(u => u !== userId), count: r.count - 1 }
                : r
            ).filter(r => r.count > 0)
          };
        } else {
          // Add reaction
          return {
            ...comment,
            reactions: comment.reactions.map(r => 
              r.emoji === emoji 
                ? { ...r, users: [...r.users, userId], count: r.count + 1 }
                : r
            )
          };
        }
      } else {
        // New reaction
        return {
          ...comment,
          reactions: [...comment.reactions, {
            emoji,
            users: [sampleUsers[0].id],
            count: 1
          }]
        };
      }
    }));
  };

  const handleResolve = (commentId: string) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, isResolved: !comment.isResolved }
        : comment
    ));
  };

  const handlePin = (commentId: string) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, isPinned: !comment.isPinned }
        : comment
    ));
  };

  // Organize comments into threads
  const threadedComments = comments.filter(c => !c.parentId).map(comment => ({
    ...comment,
    replies: comments.filter(c => c.parentId === comment.id)
  }));

  // Apply filters
  const filteredComments = threadedComments.filter(comment => {
    if (!showResolved && comment.isResolved) return false;
    
    switch (filterBy) {
      case 'mentions':
        return comment.mentions.includes(sampleUsers[0].id);
      case 'pinned':
        return comment.isPinned;
      default:
        return true;
    }
  });

  const totalComments = comments.length;
  const unresolvedComments = comments.filter(c => !c.isResolved).length;
  const pinnedComments = comments.filter(c => c.isPinned).length;

  if (isInline) {
    return (
      <div className="w-80 max-h-96 flex flex-col">
        <div className="flex-1 overflow-hidden">
          <DaisyScrollArea className="h-full" />
            <div className="p-enterprise-4 space-y-enterprise-4">
              {filteredComments.map((comment) => (
                <CommentComponent
                  key={comment.id}
                  comment={comment}
                  replies={comment.replies}
                  onReply={handleReply}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onReact={handleReact}
                  onResolve={handleResolve}
                  onPin={handlePin}
                />
              ))}
              {filteredComments.length === 0 && (
                <div className="text-center py-enterprise-6 text-text-secondary">
                  <MessageSquare className="h-8 w-8 mx-auto mb-enterprise-2 opacity-50" />
                  <p className="text-body-sm">No comments yet</p>
                </div>
              )}
            </div>
          </DaisyScrollArea>
        </div>
        
        <div className="border-t border-border p-enterprise-3">
          <MentionInput
            value={newComment}
            onChange={(value) => setNewComment(value)}
            placeholder="Add a comment..."
            users={sampleUsers}
          />
          <div className="flex items-center justify-between mt-enterprise-2">
            <div className="text-caption text-text-secondary">
              {replyingTo && 'Replying to comment'}
            </div>
            <div className="flex space-x-enterprise-1">
              {replyingTo && (
                <DaisyButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(null)} />
                  <X className="h-3 w-3" />
                </DaisyButton>
              )}
              <DaisyButton
                size="sm"
                onClick={handleAddComment}
                disabled={!newComment.trim()} >
  <Send className="h-3 w-3" />
</DaisyButton>
              </DaisyButton>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-enterprise-6">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-heading-sm font-semibold">Comments & Discussion</h3>
            <div className="flex items-center space-x-enterprise-4 mt-enterprise-1 text-caption text-text-secondary">
              <span>{totalComments} total</span>
              <span>{unresolvedComments} unresolved</span>
              <span>{pinnedComments} pinned</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-enterprise-2">
            <DaisyDropdownMenu />
              <DaisyDropdownMenuTrigger asChild />
                <DaisyButton variant="outline" size="sm" >
  <Filter className="h-3 w-3 mr-enterprise-2" />
</DaisyDropdownMenu>
                  Filter
                  <ChevronDown className="h-3 w-3 ml-enterprise-1" />
                </DaisyButton>
              </DaisyDropdownMenuTrigger>
              <DaisyDropdownMenuContent />
                <DaisyDropdownMenuItem onClick={() => setFilterBy('all')} />
                  All Comments
                </DaisyDropdownMenuContent>
                <DaisyDropdownMenuItem onClick={() => setFilterBy('mentions')} />
                  Mentions Only
                </DaisyDropdownMenuItem>
                <DaisyDropdownMenuItem onClick={() => setFilterBy('pinned')} />
                  Pinned Only
                </DaisyDropdownMenuItem>
              </DaisyDropdownMenuContent>
            </DaisyDropdownMenu>
            
            <DaisyButton
              variant="outline"
              size="sm"
              onClick={() => setShowResolved(!showResolved)} />
              {showResolved ? (
                <EyeOff className="h-3 w-3 mr-enterprise-2" />
              ) : (
                <Eye className="h-3 w-3 mr-enterprise-2" />
              )}
              {showResolved ? 'Hide Resolved' : 'Show Resolved'}
            </DaisyButton>
          </div>
        </div>
      )}

      {/* New Comment */}
      <DaisyCard >
  <DaisyCardContent className="p-enterprise-4" >
  </DaisyCard>
</DaisyCardContent>
          <div className="flex items-start space-x-enterprise-3">
            <DaisyAvatar className="h-8 w-8" />
              <DaisyAvatarImage src={sampleUsers[0].avatar} />
              <DaisyAvatarFallback className="text-caption" />
                {sampleUsers[0].name.split(' ').map(n => n[0]).join('')}
              </DaisyAvatar>
            </DaisyAvatar>
            <div className="flex-1 space-y-enterprise-3">
              <MentionInput
                value={newComment}
                onChange={(value) => setNewComment(value)}
                placeholder={replyingTo ? "Write a reply..." : "Start a discussion..."}
                users={sampleUsers}
                autoFocus={!!replyingTo}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-enterprise-2">
                  {replyingTo && (
                    <DaisyBadge variant="outline" className="text-caption" >
  Replying to comment
</DaisyBadge>
                    </DaisyBadge>
                  )}
                </div>
                <div className="flex space-x-enterprise-2">
                  {replyingTo && (
                    <DaisyButton
                      variant="outline"
                      size="sm"
                      onClick={() => setReplyingTo(null)} />
                      Cancel
                    </DaisyButton>
                  )}
                  <DaisyButton
                    size="sm"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()} >
  {replyingTo ? 'Reply' : 'Comment'}
</DaisyButton>
                  </DaisyButton>
                </div>
              </div>
            </div>
          </div>
        </DaisyCardContent>
      </DaisyCard>

      {/* Comments List */}
      <div className="space-y-enterprise-4">
        {filteredComments.map((comment) => (
          <CommentComponent
            key={comment.id}
            comment={comment}
            replies={comment.replies}
            onReply={handleReply}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReact={handleReact}
            onResolve={handleResolve}
            onPin={handlePin}
          />
        ))}
        
        {filteredComments.length === 0 && (
          <div className="text-center py-enterprise-8 text-text-secondary">
            <MessageSquare className="h-12 w-12 mx-auto mb-enterprise-4 opacity-50" />
            <h4 className="text-body-base font-medium mb-enterprise-2">No comments yet</h4>
            <p className="text-body-sm">Start the conversation by adding the first comment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSystem;