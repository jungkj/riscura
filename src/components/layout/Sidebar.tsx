import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { User as UserType } from '@/types';
import {
  LayoutDashboard,
  Shield,
  CheckCircle,
  FileText,
  GitBranch,
  Folder,
  BarChart3,
  Brain,
  User,
  ClipboardList,
  Settings,
  Bot,
  AlertTriangle,
  ShieldCheck,
  Lightbulb,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  Bell,
  Target,
  Zap,
  PieChart,
  TrendingUp,
  Users,
  Lock,
  Workflow,
  Calendar,
  FileCheck,
  Upload,
  Sparkles,
  MessageSquare,
  Gauge,
  Building2,
  LineChart,
  Activity,
  Archive,
  BookOpen,
  Clock,
  Eye,
  HelpCircle,
  Command,
  MapPin,
  Monitor,
  Bookmark,
  Home
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  isOpen: boolean;
  user?: UserType;
  onToggle?: () => void;
}

interface NavSection {
  id: string;
  title: string;
  emoji: string;
  items: NavItem[];
  collapsible?: boolean;
}

interface NavItem {
  id: string;
  title: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
  badgeVariant?: 'default' | 'critical' | 'warning' | 'success' | 'info';
  isNew?: boolean;
  description?: string;
  shortcut?: string;
}

export default function Sidebar({ isOpen, user, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'overview', 
    'risk-management', 
    'controls', 
    'assessments',
    'compliance',
    'documents',
    'workflows',
    'ai-insights',
    'reports'
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Navigation structure matching the requirements
  const navigationSections: NavSection[] = [
    {
      id: 'overview',
      title: 'Overview',
      emoji: '📊',
      collapsible: false,
      items: [
        {
          id: 'dashboard',
          title: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
          description: 'Main dashboard overview',
          shortcut: '⌘ D',
        },
        {
          id: 'quick-actions',
          title: 'Quick Actions',
          href: '/dashboard/quick-actions',
          icon: Zap,
          description: 'Frequently used actions',
        },
        {
          id: 'recent-activity',
          title: 'Recent Activity',
          href: '/dashboard/activity',
          icon: Clock,
          description: 'Latest updates and changes',
        }
      ]
    },
    {
      id: 'risk-management',
      title: 'Risk Management',
      emoji: '🎯',
      collapsible: true,
      items: [
        {
          id: 'risk-assessment',
          title: 'Risk Assessment',
          href: '/dashboard/risks/assessment',
          icon: Target,
          description: 'Risk evaluation and analysis',
        },
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
          id: 'risk-heatmap',
          title: 'Risk Heatmap',
          href: '/dashboard/risks/heatmap',
          icon: Activity,
          description: 'Visual risk analysis',
        },
        {
          id: 'risk-monitoring',
          title: 'Risk Monitoring',
          href: '/dashboard/risks/monitoring',
          icon: Monitor,
          description: 'Real-time risk tracking',
        }
      ]
    },
    {
      id: 'controls',
      title: 'Controls',
      emoji: '🛡️',
      collapsible: true,
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
          id: 'control-testing',
          title: 'Control Testing',
          href: '/dashboard/controls/testing',
          icon: Calendar,
          badge: 5,
          badgeVariant: 'warning',
          description: 'Control testing workflows',
        },
        {
          id: 'control-mapping',
          title: 'Control Mapping',
          href: '/dashboard/controls/mapping',
          icon: MapPin,
          description: 'Risk-to-control mapping',
        },
        {
          id: 'effectiveness-tracking',
          title: 'Effectiveness Tracking',
          href: '/dashboard/controls/effectiveness',
          icon: TrendingUp,
          description: 'Control performance metrics',
        }
      ]
    },
    {
      id: 'assessments',
      title: 'Assessments',
      emoji: '📋',
      collapsible: true,
      items: [
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
        },
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
          id: 'rcsa-import',
          title: 'RCSA Import',
          href: '/dashboard/import/rcsa',
          icon: Upload,
          badge: 'New',
          badgeVariant: 'success',
          description: 'Import RCSA data',
        }
      ]
    },
    {
      id: 'compliance',
      title: 'Compliance',
      emoji: '📚',
      collapsible: true,
      items: [
        {
          id: 'framework-library',
          title: 'Framework Library',
          href: '/dashboard/compliance/frameworks',
          icon: BookOpen,
          description: 'SOX, ISO27001, GDPR, HIPAA, etc.',
        },
        {
          id: 'gap-analysis',
          title: 'Gap Analysis',
          href: '/dashboard/compliance/gaps',
          icon: AlertTriangle,
          badge: 8,
          badgeVariant: 'warning',
          description: 'Compliance gap identification',
        },
        {
          id: 'compliance-mapping',
          title: 'Compliance Mapping',
          href: '/dashboard/compliance/mapping',
          icon: Workflow,
          description: 'Framework compliance mapping',
        },
        {
          id: 'regulatory-monitoring',
          title: 'Regulatory Monitoring',
          href: '/dashboard/compliance/monitoring',
          icon: Eye,
          description: 'Regulatory change tracking',
        }
      ]
    },
    {
      id: 'documents',
      title: 'Documents',
      emoji: '📄',
      collapsible: true,
      items: [
        {
          id: 'document-library',
          title: 'Document Library',
          href: '/dashboard/documents',
          icon: Folder,
          description: 'Document management',
        },
        {
          id: 'policy-store',
          title: 'Policy Store',
          href: '/dashboard/documents/policies',
          icon: FileText,
          description: 'Policy management',
        },
        {
          id: 'evidence-collection',
          title: 'Evidence Collection',
          href: '/dashboard/documents/evidence',
          icon: Archive,
          description: 'Audit evidence management',
        },
        {
          id: 'templates',
          title: 'Templates',
          href: '/dashboard/documents/templates',
          icon: Bookmark,
          description: 'Document templates',
        }
      ]
    },
    {
      id: 'workflows',
      title: 'Workflows',
      emoji: '🔄',
      collapsible: true,
      items: [
        {
          id: 'workflow-builder',
          title: 'Workflow Builder',
          href: '/dashboard/workflows',
          icon: GitBranch,
          description: 'Process automation',
        },
        {
          id: 'approvals-queue',
          title: 'Approvals Queue',
          href: '/dashboard/workflows/approvals',
          icon: CheckCircle,
          badge: 8,
          badgeVariant: 'warning',
          description: 'Pending approvals',
        },
        {
          id: 'process-automation',
          title: 'Process Automation',
          href: '/dashboard/workflows/automation',
          icon: Zap,
          description: 'Automated processes',
        },
        {
          id: 'task-management',
          title: 'Task Management',
          href: '/dashboard/workflows/tasks',
          icon: CheckCircle,
          description: 'Task tracking and management',
        }
      ]
    },
    {
      id: 'ai-insights',
      title: 'AI Insights',
      emoji: '🤖',
      collapsible: true,
      items: [
        {
          id: 'aria-assistant',
          title: 'ARIA Assistant',
          href: '/dashboard/aria',
          icon: Bot,
          isNew: true,
          description: 'AI-powered assistant',
          shortcut: '⌘ A',
        },
        {
          id: 'risk-predictions',
          title: 'Risk Predictions',
          href: '/dashboard/ai-insights/predictions',
          icon: Sparkles,
          description: 'AI-powered risk forecasting',
        },
        {
          id: 'smart-recommendations',
          title: 'Smart Recommendations',
          href: '/dashboard/ai-insights/recommendations',
          icon: Lightbulb,
          badge: 3,
          badgeVariant: 'success',
          description: 'Intelligent recommendations',
        },
        {
          id: 'automated-analysis',
          title: 'Automated Analysis',
          href: '/dashboard/ai-insights/analysis',
          icon: Brain,
          description: 'Continuous monitoring',
        }
      ]
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      emoji: '📊',
      collapsible: true,
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
        },
        {
          id: 'custom-reports',
          title: 'Custom Reports',
          href: '/dashboard/reporting/custom',
          icon: PieChart,
          description: 'Custom report builder',
        }
      ]
    }
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'k') {
          e.preventDefault();
          setShowSearch(!showSearch);
        }
        if (e.key === 'b') {
          e.preventDefault();
          onToggle?.();
        }
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSearch, onToggle]);

  // Focus search input when shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isExpanded = (sectionId: string) => {
    return expandedSections.includes(sectionId);
  };

  const isItemActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const getBadgeVariant = (variant?: string) => {
    switch (variant) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      case 'success': return 'default';
      case 'info': return 'secondary';
      default: return 'secondary';
    }
  };

  // Filter items based on search
  const filteredSections = searchQuery 
    ? navigationSections.map(section => ({
        ...section,
        items: section.items.filter(item => 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(section => section.items.length > 0)
    : navigationSections;

  if (!isOpen) {
    return (
      <div className="flex flex-col h-full w-16 bg-[#FAFAFA] border-r border-gray-200">
        {/* Collapsed Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <Image
            src="/images/logo/riscura.png"
            alt="Riscura"
            width={32}
            height={32}
            className="object-contain"
            priority
          />
        </div>

        {/* Collapsed Navigation */}
        <div className="flex-1 py-4 space-y-2">
          {navigationSections.slice(0, 8).map((section) => (
            <TooltipProvider key={section.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "w-10 h-10 mx-auto text-[#191919] hover:bg-[#D8C3A5]/20",
                      section.items.some(item => isItemActive(item.href)) && "bg-[#199BEC] text-white"
                    )}
                    onClick={() => onToggle?.()}
                  >
                    <span className="text-lg">{section.emoji}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {section.title}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        {/* Collapsed User */}
        <div className="p-4 border-t border-gray-200">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="w-8 h-8 mx-auto cursor-pointer">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="text-xs bg-[#199BEC] text-white">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                {user?.firstName} {user?.lastName}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-64 bg-[#FAFAFA] border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Image
            src="/images/logo/riscura.png"
            alt="Riscura Logo"
            width={120}
            height={32}
            className="object-contain"
            priority
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="w-8 h-8 text-[#191919] hover:bg-[#D8C3A5]/20"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            ref={searchInputRef}
            placeholder="Search features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 text-sm bg-white/50 border-gray-200/60 focus:ring-2 focus:ring-[#199BEC]/20 focus:border-[#199BEC]/50 rounded-xl"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-[#191919]"
            >
              ×
            </Button>
          )}
        </div>
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <Command className="w-3 h-3" />
          <span>⌘ K to search</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="space-y-6">
          {filteredSections.map((section) => (
            <div key={section.id} className="px-4">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{section.emoji}</span>
                  <h3 className="text-sm font-semibold text-[#191919] font-inter">
                    {section.title}
                  </h3>
                </div>
                {section.collapsible && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection(section.id)}
                    className="w-5 h-5 p-0 text-gray-500 hover:text-[#191919] hover:bg-[#D8C3A5]/20"
                  >
                    {isExpanded(section.id) ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </Button>
                )}
              </div>

              {/* Section Items */}
              {(!section.collapsible || isExpanded(section.id)) && (
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link key={item.id} href={item.href}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                          isItemActive(item.href)
                            ? "bg-[#199BEC] text-white shadow-md shadow-[#199BEC]/25 scale-[1.02]"
                            : "text-[#191919] hover:bg-[#D8C3A5]/20 hover:text-[#191919]"
                        )}
                      >
                        <item.icon 
                          className={cn(
                            "w-4 h-4 flex-shrink-0",
                            isItemActive(item.href) ? "text-white" : "text-gray-600 group-hover:text-[#191919]"
                          )} 
                        />
                        <span className="flex-1 truncate font-inter">{item.title}</span>
                        
                        {/* Badges */}
                        <div className="flex items-center gap-1">
                          {item.isNew && (
                            <Badge variant="secondary" className="px-1.5 py-0.5 text-xs bg-[#199BEC] text-white border-0">
                              New
                            </Badge>
                          )}
                          {item.badge && (
                            <Badge 
                              variant={getBadgeVariant(item.badgeVariant)} 
                              className={cn(
                                "px-1.5 py-0.5 text-xs font-medium",
                                item.badgeVariant === 'critical' && "bg-red-100 text-red-700 border-red-200",
                                item.badgeVariant === 'warning' && "bg-orange-100 text-orange-700 border-orange-200",
                                item.badgeVariant === 'success' && "bg-green-100 text-green-700 border-green-200",
                                item.badgeVariant === 'info' && "bg-blue-100 text-blue-700 border-blue-200"
                              )}
                            >
                              {item.badge}
                            </Badge>
                          )}
                          {item.shortcut && !isItemActive(item.href) && (
                            <span className="text-xs text-gray-400 font-mono">{item.shortcut}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#D8C3A5]/20 transition-colors cursor-pointer">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="bg-[#199BEC] text-white text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#191919] font-inter truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-600 truncate">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" className="w-6 h-6 text-gray-500 hover:text-[#191919]">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}