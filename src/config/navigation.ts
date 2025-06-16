import {
  LayoutDashboard,
  Shield,
  CheckCircle,
  FileText,
  Target,
  Zap,
  Clock,
  Monitor,
  Activity,
  ShieldCheck,
  AlertTriangle,
  ClipboardList,
  Brain,
  FileBarChart,
  BarChart,
  Folder,
  Calendar,
  type LucideIcon
} from 'lucide-react';

export interface NavItem {
  id: string;
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  badgeVariant?: 'default' | 'critical' | 'warning' | 'success' | 'info';
  isNew?: boolean;
  description?: string;
  shortcut?: string;
  isFavorite?: boolean;
  lastAccessed?: Date;
}

export interface NavSection {
  id: string;
  title: string;
  emoji: string;
  items: NavItem[];
  collapsible?: boolean;
  description?: string;
}

export interface QuickAccessItem {
  id: string;
  title: string;
  href: string;
  icon: LucideIcon;
  type: 'favorite' | 'recent';
  timestamp?: Date;
}

// New consolidated navigation structure - 4 main sections
export const navigationSections: NavSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    emoji: '📊',
    description: 'Dashboard and quick actions',
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
        shortcut: '⌘ Q',
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
    emoji: '🎯',
    description: 'Risk management and monitoring',
    collapsible: true,
    items: [
      {
        id: 'risk-assessment',
        title: 'Risk Assessment',
        href: '/dashboard/risks/assessment',
        icon: Target,
        description: 'Risk evaluation and analysis',
        shortcut: '⌘ A',
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
    emoji: '🛡️',
    description: 'Compliance frameworks and controls',
    collapsible: true,
    items: [
      {
        id: 'framework-status',
        title: 'Framework Status',
        href: '/dashboard/compliance',
        icon: CheckCircle,
        description: 'SOX, ISO27001, GDPR, HIPAA status',
        shortcut: '⌘ F',
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
        id: 'assessments',
        title: 'Assessments',
        href: '/dashboard/assessments',
        icon: ClipboardList,
        badge: 12,
        badgeVariant: 'info',
        description: 'Self-assessments and questionnaires',
      },
      {
        id: 'controls',
        title: 'Controls',
        href: '/dashboard/controls',
        icon: ShieldCheck,
        badge: 5,
        badgeVariant: 'warning',
        description: 'Control library and testing',
      }
    ]
  },
  {
    id: 'insights-reports',
    title: 'Insights & Reports',
    emoji: '📈',
    description: 'AI insights and reporting',
    collapsible: true,
    items: [
      {
        id: 'ai-insights',
        title: 'AI Insights',
        href: '/dashboard/aria',
        icon: Brain,
        isNew: true,
        description: 'ARIA assistant and predictions',
        shortcut: '⌘ I',
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

// Default favorites for new users
export const defaultFavorites: QuickAccessItem[] = [
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
  },
  {
    id: 'aria-assistant',
    title: 'AI Insights',
    href: '/dashboard/aria',
    icon: Brain,
    type: 'favorite'
  }
];

// Helper functions
export const getBadgeVariant = (variant?: string) => {
  switch (variant) {
    case 'critical': return 'destructive';
    case 'warning': return 'secondary';
    case 'success': return 'default';
    case 'info': return 'secondary';
    default: return 'secondary';
  }
};

export const isItemActive = (href: string, pathname: string) => {
  if (!pathname) return false;
  if (href === '/dashboard') {
    return pathname === '/dashboard';
  }
  return pathname.startsWith(href);
};

export const findNavItemById = (id: string): NavItem | undefined => {
  for (const section of navigationSections) {
    const item = section.items.find(item => item.id === id);
    if (item) return item;
  }
  return undefined;
};

export const findNavItemByHref = (href: string): NavItem | undefined => {
  for (const section of navigationSections) {
    const item = section.items.find(item => item.href === href);
    if (item) return item;
  }
  return undefined;
};

export const getAllNavItems = (): NavItem[] => {
  return navigationSections.flatMap(section => section.items);
};

export const searchNavItems = (query: string): NavItem[] => {
  const lowercaseQuery = query.toLowerCase();
  return getAllNavItems().filter(item => 
    item.title.toLowerCase().includes(lowercaseQuery) ||
    item.description?.toLowerCase().includes(lowercaseQuery)
  );
}; 