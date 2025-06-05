'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  Share2, Users, UserPlus, Mail, Link2, Globe, Lock, Shield,
  Eye, Edit3, MessageCircle, Settings, Copy, Calendar as CalendarIcon,
  Clock, Crown, Key, AlertTriangle, CheckCircle, X, Plus,
  Trash2, MoreVertical, Send, Filter, Search, Download,
  Upload, FileText, Image, Video, Paperclip, Tag, Bell
} from 'lucide-react';

// Types for sharing and permissions
interface ShareUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'editor' | 'commenter' | 'viewer';
  permissions: SharePermission[];
  addedBy: string;
  addedAt: Date;
  lastAccess?: Date;
  status: 'pending' | 'active' | 'declined';
}

interface SharePermission {
  id: string;
  type: 'view' | 'comment' | 'edit' | 'share' | 'admin' | 'delete' | 'export' | 'download';
  granted: boolean;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
}

interface ShareLink {
  id: string;
  name: string;
  url: string;
  type: 'view' | 'edit' | 'comment';
  permissions: SharePermission[];
  expiresAt?: Date;
  passwordProtected: boolean;
  requiresSignIn: boolean;
  downloadAllowed: boolean;
  accessCount: number;
  lastAccessed?: Date;
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
}

interface TeamAssignment {
  id: string;
  questionnaireId: string;
  assignedTo: ShareUser[];
  assignedBy: string;
  assignedAt: Date;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'review' | 'completed' | 'overdue';
  instructions?: string;
  reminders: boolean;
  reminderDays: number[];
  completedAt?: Date;
  completionRate: number;
}

interface ShareDialogProps {
  questionnaireId: string;
  questionnaireName: string;
  currentUser: ShareUser;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onShare?: (settings: any) => void;
}

export function ShareDialog({
  questionnaireId,
  questionnaireName,
  currentUser,
  isOpen,
  onOpenChange,
  onShare
}: ShareDialogProps) {
  // State management
  const [activeTab, setActiveTab] = useState('people');
  const [shareUsers, setShareUsers] = useState<ShareUser[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [assignments, setAssignments] = useState<TeamAssignment[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ShareUser['role']>('viewer');
  const [inviteMessage, setInviteMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'role' | 'remove' | 'permissions' | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Link sharing settings
  const [linkSettings, setLinkSettings] = useState({
    type: 'view' as ShareLink['type'],
    expiresAt: undefined as Date | undefined,
    passwordProtected: false,
    password: '',
    requiresSignIn: true,
    downloadAllowed: true,
    name: 'Shared Link'
  });

  // Assignment settings
  const [assignmentSettings, setAssignmentSettings] = useState({
    dueDate: undefined as Date | undefined,
    priority: 'medium' as TeamAssignment['priority'],
    instructions: '',
    reminders: true,
    reminderDays: [7, 3, 1] // Days before due date
  });

  // Initialize mock data
  useEffect(() => {
    if (isOpen) {
      initializeMockData();
    }
  }, [isOpen]);

  const initializeMockData = () => {
    const mockUsers: ShareUser[] = [
      {
        id: 'user-1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        avatar: '/avatars/sarah.jpg',
        role: 'admin',
        permissions: [
          { id: 'perm-1', type: 'view', granted: true, grantedBy: currentUser.id, grantedAt: new Date() },
          { id: 'perm-2', type: 'edit', granted: true, grantedBy: currentUser.id, grantedAt: new Date() },
          { id: 'perm-3', type: 'share', granted: true, grantedBy: currentUser.id, grantedAt: new Date() }
        ],
        addedBy: currentUser.id,
        addedAt: new Date(Date.now() - 86400000),
        lastAccess: new Date(Date.now() - 3600000),
        status: 'active'
      },
      {
        id: 'user-2',
        name: 'Mike Wilson',
        email: 'mike.wilson@company.com',
        role: 'editor',
        permissions: [
          { id: 'perm-4', type: 'view', granted: true, grantedBy: currentUser.id, grantedAt: new Date() },
          { id: 'perm-5', type: 'edit', granted: true, grantedBy: currentUser.id, grantedAt: new Date() },
          { id: 'perm-6', type: 'comment', granted: true, grantedBy: currentUser.id, grantedAt: new Date() }
        ],
        addedBy: currentUser.id,
        addedAt: new Date(Date.now() - 172800000),
        status: 'active'
      },
      {
        id: 'user-3',
        name: 'Emily Chen',
        email: 'emily.chen@company.com',
        role: 'viewer',
        permissions: [
          { id: 'perm-7', type: 'view', granted: true, grantedBy: currentUser.id, grantedAt: new Date() },
          { id: 'perm-8', type: 'comment', granted: true, grantedBy: currentUser.id, grantedAt: new Date() }
        ],
        addedBy: currentUser.id,
        addedAt: new Date(Date.now() - 259200000),
        status: 'pending'
      }
    ];

    const mockLinks: ShareLink[] = [
      {
        id: 'link-1',
        name: 'Public Review Link',
        url: 'https://riscura.com/shared/abcd1234',
        type: 'view',
        permissions: [
          { id: 'link-perm-1', type: 'view', granted: true, grantedBy: currentUser.id, grantedAt: new Date() }
        ],
        expiresAt: new Date(Date.now() + 604800000), // 7 days
        passwordProtected: false,
        requiresSignIn: false,
        downloadAllowed: true,
        accessCount: 23,
        lastAccessed: new Date(Date.now() - 7200000),
        createdBy: currentUser.id,
        createdAt: new Date(Date.now() - 345600000),
        isActive: true
      }
    ];

    setShareUsers(mockUsers);
    setShareLinks(mockLinks);
  };

  // User management functions
  const handleInviteUser = () => {
    if (!inviteEmail.trim()) {
      toast({
        title: 'Email Required',
        description: 'Please enter an email address to invite.',
        variant: 'destructive'
      });
      return;
    }

    const newUser: ShareUser = {
      id: `user-${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      permissions: generatePermissionsForRole(inviteRole),
      addedBy: currentUser.id,
      addedAt: new Date(),
      status: 'pending'
    };

    setShareUsers(prev => [...prev, newUser]);
    setInviteEmail('');
    setInviteMessage('');

    toast({
      title: 'Invitation Sent',
      description: `Invited ${inviteEmail} as ${inviteRole}.`,
    });
  };

  const generatePermissionsForRole = (role: ShareUser['role']): SharePermission[] => {
    const basePermissions = [
      { id: `perm-${Date.now()}-1`, type: 'view' as const, granted: true, grantedBy: currentUser.id, grantedAt: new Date() }
    ];

    switch (role) {
      case 'owner':
      case 'admin':
        return [
          ...basePermissions,
          { id: `perm-${Date.now()}-2`, type: 'edit' as const, granted: true, grantedBy: currentUser.id, grantedAt: new Date() },
          { id: `perm-${Date.now()}-3`, type: 'share' as const, granted: true, grantedBy: currentUser.id, grantedAt: new Date() },
          { id: `perm-${Date.now()}-4`, type: 'admin' as const, granted: true, grantedBy: currentUser.id, grantedAt: new Date() }
        ];
      case 'editor':
        return [
          ...basePermissions,
          { id: `perm-${Date.now()}-2`, type: 'edit' as const, granted: true, grantedBy: currentUser.id, grantedAt: new Date() },
          { id: `perm-${Date.now()}-3`, type: 'comment' as const, granted: true, grantedBy: currentUser.id, grantedAt: new Date() }
        ];
      case 'commenter':
        return [
          ...basePermissions,
          { id: `perm-${Date.now()}-2`, type: 'comment' as const, granted: true, grantedBy: currentUser.id, grantedAt: new Date() }
        ];
      default:
        return basePermissions;
    }
  };

  const handleRemoveUser = (userId: string) => {
    setShareUsers(prev => prev.filter(user => user.id !== userId));
    toast({
      title: 'User Removed',
      description: 'User access has been revoked.',
    });
  };

  const handleChangeUserRole = (userId: string, newRole: ShareUser['role']) => {
    setShareUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, role: newRole, permissions: generatePermissionsForRole(newRole) }
        : user
    ));
    
    toast({
      title: 'Role Updated',
      description: `User role changed to ${newRole}.`,
    });
  };

  const handleCreateShareLink = () => {
    const newLink: ShareLink = {
      id: `link-${Date.now()}`,
      name: linkSettings.name || 'Shared Link',
      url: `https://riscura.com/shared/${Math.random().toString(36).substr(2, 8)}`,
      type: linkSettings.type,
      permissions: generatePermissionsForRole(linkSettings.type === 'edit' ? 'editor' : 'viewer'),
      expiresAt: linkSettings.expiresAt,
      passwordProtected: linkSettings.passwordProtected,
      requiresSignIn: linkSettings.requiresSignIn,
      downloadAllowed: linkSettings.downloadAllowed,
      accessCount: 0,
      createdBy: currentUser.id,
      createdAt: new Date(),
      isActive: true
    };

    setShareLinks(prev => [...prev, newLink]);
    
    toast({
      title: 'Link Created',
      description: 'Share link has been generated.',
    });
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link Copied',
      description: 'Share link copied to clipboard.',
    });
  };

  const handleBulkAction = () => {
    if (selectedUsers.length === 0) return;

    switch (bulkAction) {
      case 'remove':
        setShareUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
        toast({
          title: 'Users Removed',
          description: `${selectedUsers.length} users removed.`,
        });
        break;
      case 'role':
        // Would show role selection dialog
        break;
      case 'permissions':
        // Would show permission editing dialog
        break;
    }

    setSelectedUsers([]);
    setBulkAction(null);
  };

  // Filter users based on search
  const filteredUsers = shareUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get role badge color
  const getRoleBadgeColor = (role: ShareUser['role']) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'editor': return 'bg-blue-100 text-blue-800';
      case 'commenter': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: ShareUser['status']) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'declined': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Share2 className="w-5 h-5 mr-2" />
            Share "{questionnaireName}"
          </DialogTitle>
          <DialogDescription>
            Manage access and permissions for this questionnaire.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="people">
              People
              {shareUsers.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                  {shareUsers.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* People Tab */}
          <TabsContent value="people" className="space-y-4">
            {/* Invite section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Invite People</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <Select value={inviteRole} onValueChange={(value: ShareUser['role']) => setInviteRole(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="commenter">Commenter</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleInviteUser}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite
                  </Button>
                </div>

                {inviteMessage && (
                  <Textarea
                    placeholder="Add a personal message (optional)"
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    rows={2}
                  />
                )}
              </CardContent>
            </Card>

            {/* People list */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">People with Access</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search people..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                    {selectedUsers.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Actions ({selectedUsers.length})
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setBulkAction('role')}>
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setBulkAction('permissions')}>
                            Edit Permissions
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setBulkAction('remove')}
                            className="text-red-600"
                          >
                            Remove Access
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-64">
                  <div className="space-y-2 p-4">
                    {filteredUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers(prev => [...prev, user.id]);
                              } else {
                                setSelectedUsers(prev => prev.filter(id => id !== user.id));
                              }
                            }}
                            className="rounded"
                          />
                          
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{user.name}</span>
                              <Badge className={getRoleBadgeColor(user.role)}>
                                {user.role}
                              </Badge>
                              <span className={`text-xs ${getStatusColor(user.status)}`}>
                                {user.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            {user.lastAccess && (
                              <p className="text-xs text-gray-500">
                                Last access: {user.lastAccess.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Select
                            value={user.role}
                            onValueChange={(value: ShareUser['role']) => 
                              handleChangeUserRole(user.id, value)
                            }
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">Viewer</SelectItem>
                              <SelectItem value="commenter">Commenter</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Mail className="w-4 h-4 mr-2" />
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Key className="w-4 h-4 mr-2" />
                                Edit Permissions
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleRemoveUser(user.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove Access
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Links Tab */}
          <TabsContent value="links" className="space-y-4">
            {/* Create link section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Create Share Link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Link Name</Label>
                    <Input
                      value={linkSettings.name}
                      onChange={(e) => setLinkSettings(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter link name"
                    />
                  </div>
                  <div>
                    <Label>Access Level</Label>
                    <Select 
                      value={linkSettings.type} 
                      onValueChange={(value: ShareLink['type']) => 
                        setLinkSettings(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="view">View Only</SelectItem>
                        <SelectItem value="comment">View & Comment</SelectItem>
                        <SelectItem value="edit">View & Edit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Require sign-in</Label>
                    <Switch
                      checked={linkSettings.requiresSignIn}
                      onCheckedChange={(checked) => 
                        setLinkSettings(prev => ({ ...prev, requiresSignIn: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Allow downloads</Label>
                    <Switch
                      checked={linkSettings.downloadAllowed}
                      onCheckedChange={(checked) => 
                        setLinkSettings(prev => ({ ...prev, downloadAllowed: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Password protect</Label>
                    <Switch
                      checked={linkSettings.passwordProtected}
                      onCheckedChange={(checked) => 
                        setLinkSettings(prev => ({ ...prev, passwordProtected: checked }))
                      }
                    />
                  </div>
                </div>

                {linkSettings.passwordProtected && (
                  <div>
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={linkSettings.password}
                      onChange={(e) => setLinkSettings(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter password"
                    />
                  </div>
                )}

                <Button onClick={handleCreateShareLink} className="w-full">
                  <Link2 className="w-4 h-4 mr-2" />
                  Create Link
                </Button>
              </CardContent>
            </Card>

            {/* Existing links */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Active Links</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-3 p-4">
                  {shareLinks.map(link => (
                    <div key={link.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium">{link.name}</h4>
                            <Badge variant="outline">{link.type}</Badge>
                            {link.passwordProtected && (
                              <Badge variant="secondary">
                                <Lock className="w-3 h-3 mr-1" />
                                Password
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                            <span>{link.accessCount} views</span>
                            {link.lastAccessed && (
                              <span>Last accessed: {link.lastAccessed.toLocaleString()}</span>
                            )}
                            {link.expiresAt && (
                              <span>Expires: {link.expiresAt.toLocaleDateString()}</span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono flex-1">
                              {link.url}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyLink(link.url)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Edit3 className="w-4 h-4 mr-2" />
                              Edit Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Analytics
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Link
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-4">
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Team assignments coming soon</p>
              <p className="text-sm">Assign questionnaires to team members with deadlines and reminders</p>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="text-center py-8 text-gray-500">
              <Settings className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Advanced sharing settings coming soon</p>
              <p className="text-sm">Configure organization-wide sharing policies and defaults</p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => onShare?.({})}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 