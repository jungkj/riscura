import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { hasPermission } from '@/lib/utils';
import { User as UserType } from '@/types';
import {
  LayoutDashboard,
  Shield,
  CheckCircle,
  FileText,
  GitBranch,
  Folder,
  BarChart,
  Brain,
  User,
  ClipboardList,
  Settings,
  Bot,
  AlertTriangle,
  ShieldCheck,
  BarChart3,
  Lightbulb,
  ChevronRight,
  ChevronDown,
  Plus,
  ExternalLink,
  Search,
  Bell,
  Bookmark,
  Command,
  HelpCircle,
  Activity,
  Target,
  Zap,
  PieChart,
  TrendingUp,
  Database,
  Users,
  Lock,
  Workflow,
  Calendar,
  FileCheck,
  Monitor
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  isOpen: boolean;
  user?: UserType;
  onToggle?: () => void;
}

interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
  permissions?: string[];
  priority?: number;
}

interface NavItem {
  id: string;
  title: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
  badgeVariant?: 'default' | 'critical' | 'warning' | 'success' | 'info';
  isNew?: boolean;
  isActive?: boolean;
  permissions?: string[];
  description?: string;
  shortcut?: string;
  subItems?: NavItem[];
  analytics?: boolean;
  external?: boolean;
}

interface QuickAction {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  href: string;
  shortcut?: string;
}

interface UserBookmark {
  id: string;
  title: string;
  href: string;
  icon?: React.ComponentType<any>;
}

export default function Sidebar({ isOpen, user, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>(['main', 'risk-management']);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [userBookmarks, setUserBookmarks] = useState<UserBookmark[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Notion-style navigation structure
  const navigationSections: NavSection[] = [
    {
      id: 'overview',
      title: 'Overview',
      priority: 1,
      items: [
        {
          id: 'dashboard',
          title: 'Overview',
          href: '/dashboard',
          icon: LayoutDashboard,
          description: 'Dashboard home',
          shortcut: '⌘ D',
        }
      ]
    },
    {
      id: 'risk-management',
      title: 'Risk Management',
      priority: 2,
      permissions: ['risk:read'],
      items: [
        {
          id: 'risk-register',
          title: 'Risk Register',
          href: '/dashboard/risks',
          icon: Shield,
          badge: 23,
          badgeVariant: 'critical',
          description: 'Comprehensive risk inventory',
          shortcut: '⌘ R',
        },
        {
          id: 'risk-assessment',
          title: 'Risk Assessment',
          href: '/dashboard/risks/assessment',
          icon: Target,
          description: 'Risk evaluation and analysis',
        },
        {
          id: 'heat-maps',
          title: 'Heat Maps',
          href: '/dashboard/risks/heatmap',
          icon: Activity,
          description: 'Visual risk analysis',
        }
      ]
    },
    {
      id: 'controls',
      title: 'Controls',
      priority: 3,
      permissions: ['control:read'],
      items: [
        {
          id: 'control-library',
          title: 'Control Library',
          href: '/dashboard/controls',
          icon: ShieldCheck,
          description: 'Control framework management',
          shortcut: '⌘ C',
        },
        {
          id: 'testing-schedule',
          title: 'Testing Schedule',
          href: '/dashboard/controls/testing',
          icon: Calendar,
          badge: 5,
          badgeVariant: 'warning',
          description: 'Control testing workflows',
        },
        {
          id: 'compliance-mapping',
          title: 'Compliance Mapping',
          href: '/dashboard/controls/mapping',
          icon: Workflow,
          description: 'Framework compliance mapping',
        }
      ]
    },
    {
      id: 'assessments',
      title: 'Assessments',
      priority: 4,
      permissions: ['assessment:read'],
      items: [
        {
          id: 'questionnaires',
          title: 'Questionnaires',
          href: '/dashboard/questionnaires',
          icon: ClipboardList,
          badge: 12,
          badgeVariant: 'info',
          description: 'Assessment questionnaires',
        },
        {
          id: 'self-assessments',
          title: 'Self-Assessments',
          href: '/dashboard/assessments/self',
          icon: FileCheck,
          description: 'Internal self-assessments',
        },
        {
          id: 'third-party-reviews',
          title: 'Third-Party Reviews',
          href: '/dashboard/assessments/third-party',
          icon: Users,
          description: 'External assessment reviews',
        }
      ]
    },
    {
      id: 'reports-analytics',
      title: 'Reports & Analytics',
      priority: 5,
      permissions: ['report:read'],
      items: [
        {
          id: 'executive-dashboard',
          title: 'Executive Dashboard',
          href: '/dashboard/reporting',
          icon: BarChart3,
          description: 'Executive reporting and insights',
          shortcut: '⌘ E',
        },
        {
          id: 'compliance-reports',
          title: 'Compliance Reports',
          href: '/dashboard/reporting/compliance',
          icon: FileText,
          description: 'Regulatory compliance reports',
        },
        {
          id: 'trend-analysis',
          title: 'Trend Analysis',
          href: '/dashboard/reporting/trends',
          icon: TrendingUp,
          description: 'Historical analysis and trends',
        }
      ]
    },
    {
      id: 'ai-insights',
      title: 'AI Insights',
      priority: 6,
      permissions: ['ai:read'],
      items: [
        {
          id: 'risk-predictions',
          title: 'Risk Predictions',
          href: '/dashboard/ai/predictions',
          icon: Brain,
          description: 'AI-powered risk forecasting',
          isNew: true,
        },
        {
          id: 'control-recommendations',
          title: 'Control Recommendations',
          href: '/dashboard/ai/recommendations',
          icon: Lightbulb,
          badge: 3,
          badgeVariant: 'success',
          description: 'Intelligent recommendations',
        },
        {
          id: 'automated-analysis',
          title: 'Automated Analysis',
          href: '/dashboard/ai/analysis',
          icon: Zap,
          description: 'Continuous automated monitoring',
        }
      ]
    },
    {
      id: 'settings',
      title: 'Settings',
      priority: 7,
      permissions: ['admin:read'],
      items: [
        {
          id: 'user-management',
          title: 'User Management',
          href: '/dashboard/admin/users',
          icon: Users,
          description: 'User accounts and permissions',
        },
        {
          id: 'framework-configuration',
          title: 'Framework Configuration',
          href: '/dashboard/admin/frameworks',
          icon: Settings,
          description: 'Framework settings and config',
        },
        {
          id: 'integration-settings',
          title: 'Integration Settings',
          href: '/dashboard/admin/integrations',
          icon: Database,
          description: 'Third-party integrations',
        }
      ]
    }
  ];

  // Quick actions for frequent tasks
  const quickActions: QuickAction[] = [
    {
      id: 'new-risk',
      title: 'New Risk',
      icon: Plus,
      href: '/dashboard/risks/new',
      shortcut: '⌘ ⇧ R',
    },
    {
      id: 'new-control',
      title: 'New Control',
      icon: Plus,
      href: '/dashboard/controls/new',
      shortcut: '⌘ ⇧ C',
    },
    {
      id: 'search',
      title: 'Search',
      icon: Search,
      href: '/search',
      shortcut: '⌘ K',
    }
  ];

  // Filter navigation based on user permissions
  const filteredSections = navigationSections.filter(section => {
    if (!section.permissions) return true;
    return section.permissions.some(permission => 
      user && hasPermission(user.permissions || [], permission)
    );
  }).map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (!item.permissions) return true;
      return item.permissions.some(permission => 
        user && hasPermission(user.permissions || [], permission)
      );
    })
  }));

  // Keyboard navigation and search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global keyboard shortcuts
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            setShowSearch(true);
            setTimeout(() => searchInputRef.current?.focus(), 100);
            break;
          case 'd':
            e.preventDefault();
            window.location.href = '/dashboard';
            break;
          case 'r':
            e.preventDefault();
            window.location.href = '/dashboard/risks';
            break;
          case 'c':
            e.preventDefault();
            window.location.href = '/dashboard/controls';
            break;
          case 'e':
            e.preventDefault();
            window.location.href = '/dashboard/reporting';
            break;
        }
      }
      
      // Escape key handling
      if (e.key === 'Escape') {
        setShowSearch(false);
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(s => s !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isExpanded = (sectionId: string) => {
    return expandedSections.includes(sectionId);
  };

  const addBookmark = (item: NavItem) => {
    const bookmark: UserBookmark = {
      id: item.id,
      title: item.title,
      href: item.href,
      icon: item.icon,
    };
    setUserBookmarks(prev => [...prev.filter(b => b.id !== item.id), bookmark]);
  };

  const removeBookmark = (bookmarkId: string) => {
    setUserBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
  };

  const isBookmarked = (itemId: string) => {
    return userBookmarks.some(b => b.id === itemId);
  };

  const isItemActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname === href || pathname?.startsWith(href + '/');
  };

  // Search functionality
  const searchResults = showSearch && searchQuery ? 
    filteredSections.flatMap(section => 
      section.items.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    ) : [];

  const getBadgeVariant = (variant?: string) => {
    switch (variant) {
      case 'critical': return 'destructive';
      case 'warning': return 'warning';
      case 'success': return 'success';
      case 'info': return 'secondary';
      default: return 'default';
    }
  };

  if (!isOpen) {
    // Collapsed sidebar - Notion-Style
    return (
      <div className="w-15 h-full bg-white border-r border-border flex flex-col font-inter shadow-notion-sm">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-[#D8C3A5]">
          <Shield className="h-8 w-8 text-[#191919]" />
        </div>

        {/* Collapsed Navigation Icons */}
        <nav className="flex-1 p-2 space-y-1">
          {navigationSections.flatMap(section => section.items).map((item) => {
            const isActive = isItemActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative group flex items-center justify-center w-12 h-12 rounded-lg transition-colors",
                  isActive
                    ? "bg-[#191919] text-[#FAFAFA]"
                    : "text-[#A8A8A8] hover:bg-[#D8C3A5]/20 hover:text-[#191919]"
                )}
              >
                <item.icon className="h-5 w-5" />
                
                {/* Tooltip */}
                <div className="absolute left-full ml-3 px-3 py-2 bg-[#191919] text-[#FAFAFA] text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.title}
                  {item.badge && (
                    <span className="ml-2 px-1.5 py-0.5 bg-[#D8C3A5] text-[#191919] text-xs rounded">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Badge indicator */}
                {item.badge && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapsed User */}
        {user && (
          <div className="border-t border-[#D8C3A5] p-2">
            <div className="relative group flex items-center justify-center w-12 h-12 rounded-lg bg-[#D8C3A5]/20">
              <User className="h-5 w-5 text-[#191919]" />
              
              {/* User tooltip */}
              <div className="absolute left-full ml-3 px-3 py-2 bg-[#191919] text-[#FAFAFA] text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                <p className="font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-[#A8A8A8]">
                  {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Expanded sidebar - Notion-Style Navigation
  return (
    <div className="w-60 h-full bg-white border-r border-border flex flex-col font-inter shadow-notion-sm">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-enterprise-4 border-b border-border/50">
        <div className="flex items-center space-x-enterprise-3">
          <div className="w-8 h-8 bg-interactive-primary rounded-md flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-heading-base text-text-primary font-semibold">Riscura</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSearch(!showSearch)}
          className="text-text-tertiary hover:text-text-primary hover:bg-surface-secondary/50 rounded-md"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="p-enterprise-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search navigation... (⌘K)"
              className="pl-10 pr-4 py-2 text-body-sm bg-surface-secondary border-0 focus:ring-1 focus:ring-interactive-primary"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                ×
              </Button>
            )}
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-enterprise-3 max-h-60 overflow-y-auto">
              <div className="text-caption text-text-tertiary mb-enterprise-2">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </div>
              {searchResults.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setShowSearch(false)}
                  className="flex items-center space-x-enterprise-3 p-enterprise-2 rounded-md hover:bg-surface-secondary transition-colors"
                >
                  <item.icon className="h-4 w-4 text-text-tertiary" />
                  <div className="flex-1 min-w-0">
                    <div className="text-body-sm text-text-primary font-medium truncate">
                      {item.title}
                    </div>
                    {item.description && (
                      <div className="text-caption text-text-tertiary truncate">
                        {item.description}
                      </div>
                    )}
                  </div>
                  {item.shortcut && (
                    <div className="text-caption text-text-tertiary">
                      {item.shortcut}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-enterprise-4 border-b border-border">
        <div className="text-overline text-text-tertiary mb-enterprise-2">
          Quick Actions
        </div>
        <div className="flex space-x-enterprise-2">
          {quickActions.map((action) => (
            <Tooltip key={action.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="flex-1 text-text-secondary hover:text-text-primary border-border hover:border-interactive-primary"
                >
                  <Link href={action.href}>
                    <action.icon className="h-4 w-4 mr-enterprise-1" />
                    {action.title}
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{action.title} {action.shortcut && `(${action.shortcut})`}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Bookmarks */}
      {userBookmarks.length > 0 && (
        <div className="p-enterprise-4 border-b border-border">
          <div className="text-overline text-text-tertiary mb-enterprise-2">
            Bookmarks
          </div>
          <div className="space-y-enterprise-1">
            {userBookmarks.map((bookmark) => (
              <Link
                key={bookmark.id}
                href={bookmark.href}
                className="flex items-center space-x-enterprise-2 p-enterprise-2 rounded-md hover:bg-surface-secondary transition-colors group"
              >
                {bookmark.icon && <bookmark.icon className="h-4 w-4 text-text-tertiary" />}
                <span className="text-body-sm text-text-primary truncate">{bookmark.title}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    removeBookmark(bookmark.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                >
                  ×
                </Button>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-enterprise-4 overflow-y-auto">
        {filteredSections.map((section) => {
          const sectionExpanded = isExpanded(section.id);
          
          return (
            <div key={section.id} className="mb-enterprise-6">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-enterprise-4 mb-enterprise-2 text-left hover:bg-surface-secondary/50 rounded-md transition-colors"
              >
                <h3 className="text-overline text-text-tertiary">
                  {section.title}
                </h3>
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 text-text-tertiary transition-transform",
                    sectionExpanded ? "rotate-180" : ""
                  )}
                />
              </button>

              {/* Section Items */}
              {sectionExpanded && (
                <div className="space-y-enterprise-1 px-enterprise-2">
                  {section.items.map((item) => {
                    const isActive = isItemActive(item.href);
                    const bookmarked = isBookmarked(item.id);
                    
                    return (
                      <div key={item.id} className="group relative">
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center justify-between px-enterprise-3 py-2 mx-enterprise-1 rounded-md text-body-sm font-medium transition-all group/item",
                            isActive
                              ? "bg-surface-tertiary text-text-primary border-l-2 border-interactive-primary"
                              : "text-text-secondary hover:bg-surface-secondary/50 hover:text-text-primary"
                          )}
                        >
                          <div className="flex items-center space-x-enterprise-3 min-w-0 flex-1">
                            <item.icon className="h-5 w-5 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="truncate">{item.title}</div>
                              {item.description && !isActive && (
                                <div className="text-caption text-text-tertiary truncate">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-enterprise-2 shrink-0">
                            {item.shortcut && !isActive && (
                              <div className="text-caption text-text-tertiary font-mono">
                                {item.shortcut}
                              </div>
                            )}
                            
                            {item.badge && (
                              <Badge 
                                variant={getBadgeVariant(item.badgeVariant) as any}
                                className="text-xs px-1.5 py-0.5"
                              >
                                {item.badge}
                              </Badge>
                            )}
                            
                            {item.isNew && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-semantic-success text-white">
                                New
                              </Badge>
                            )}
                            
                            {item.external && (
                              <ExternalLink className="h-3 w-3" />
                            )}
                          </div>
                        </Link>

                        {/* Bookmark Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => bookmarked ? removeBookmark(item.id) : addBookmark(item)}
                          className={cn(
                            "absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                            bookmarked ? "text-yellow-500" : "text-text-tertiary hover:text-text-primary"
                          )}
                        >
                          <Bookmark className={cn("h-3 w-3", bookmarked ? "fill-current" : "")} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>



      {/* User Profile */}
      {user && (
        <div className="border-t border-[#D8C3A5] p-4">
          <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-[#D8C3A5]/20 transition-colors cursor-pointer">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-[#D8C3A5] text-[#191919] text-sm font-semibold">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#191919] truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-[#A8A8A8] truncate">
                {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </p>
            </div>
            <Settings className="h-4 w-4 text-[#A8A8A8]" />
          </div>
        </div>
      )}
    </div>
  );
}