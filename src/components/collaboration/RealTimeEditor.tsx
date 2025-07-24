'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyTextarea } from '@/components/ui/DaisyTextarea';
import { DaisyAvatar, DaisyAvatarFallback, DaisyAvatarImage } from '@/components/ui/DaisyAvatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { toast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  Edit3, Users, Eye, Clock, AlertTriangle, CheckCircle,
  Zap, Wifi, WifiOff, Merge, GitMerge, Undo, Redo,
  Save, Share2, Lock, Unlock, User, MousePointer, Activity
} from 'lucide-react';

// Types for real-time editing
interface EditorUser {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
    elementId?: string;
    selection?: {
      start: number;
      end: number;
    };
  };
  isTyping: boolean;
  lastActivity: Date;
}

interface EditOperation {
  id: string;
  type: 'insert' | 'delete' | 'replace' | 'move';
  userId: string;
  timestamp: Date;
  position: number;
  content?: string;
  length?: number;
  elementId: string;
  elementType: 'title' | 'description' | 'question' | 'option';
  conflictsWith?: string[];
  resolved: boolean;
}

interface Conflict {
  id: string;
  operations: EditOperation[];
  type: 'concurrent_edit' | 'move_conflict' | 'delete_conflict';
  description: string;
  affectedUsers: string[];
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: 'accept_all' | 'accept_first' | 'accept_last' | 'merge' | 'manual';
}

interface RealTimeEditorProps {
  documentId: string;
  currentUser: EditorUser;
  onContentChange?: (content: any) => void;
  className?: string;
}

export function RealTimeEditor({
  documentId,
  currentUser,
  onContentChange,
  className
}: RealTimeEditorProps) {
  // State management
  const [activeUsers, setActiveUsers] = useState<EditorUser[]>([]);
  const [operations, setOperations] = useState<EditOperation[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [operationHistory, setOperationHistory] = useState<EditOperation[]>([]);
  const [undoStack, setUndoStack] = useState<EditOperation[]>([]);
  const [redoStack, setRedoStack] = useState<EditOperation[]>([]);

  // Document content
  const [content, setContent] = useState({
    title: 'Risk Assessment Questionnaire',
    description: 'Comprehensive cybersecurity risk assessment for enterprise environments',
    sections: [
      {
        id: 'section-1',
        title: 'Infrastructure Security',
        questions: [
          {
            id: 'question-1',
            text: 'Does your organization have a documented information security policy?',
            type: 'yes_no'
          },
          {
            id: 'question-2',
            text: 'Are security controls regularly reviewed and updated?',
            type: 'yes_no'
          }
        ]
      }
    ]
  });

  // Refs for tracking elements
  const editorRef = useRef<HTMLDivElement>(null);
  const cursorsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  // Initialize mock data and simulate real-time connections
  useEffect(() => {
    initializeMockUsers();
    simulateNetworkConnection();
    
    const interval = setInterval(() => {
      simulateUserActivity();
      simulateAutoSave();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const initializeMockUsers = () => {
    const mockUsers: EditorUser[] = [
      {
        id: 'user-1',
        name: 'Sarah Johnson',
        avatar: '/avatars/sarah.jpg',
        color: '#3b82f6',
        isTyping: false,
        lastActivity: new Date(),
        cursor: {
          x: 150,
          y: 200,
          elementId: 'question-1'
        }
      },
      {
        id: 'user-2',
        name: 'Mike Chen',
        avatar: '/avatars/mike.jpg',
        color: '#10b981',
        isTyping: true,
        lastActivity: new Date(),
        cursor: {
          x: 300,
          y: 350,
          elementId: 'question-2',
          selection: { start: 10, end: 25 }
        }
      },
      {
        id: 'user-3',
        name: 'Emily Davis',
        avatar: '/avatars/emily.jpg',
        color: '#f59e0b',
        isTyping: false,
        lastActivity: new Date(Date.now() - 30000),
        cursor: {
          x: 200,
          y: 150,
          elementId: 'title'
        }
      }
    ];

    setActiveUsers(mockUsers);
  };

  const simulateNetworkConnection = () => {
    // Simulate occasional network issues
    const interval = setInterval(() => {
      if (Math.random() < 0.05) { // 5% chance of disconnection
        setIsConnected(false);
        setTimeout(() => {
          setIsConnected(true);
          toast({
            title: 'Reconnected',
            description: 'Real-time collaboration restored.',
          });
        }, 2000 + Math.random() * 3000);
      }
    }, 10000);

    return () => clearInterval(interval);
  };

  const simulateUserActivity = () => {
    setActiveUsers(prev => prev.map(user => {
      // Simulate cursor movement
      const newCursor = {
        ...user.cursor,
        x: user.cursor?.x ? user.cursor.x + (Math.random() - 0.5) * 20 : Math.random() * 400,
        y: user.cursor?.y ? user.cursor.y + (Math.random() - 0.5) * 10 : Math.random() * 600
      };

      // Simulate typing activity
      const isTyping = Math.random() < 0.1; // 10% chance of typing

      return {
        ...user,
        cursor: newCursor,
        isTyping,
        lastActivity: isTyping ? new Date() : user.lastActivity
      };
    }));
  };

  const simulateAutoSave = () => {
    if (operations.length > 0 && !isAutoSaving) {
      setIsAutoSaving(true);
      setTimeout(() => {
        setIsAutoSaving(false);
        setLastSaved(new Date());
        
        // Clear resolved operations
        setOperations(prev => prev.filter(op => !op.resolved));
      }, 1000 + Math.random() * 2000);
    }
  };

  const handleContentEdit = useCallback((elementId: string, elementType: string, newContent: string, position = 0) => {
    const operation: EditOperation = {
      id: `op-${Date.now()}-${Math.random()}`,
      type: 'replace',
      userId: currentUser.id,
      timestamp: new Date(),
      position,
      content: newContent,
      elementId,
      elementType: elementType as EditOperation['elementType'],
      conflictsWith: [],
      resolved: false
    };

    // Check for conflicts with recent operations
    const recentOps = operations.filter(op => 
      op.elementId === elementId && 
      Date.now() - op.timestamp.getTime() < 5000 && // Within 5 seconds
      op.userId !== currentUser.id &&
      !op.resolved
    );

    if (recentOps.length > 0) {
      const conflict: Conflict = {
        id: `conflict-${Date.now()}`,
        operations: [operation, ...recentOps],
        type: 'concurrent_edit',
        description: `Multiple users editing ${elementType} "${elementId}"`,
        affectedUsers: [currentUser.id, ...recentOps.map(op => op.userId)],
        resolved: false
      };

      setConflicts(prev => [...prev, conflict]);
      operation.conflictsWith = recentOps.map(op => op.id);
    }

    setOperations(prev => [...prev, operation]);
    setOperationHistory(prev => [...prev, operation]);
    setUndoStack(prev => [...prev, operation]);
    setRedoStack([]); // Clear redo stack when new operation is added

    // Update content optimistically
    updateContent(elementId, elementType, newContent);

    // Notify other components
    onContentChange?.(content);

    toast({
      title: 'Changes Saved',
      description: `${elementType} updated successfully.`,
      duration: 2000,
    });
  }, [operations, currentUser.id, content, onContentChange]);

  const updateContent = (elementId: string, elementType: string, newContent: string) => {
    setContent(prev => {
      const updated = { ...prev };
      
      if (elementType === 'title') {
        updated.title = newContent;
      } else if (elementType === 'description') {
        updated.description = newContent;
      } else if (elementType === 'question') {
        updated.sections = updated.sections.map(section => ({
          ...section,
          questions: section.questions.map(question => 
            question.id === elementId 
              ? { ...question, text: newContent }
              : question
          )
        }));
      }
      
      return updated;
    });
  };

  const resolveConflict = (conflictId: string, resolution: Conflict['resolution']) => {
    setConflicts(prev => prev.map(conflict => 
      conflict.id === conflictId 
        ? { 
            ...conflict, 
            resolved: true, 
            resolvedBy: currentUser.id, 
            resolvedAt: new Date(),
            resolution 
          }
        : conflict
    ));

    toast({
      title: 'Conflict Resolved',
      description: `Applied ${resolution} resolution.`,
    });
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    
    const lastOperation = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, lastOperation]);
    setUndoStack(prev => prev.slice(0, -1));
    
    toast({
      title: 'Undone',
      description: 'Last change has been undone.',
    });
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    
    const operation = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, operation]);
    setRedoStack(prev => prev.slice(0, -1));
    
    toast({
      title: 'Redone',
      description: 'Change has been restored.',
    });
  };

  // Render user cursors
  const renderUserCursors = () => (
    <div className="absolute inset-0 pointer-events-none z-10">
      {activeUsers
        .filter(user => user.id !== currentUser.id && user.cursor)
        .map(user => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute"
            style={{
              left: user.cursor!.x,
              top: user.cursor!.y,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div className="flex items-center space-x-2">
              <div 
                className="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                style={{ backgroundColor: user.color }}
              >
                <MousePointer className="w-3 h-3 text-white" />
              </div>
              <div 
                className="px-2 py-1 rounded text-xs text-white font-medium shadow-lg"
                style={{ backgroundColor: user.color }}
              >
                {user.name}
                {user.isTyping && (
                  <span className="ml-1 animate-pulse">✏️</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
    </div>
  );

  // Render conflict alerts
  const renderConflictAlerts = () => (
    <AnimatePresence>
      {conflicts.filter(c => !c.resolved).map(conflict => (
        <motion.div
          key={conflict.id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <DaisyAlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Editing Conflict</h4>
                <p className="text-sm text-yellow-700 mt-1">{conflict.description}</p>
                <div className="flex items-center space-x-2 mt-2">
                  {conflict.affectedUsers.map(userId => {
                    const user = activeUsers.find(u => u.id === userId);
                    return user ? (
                      <DaisyBadge key={userId} variant="outline" className="text-xs">
                        {user.name}
                      </DaisyBadge>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <DaisyButton
                size="sm"
                variant="outline"
                onClick={() => resolveConflict(conflict.id, 'accept_all')}
              >
                <Merge className="w-4 h-4 mr-1" />
                Merge
              </DaisyButton>
              <DaisyButton
                size="sm"
                variant="outline"
                onClick={() => resolveConflict(conflict.id, 'accept_last')}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Keep Latest
              </DaisyButton>
            </div>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );

  return (
    <DaisyTooltipProvider>
      <div className={`relative ${className}`}>
        {/* Header with collaboration status */}
        <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">
                {isConnected ? 'Connected' : 'Reconnecting...'}
              </span>
            </div>
            
            <DaisySeparator orientation="vertical" className="h-4" />
            
            <div className="flex items-center space-x-1">
              {activeUsers.map(user => (
                <DaisyTooltip key={user.id}>
                  <DaisyTooltipTrigger>
                    <div className="relative">
                      <DaisyAvatar className="w-6 h-6 ring-2 ring-white" style={{ borderColor: user.color }}>
                        <DaisyAvatarImage src={user.avatar} />
                        <DaisyAvatarFallback className="text-xs">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </DaisyAvatarFallback>
                      </DaisyAvatar>
                      {user.isTyping && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                          <Edit3 className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                  </DaisyTooltipTrigger>
                  <DaisyTooltipContent>
                    <p>{user.name} {user.isTyping ? '(typing...)' : ''}</p>
                  </DaisyTooltipContent>
                </DaisyTooltip>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <DaisyButton
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
              >
                <Undo className="w-4 h-4" />
              </DaisyButton>
              <DaisyButton
                variant="ghost"
                size="sm"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
              >
                <Redo className="w-4 h-4" />
              </DaisyButton>
            </div>

            <DaisySeparator orientation="vertical" className="h-4" />

            <div className="flex items-center space-x-2 text-sm text-gray-500">
              {isAutoSaving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Save className="w-4 h-4" />
                  </motion.div>
                  <span>Saving...</span>
                </>
              ) : lastSaved ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Saved {lastSaved.toLocaleTimeString()}</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Not saved</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Conflict alerts */}
        {renderConflictAlerts()}

        {/* Editor content */}
        <div ref={editorRef} className="relative">
          <DaisyCard>
            <DaisyCardHeader>
              <div className="space-y-4">
                <DaisyInput
                  value={content.title}
                  onChange={(e) => handleContentEdit('title', 'title', e.target.value)}
                  className="text-xl font-bold border-none shadow-none p-0 focus-visible:ring-0"
                  placeholder="Questionnaire title..."
                />
                <DaisyTextarea
                  value={content.description}
                  onChange={(e) => handleContentEdit('description', 'description', e.target.value)}
                  className="border-none shadow-none p-0 focus-visible:ring-0 resize-none"
                  placeholder="Description..."
                  rows={2}
                />
              </div>
            
            
            <DaisyCardContent className="space-y-6">
              {content.sections.map(section => (
                <div key={section.id} className="space-y-4">
                  <h3 className="text-lg font-medium">{section.title}</h3>
                  
                  {section.questions.map((question, index) => (
                    <div key={question.id} className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-start space-x-3">
                        <span className="text-sm font-medium text-gray-500 mt-1">
                          {index + 1}.
                        </span>
                        <DaisyTextarea
                          value={question.text}
                          onChange={(e) => handleContentEdit(question.id, 'question', e.target.value)}
                          className="flex-1 border-none shadow-none p-0 bg-transparent focus-visible:ring-0 resize-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </DaisyCardBody>
          </DaisyCard>

          {/* User cursors overlay */}
          {renderUserCursors()}
        </div>

        {/* Operation history sidebar */}
        <div className="fixed right-4 top-1/2 transform -translate-y-1/2 w-80 max-h-96 overflow-hidden">
          <DaisyCard className="bg-white/95 backdrop-blur-sm">
            <DaisyCardHeader className="pb-3">
              <DaisyCardTitle className="text-sm flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                Recent Changes
              </DaisyCardTitle>
            
            <DaisyCardContent className="p-0">
              <ScrollArea className="h-60">
                <div className="space-y-2 p-4">
                  {operationHistory.slice(-10).reverse().map(operation => {
                    const user = activeUsers.find(u => u.id === operation.userId);
                    return (
                      <div key={operation.id} className="flex items-start space-x-2 text-xs">
                        <DaisyAvatar className="w-5 h-5 mt-0.5">
                          <DaisyAvatarImage src={user?.avatar} />
                          <DaisyAvatarFallback className="text-xs">
                            {user?.name.split(' ').map(n => n[0]).join('') || '?'}
                          </DaisyAvatarFallback>
                        </DaisyAvatar>
                        <div className="flex-1">
                          <p className="text-gray-900">
                            <span className="font-medium">{user?.name || 'Unknown'}</span> edited {operation.elementType}
                          </p>
                          <p className="text-gray-500">
                            {operation.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </DaisyCardBody>
          </DaisyCard>
        </div>
      </div>
    
  );
} 