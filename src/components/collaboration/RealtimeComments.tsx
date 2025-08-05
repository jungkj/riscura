'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DaisyButton } from '@/components/ui/DaisyButton';
// import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyAvatar, DaisyAvatarFallback, DaisyAvatarImage } from '@/components/ui/DaisyAvatar';
// import { 
  MessageCircle,
  Send,
  Reply,
  Edit,
  Trash2,
  MoreHorizontal,
  Pin,
  Heart,
  Eye,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
  AtSign,
  Hash,
  Paperclip,
  Smile,
  Bell,
  BellOff,
  Filter,
  Search,
  ArrowUp,
  ArrowDown,
  Quote,
  Link,
  Flag
} from 'lucide-react';

// Comment and collaboration types
interface Comment {
  id: string
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
    isOnline: boolean;
  }
  timestamp: Date;
  edited?: Date;
  parentId?: string; // For threaded replies
  mentions: string[];
  attachments?: Attachment[];
  reactions: Reaction[];
  isPinned: boolean;
  isResolved: boolean;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  position?: { x: number; y: number }; // For contextual comments
}

interface Reaction {
  emoji: string;
  users: string[];
  count: number;
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface CollaborationSession {
  id: string;
  reportId: string;
  participants: Participant[];
  activeUsers: string[];
  comments: Comment[];
  lastActivity: Date;
}

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  permissions: string[];
  joinedAt: Date;
  isOnline: boolean;
  cursor?: { x: number; y: number }
}

// Real-time collaboration component
interface RealtimeCommentsProps {
  reportId: string
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  }
  onCommentAdd?: (comment: Comment) => void;
  onCommentUpdate?: (commentId: string, updates: Partial<Comment>) => void;
  onCommentDelete?: (commentId: string) => void;
  className?: string;
}

export const RealtimeComments: React.FC<RealtimeCommentsProps> = ({
  reportId,
  currentUser,
  onCommentAdd,
  onCommentUpdate,
  onCommentDelete,
  className = ''
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const [notifications, setNotifications] = useState(true);

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sample data
  useEffect(() => {
    const sampleComments: Comment[] = [
      {
        id: '1',
        content: 'The risk trend analysis shows a concerning increase in cybersecurity incidents. We should prioritize the MFA implementation.',
        author: {
          id: 'user1',
          name: 'Sarah Chen',
          avatar: '/avatars/sarah.jpg',
          role: 'Risk Analyst',
          isOnline: true
        },
        timestamp: new Date(Date.now() - 3600000),
        mentions: [],
        reactions: [
          { emoji: '👍', users: ['user2', 'user3'], count: 2 },
          { emoji: '💡', users: ['user4'], count: 1 }
        ],
        isPinned: true,
        isResolved: false,
        priority: 'high',
        tags: ['cybersecurity', 'mfa']
      },
      {
        id: '2',
        content: 'Agreed! I can help with the implementation timeline. @john.smith what\'s your availability next week?',
        author: {
          id: 'user2',
          name: 'Mike Johnson',
          avatar: '/avatars/mike.jpg',
          role: 'IT Security Manager',
          isOnline: true
        },
        timestamp: new Date(Date.now() - 1800000),
        parentId: '1',
        mentions: ['john.smith'],
        reactions: [],
        isPinned: false,
        isResolved: false,
        priority: 'medium',
        tags: ['implementation']
      },
      {
        id: '3',
        content: 'The compliance scores look good overall, but we need to address the GDPR gaps mentioned in the AI recommendations.',
        author: {
          id: 'user3',
          name: 'Emma Davis',
          avatar: '/avatars/emma.jpg',
          role: 'Compliance Officer',
          isOnline: false
        },
        timestamp: new Date(Date.now() - 900000),
        mentions: [],
        reactions: [
          { emoji: '⚠️', users: ['user1'], count: 1 }
        ],
        isPinned: false,
        isResolved: false,
        priority: 'high',
        tags: ['gdpr', 'compliance']
      }
    ]

    const sampleParticipants: Participant[] = [
      {
        id: 'user1',
        name: 'Sarah Chen',
        avatar: '/avatars/sarah.jpg',
        role: 'Risk Analyst',
        permissions: ['comment', 'edit', 'resolve'],
        joinedAt: new Date(Date.now() - 7200000),
        isOnline: true
      },
      {
        id: 'user2',
        name: 'Mike Johnson',
        avatar: '/avatars/mike.jpg',
        role: 'IT Security Manager',
        permissions: ['comment', 'edit'],
        joinedAt: new Date(Date.now() - 3600000),
        isOnline: true
      },
      {
        id: 'user3',
        name: 'Emma Davis',
        avatar: '/avatars/emma.jpg',
        role: 'Compliance Officer',
        permissions: ['comment', 'resolve'],
        joinedAt: new Date(Date.now() - 1800000),
        isOnline: false
      }
    ];

    setComments(sampleComments);
    setParticipants(sampleParticipants);
  }, []);

  // Auto-scroll to bottom when new comments are added
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments]);

  // Simulate typing indicators
  const handleTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // In a real implementation, this would send typing status to other users
    typingTimeoutRef.current = setTimeout(() => {
      // Stop typing indicator
    }, 2000)
  }, []);

  // Add new comment
  const addComment = useCallback(() => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: Date.now().toString(),
      content: newComment,
      author: {
        ...currentUser,
        isOnline: true
      },
      timestamp: new Date(),
      parentId: replyingTo || undefined,
      mentions: extractMentions(newComment),
      reactions: [],
      isPinned: false,
      isResolved: false,
      priority: 'medium',
      tags: extractTags(newComment)
    }

    setComments(prev => [...prev, comment]);
    setNewComment('');
    setReplyingTo(null);
    onCommentAdd?.(comment);
  }, [newComment, replyingTo, currentUser, onCommentAdd]);

  // Extract mentions from comment content
  const extractMentions = (_content: string): string[] => {
    const mentionRegex = /@(\w+(?:\.\w+)?)/g
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  }

  // Extract hashtags from comment content
  const extractTags = (_content: string): string[] => {
    const tagRegex = /#(\w+)/g
    const tags = [];
    let match;
    while ((match = tagRegex.exec(content)) !== null) {
      tags.push(match[1]);
    }
    return tags;
  }

  // Toggle reaction
  const toggleReaction = useCallback((commentId: string, emoji: string) => {
    setComments(prev => prev.map(comment => {
      if (comment.id !== commentId) return comment

      const existingReaction = comment.reactions.find(r => r.emoji === emoji);
      const userId = currentUser.id;

      if (existingReaction) {
        if (existingReaction.users.includes(userId)) {
          // Remove reaction
          return {
            ...comment,
            reactions: comment.reactions.map(r => 
              r.emoji === emoji 
                ? { ...r, users: r.users.filter(u => u !== userId), count: r.count - 1 }
                : r
            ).filter(r => r.count > 0)
          }
        } else {
          // Add reaction
          return {
            ...comment,
            reactions: comment.reactions.map(r => 
              r.emoji === emoji 
                ? { ...r, users: [...r.users, userId], count: r.count + 1 }
                : r
            )
          }
        }
      } else {
        // New reaction
        return {
          ...comment,
          reactions: [...comment.reactions, { emoji, users: [userId], count: 1 }]
        }
      }
    }));
  }, [currentUser.id]);

  // Pin/unpin comment
  const togglePin = useCallback((commentId: string) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, isPinned: !comment.isPinned }
        : comment
    ))
  }, []);

  // Resolve/unresolve comment
  const toggleResolve = useCallback((commentId: string) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, isResolved: !comment.isResolved }
        : comment
    ))
  }, []);

  // Delete comment
  const deleteComment = useCallback((commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId))
    onCommentDelete?.(commentId);
  }, [onCommentDelete]);

  // Filter comments
  const filteredComments = comments.filter(comment => {
    if (!showResolved && comment.isResolved) return false
    if (filterPriority !== 'all' && comment.priority !== filterPriority) return false;
    if (searchQuery && !comment.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Group comments by thread
  const groupedComments = filteredComments.reduce((acc, comment) => {
    if (!comment.parentId) {
      acc.push({
        parent: comment,
        replies: filteredComments.filter(c => c.parentId === comment.id)
      })
    }
    return acc;
  }, [] as { parent: Comment; replies: Comment[] }[]);

  // Render comment
  const renderComment = (comment: Comment, isReply = false) => {
    const isAuthor = comment.author.id === currentUser.id
    const isEditing = editingComment === comment.id;

    return (
      <div
        key={comment.id}
        className={`flex space-x-3 ${isReply ? 'ml-12 mt-3' : 'mb-4'} ${
          comment.isPinned ? 'bg-yellow-50 p-3 rounded-lg' : ''
        }`}
      >
        <DaisyAvatar className="w-8 h-8" >
            <DaisyAvatarImage src={comment.author.avatar} >
            <DaisyAvatarFallback>{comment.author.name.split(' ').map(n => n[0]).join('')}</DaisyAvatar>
        </DaisyAvatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-sm">{comment.author.name}</span>
            <DaisyBadge variant="outline" className="text-xs">{comment.author.role}</DaisyBadge>
            {comment.author.isOnline && (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            )}
            <span className="text-xs text-gray-500">
              {comment.timestamp.toLocaleTimeString()}
            </span>
            {comment.isPinned && <Pin className="w-3 h-3 text-yellow-600" />}
            {comment.isResolved && <CheckCircle className="w-3 h-3 text-green-600" />}
            <DaisyBadge 
              variant={comment.priority === 'high' ? 'destructive' : 
                      comment.priority === 'medium' ? 'default' : 'secondary'}
              className="text-xs" >
  {comment.priority}
</DaisyBadge>
            </DaisyBadge>
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <DaisyTextarea
                value={newComment}
                onChange={(e) =>
setNewComment(e.target.value)}
                className="text-sm"
                rows={3} />
              <div className="flex space-x-2">
                <DaisyButton size="sm" onClick={() => setEditingComment(null)} />
                  Save
                </DaisyTextarea>
                <DaisyButton variant="outline" size="sm" onClick={() =>
          setEditingComment(null)} />
                  Cancel
                
        </DaisyButton>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-900 mb-2">
                {comment.content}
              </div>

              {comment.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {comment.tags.map(tag => (
                    <DaisyBadge key={tag} variant="secondary" className="text-xs" >
  #{tag}
</DaisyBadge>
                    </DaisyBadge>
                  ))}
                </div>
              )}

              {comment.reactions.length > 0 && (
                <div className="flex space-x-1 mb-2">
                  {comment.reactions.map(reaction => (
                    <DaisyButton
                      key={reaction.emoji}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() =>
          toggleReaction(comment.id, reaction.emoji)} />
                      {reaction.emoji} {reaction.count}
                    
        </DaisyButton>
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-2 text-xs">
                <DaisyButton
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => setReplyingTo(comment.id)} />
                  <Reply className="w-3 h-3 mr-1" />
                  Reply
                </DaisyButton>

                <DaisyButton
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => toggleReaction(comment.id, '👍')} />
                  <Heart className="w-3 h-3 mr-1" />
                  Like
                </DaisyButton>

                {Boolean(isAuthor) && (
                  <>
                    <DaisyButton
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => setEditingComment(comment.id)} />
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </DaisyButton>
                    <DaisyButton
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-red-600"
                      onClick={() => deleteComment(comment.id)} />
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </DaisyButton>
                  </>
                )}

                <DaisyButton
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => togglePin(comment.id)} />
                  <Pin className="w-3 h-3 mr-1" />
                  {comment.isPinned ? 'Unpin' : 'Pin'}
                </DaisyButton>

                <DaisyButton
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => toggleResolve(comment.id)} />
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {comment.isResolved ? 'Unresolve' : 'Resolve'}
                </DaisyButton>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Comments & Collaboration
          </h3>
          <div className="flex items-center space-x-2">
            <DaisyButton
              variant="ghost"
              size="sm"
              onClick={() => setNotifications(!notifications)} />
              {notifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </DaisyButton>
            <DaisyBadge variant="secondary" className="text-xs" >
  {participants.filter(p => p.isOnline).length} online
</DaisyBadge>
            </DaisyBadge>
          </div>
        </div>

        {/* Active participants */}
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-sm text-gray-600">Active:</span>
          <div className="flex -space-x-2">
            {participants.filter(p => p.isOnline).map(participant => (
              <DaisyAvatar key={participant.id} className="w-6 h-6 border-2 border-white" >
                  <DaisyAvatarImage src={participant.avatar} >
                  <DaisyAvatarFallback className="text-xs" >
                    {participant.name.split(' ').map(n => n[0]).join('')}
                </DaisyAvatar>
              </DaisyAvatar>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <DaisyInput
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) =>
setSearchQuery(e.target.value)}
            className="text-sm h-8" />
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-sm h-8 px-2 border border-gray-300 rounded"
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <DaisyButton
            variant="ghost"
            size="sm"
            onClick={() => setShowResolved(!showResolved)}
            className={showResolved ? 'bg-gray-100' : ''} />
            <CheckCircle className="w-4 h-4 mr-1" />
            Resolved
          </DaisyInput>
        </div>
      </div>

      {/* Comments */}
      <div className="flex-1 overflow-y-auto p-4">
        {groupedComments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No comments yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedComments.map(({ parent, replies }) => (
              <div key={parent.id}>
                {renderComment(parent)}
                {replies.map(reply => renderComment(reply, true))}
              </div>
            ))}
          </div>
        )}

        {/* Typing indicators */}
        {isTyping.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-4">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>{isTyping.join(', ')} {isTyping.length === 1 ? 'is' : 'are'} typing...</span>
          </div>
        )}

        <div ref={commentsEndRef} />
      </div>

      {/* Comment input */}
      <div className="p-4 border-t border-gray-200">
        {Boolean(replyingTo) && (
          <div className="mb-2 p-2 bg-blue-50 rounded text-sm">
            <span className="text-blue-600">Replying to comment</span>
            <DaisyButton
              variant="ghost"
              size="sm"
              className="ml-2 h-auto p-0 text-blue-600"
              onClick={() =>
          setReplyingTo(null)} />
              Cancel
            
        </DaisyButton>
          </div>
        )}

        <div className="flex space-x-2">
          <DaisyAvatar className="w-8 h-8" >
              <DaisyAvatarImage src={currentUser.avatar} >
              <DaisyAvatarFallback>{currentUser.name.split(' ').map(n => n[0]).join('')}</DaisyAvatar>
          </DaisyAvatar>
          
          <div className="flex-1">
            <DaisyTextarea
              placeholder="Add a comment... Use @username to mention someone or #tag to add tags"
              value={newComment}
              onChange={(e) =>
{
                setNewComment(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  addComment();
                }
              }}
              className="text-sm resize-none"
              rows={3} />
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <DaisyButton variant="ghost" size="sm" >
  <Paperclip className="w-4 h-4" />
</DaisyTextarea>
                </DaisyButton>
                <DaisyButton variant="ghost" size="sm" >
  <Smile className="w-4 h-4" />
</DaisyButton>
                </DaisyButton>
                <DaisyButton variant="ghost" size="sm" >
  <AtSign className="w-4 h-4" />
</DaisyButton>
                </DaisyButton>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Cmd+Enter to send</span>
                <DaisyButton onClick={addComment} disabled={!newComment.trim()} >
  <Send className="w-4 h-4" />
</DaisyButton>
                </DaisyButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RealtimeComments; 