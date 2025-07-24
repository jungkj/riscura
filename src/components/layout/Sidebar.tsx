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
  ChevronLeft,
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
  Home,
  Star,
  Layers,
  Database,
  BarChart,
  FileBarChart,
  Compass,
  Grid3X3
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisyAvatar, DaisyAvatarFallback, DaisyAvatarImage } from '@/components/ui/DaisyAvatar';
import { DaisyInput } from '@/components/ui/DaisyInput';
import { DaisyTooltip, DaisyTooltipContent, DaisyTooltipTrigger, DaisyTooltipWrapper } from '@/components/ui/DaisyTooltip';
import { DaisySeparator } from '@/components/ui/DaisySeparator';

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
  description?: string;
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
  isFavorite?: boolean;
  lastAccessed?: Date;
}

interface QuickAccessItem {
  id: string;
  title: string;
  href: string;
  icon: React.ComponentType<any>;
  type: 'favorite' | 'recent';
  timestamp?: Date;
}

export default function Sidebar({ isOpen, user, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'overview', 
    'risk-operations', 
    'compliance-hub', 
    'insights-reports'
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [favorites, setFavorites] = useState<QuickAccessItem[]>([
    {
      id: 'dashboard',
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      type: 'favorite'
    },
    {
      id: 'risk-register',
      title: 'Risk Register',
      href: '/dashboard/risks',
      icon: Shield,
      type: 'favorite'
    }
  ]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // New consolidated navigation structure - 4 main sections
  const navigationSections: NavSection[] = [
    {
      id: 'overview',
      title: 'Overview',
      emoji: '',
      description: 'Dashboard and quick actions',
      collapsible: false,
      items: [
        {
          id: 'dashboard',
          title: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
          description: 'Main dashboard overview',
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
      id: 'risk-operations',
      title: 'Risk Operations',
      emoji: '',
      description: 'Risk management and monitoring',
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
          description: 'Comprehensive risk inventory',
        },
        {
          id: 'spreadsheets',
          title: 'Spreadsheets',
          href: '/dashboard/spreadsheets',
          icon: Grid3X3,
          description: 'RCSA matrices and risk spreadsheets',
          isNew: true,
        },
        {
          id: 'risk-monitoring',
          title: 'Risk Monitoring',
          href: '/dashboard/risks/monitoring',
          icon: Monitor,
          description: 'Real-time risk tracking',
        },
        {
          id: 'risk-heatmap',
          title: 'Risk Heatmap',
          href: '/dashboard/risks/heatmap',
          icon: Activity,
          description: 'Visual risk analysis',
        }
      ]
    },
    {
      id: 'compliance-hub',
      title: 'Compliance Hub',
      emoji: '',
      description: 'Compliance frameworks and controls',
      collapsible: true,
      items: [
        {
          id: 'framework-status',
          title: 'Framework Status',
          href: '/dashboard/compliance',
          icon: CheckCircle,
          description: 'SOX, ISO27001, GDPR, HIPAA status',
        },
        {
          id: 'gap-analysis',
          title: 'Gap Analysis',
          href: '/dashboard/compliance/gaps',
          icon: AlertTriangle,
          description: 'Compliance gap identification',
        },
        {
          id: 'assessments',
          title: 'Assessments',
          href: '/dashboard/assessments',
          icon: ClipboardList,
          description: 'Self-assessments and questionnaires',
        },
        {
          id: 'controls',
          title: 'Controls',
          href: '/dashboard/controls',
          icon: ShieldCheck,
          description: 'Control library and testing',
        }
      ]
    },
    {
      id: 'insights-reports',
      title: 'Insights & Reports',
      emoji: '',
      description: 'AI insights and reporting',
      collapsible: true,
      items: [
        {
          id: 'ai-chat',
          title: 'AI Chat',
          href: '/dashboard/aria',
          icon: Brain,
          isNew: true,
          description: 'ARIA assistant and predictions',
        },
        {
          id: 'report-builder',
          title: 'Report Builder',
          href: '/dashboard/reporting',
          icon: FileBarChart,
          description: 'Custom report generation',
        },
        {
          id: 'analytics',
          title: 'Analytics',
          href: '/dashboard/analytics',
          icon: BarChart,
          description: 'Trend analysis and metrics',
        },
        {
          id: 'documents',
          title: 'Documents',
          href: '/dashboard/documents',
          icon: Folder,
          description: 'Document library and policies',
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
    
    // Exact match first
    if (pathname === href) return true;
    
    // For nested routes, only match if the current path is a direct child
    // This prevents '/dashboard/risks' from matching '/dashboard/risks/assessment'
    if (pathname.startsWith(href + '/')) {
      // Check if it's a direct child (no additional slashes after the href)
      const remainder = pathname.slice(href.length + 1);
      return !remainder.includes('/');
    }
    
    return false;
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

  const toggleFavorite = (item: NavItem) => {
    const quickAccessItem: QuickAccessItem = {
      id: item.id,
      title: item.title,
      href: item.href,
      icon: item.icon,
      type: 'favorite'
    };

    setFavorites(prev => {
      const exists = prev.find(fav => fav.id === item.id);
      if (exists) {
        return prev.filter(fav => fav.id !== item.id);
      } else {
        return [...prev, quickAccessItem].slice(0, 5); // Limit to 5 favorites
      }
    });
  };

  const isFavorite = (itemId: string) => {
    return favorites.some(fav => fav.id === itemId);
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return timestamp.toLocaleDateString();
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

  // Collapsed sidebar view
  if (!isOpen) {
    return (
      <div className="flex flex-col h-full w-16 bg-[#FAFAFA] border-r border-gray-200">
        {/* Collapsed Header with Logo and Toggle */}
        <div className="flex flex-col items-center h-20 border-b border-gray-200 py-2">
          <div className="flex-1 flex items-center justify-center">
            <Image
              src="/images/logo/riscura.png"
              alt="Riscura"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <DaisyButton
            variant="ghost"
            shape="square" size="md"
            onClick={onToggle}
            className="w-6 h-6 text-[#191919] hover:bg-[#199BEC]/10 hover:text-[#199BEC] transition-colors"
          >
            <ChevronRight className="w-3 h-3" />
          </DaisyButton>
        </div>

        {/* Collapsed Navigation */}
        <div className="flex-1 py-4 space-y-2">
          {navigationSections.map((section) => (
            <DaisyTooltipProvider key={section.id}>
              <DaisyTooltip>
                <DaisyTooltipTrigger asChild>
                  <DaisyButton
                    variant="ghost"
                    shape="square" size="md"
                    className={cn(
                      "w-10 h-10 mx-auto text-[#191919] hover:bg-[#199BEC]/10 hover:text-[#199BEC] transition-all duration-200",
                      section.items.some(item => isItemActive(item.href)) && "bg-[#199BEC] text-white shadow-md"
                    )}
                    onClick={() => onToggle?.()}
                  >
                    {section.items[0] && (() => {
                      const IconComponent = section.items[0].icon;
                      return <IconComponent className="w-5 h-5" />;
                    })()}
                  </DaisyButton>
                </DaisyTooltipTrigger>
                <DaisyTooltipContent side="right" className="font-medium">
                  <div>
                    <p className="font-semibold">{section.title}</p>
                    <p className="text-xs text-gray-500">{section.description}</p>
                  </div>
                </DaisyTooltipContent>
              </DaisyTooltip>
            
          ))}
        </div>

        {/* Collapsed User */}
        <div className="p-4 border-t border-gray-200">
          <DaisyTooltipProvider>
            <DaisyTooltip>
              <DaisyTooltipTrigger asChild>
                <DaisyAvatar className="w-8 h-8 mx-auto cursor-pointer">
                  <DaisyAvatarImage src={user?.avatar} />
                  <DaisyAvatarFallback className="text-xs bg-[#199BEC] text-white">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </DaisyAvatarFallback>
                </DaisyAvatar>
              </DaisyTooltipTrigger>
              <DaisyTooltipContent side="right" className="font-medium">
                {user?.firstName} {user?.lastName}
              </DaisyTooltipContent>
            </DaisyTooltip>
          
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-64 bg-[#FAFAFA] border-r border-gray-200" data-tour="sidebar">
      {/* Header */}
      <div className="flex items-center justify-between h-20 px-4 border-b border-gray-200">
        <div className="flex items-center gap-3 flex-1 min-w-0 py-2">
          <Image
            src="/images/logo/riscura.png"
            alt="Riscura Logo"
            width={120}
            height={40}
            className="object-contain"
            style={{ width: 'auto', height: 'auto', maxWidth: '120px', maxHeight: '40px' }}
            priority
          />
        </div>
        <DaisyButton
          variant="ghost"
          shape="square" size="md"
          onClick={onToggle}
          className="w-8 h-8 text-[#191919] hover:bg-[#199BEC]/10 hover:text-[#199BEC] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </DaisyButton>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200" data-tour="global-search">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <DaisyInput
            ref={searchInputRef}
            placeholder="Search features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 text-sm bg-white/50 border-gray-200/60 focus:ring-2 focus:ring-[#199BEC]/20 focus:border-[#199BEC]/50 rounded-xl"
          />
          {searchQuery && (
            <DaisyButton
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-[#191919]"
            >
              ×
            </DaisyButton>
          )}
        </div>
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <Command className="w-3 h-3" />
          <span> K to search</span>
        </div>
      </div>

      {/* Quick Access - Favorites */}
      {!searchQuery && (
        <div className="px-4 py-3 border-b border-gray-200 bg-white/30">
          {/* Favorites */}
          {favorites.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-3 h-3 text-[#199BEC]" />
                <span className="text-xs font-semibold text-[#191919] uppercase tracking-wide">Favorites</span>
              </div>
              <div className="space-y-1">
                {favorites.slice(0, 3).map((item) => (
                  <Link key={item.id} href={item.href}>
                    <div
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200 group",
                        "text-[#191919] hover:bg-[#199BEC]/10 hover:text-[#199BEC]"
                      )}
                    >
                      <item.icon className="w-3 h-3 flex-shrink-0" />
                      <span className="flex-1 truncate">{item.title}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}


        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="space-y-6">
          {filteredSections.map((section) => (
            <div key={section.id} className="px-4">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-[#191919] font-inter">
                      {section.title}
                    </h3>
                    {section.description && (
                      <p className="text-xs text-gray-500 font-inter">
                        {section.description}
                      </p>
                    )}
                  </div>
                </div>
                {section.collapsible && (
                  <DaisyButton
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection(section.id)}
                    className="w-5 h-5 p-0 text-gray-500 hover:text-[#191919] hover:bg-[#199BEC]/10 transition-colors"
                  >
                    {isExpanded(section.id) ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </DaisyButton>
                )}
              </div>

              {/* Section Items */}
              {(!section.collapsible || isExpanded(section.id)) && (
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <div key={item.id} className="group relative">
                      <Link href={item.href}>
                        <div
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                            isItemActive(item.href)
                              ? "bg-[#199BEC] text-white shadow-md shadow-[#199BEC]/25 scale-[1.02]"
                              : "text-[#191919] hover:bg-[#199BEC]/10 hover:text-[#199BEC] hover:scale-[1.01]"
                          )}
                          {...(item.id === 'ai-chat' && { 'data-tour': 'aria-assistant' })}
                        >
                          <item.icon 
                            className={cn(
                              "w-4 h-4 flex-shrink-0 transition-colors",
                              isItemActive(item.href) ? "text-white" : "text-gray-600 group-hover:text-[#199BEC]"
                            )} 
                          />
                          <span className="flex-1 truncate font-inter">{item.title}</span>
                          
                          {/* Badges and Actions */}
                          <div className="flex items-center gap-1">
                            {item.isNew && (
                              <DaisyBadge variant="secondary" className="px-1.5 py-0.5 text-xs bg-[#199BEC] text-white border-0">
                                New
                              </DaisyBadge>
                            )}
                          </div>
                        </div>
                      </Link>
                      
                      {/* Favorite Toggle */}
                      <DaisyButton
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFavorite(item);
                        }}
                        className={cn(
                          "absolute right-1 top-1/2 transform -translate-y-1/2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                          isFavorite(item.id) && "opacity-100"
                        )}
                      >
                        <Star 
                          className={cn(
                            "w-3 h-3",
                            isFavorite(item.id) ? "text-[#199BEC] fill-[#199BEC]" : "text-gray-400 hover:text-[#199BEC]"
                          )} 
                        />
                      </DaisyButton>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200" data-tour="user-profile">
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#199BEC]/10 transition-colors cursor-pointer group">
          <DaisyAvatar className="w-8 h-8">
            <DaisyAvatarImage src={user?.avatar} />
            <DaisyAvatarFallback className="bg-[#199BEC] text-white text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </DaisyAvatarFallback>
          </DaisyAvatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#191919] font-inter truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-600 truncate">{user?.email}</p>
          </div>
          <DaisyButton variant="ghost" shape="square" size="md" className="w-6 h-6 text-gray-500 hover:text-[#199BEC] opacity-0 group-hover:opacity-100 transition-all" data-tour="help-menu">
            <Settings className="w-4 h-4" />
          </DaisyButton>
        </div>
      </div>
    </div>
  );
}