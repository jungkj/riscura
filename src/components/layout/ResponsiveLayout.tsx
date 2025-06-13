'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import {
  Menu,
  X,
  Search,
  Bell,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  Home,
  Target,
  Shield,
  FileText,
  BarChart3,
  Users,
  Workflow,
  Activity,
  HelpCircle,
  LogOut,
  Keyboard,
  Monitor,
  Smartphone,
  Tablet,
  Sun,
  Moon,
  Globe,
  ArrowLeft,
  MoreHorizontal,
  Plus,
  Filter,
  Download,
  Upload,
  Share2,
  Bookmark,
  Archive,
  Trash2,
  Edit,
  Eye,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Link,
  Copy,
  Check,
  AlertCircle,
  Info,
  Zap,
  Star,
  Heart,
  MessageSquare,
  Command,
  Laptop,
} from 'lucide-react';
import { ResponsiveSidebar } from './ResponsiveSidebar';
import { 
  useDevice, 
  useSidebarState, 
  useSwipeGesture, 
  useKeyboardShortcuts,
  useSafeAreaInsets 
} from '@/lib/responsive/hooks';

// Types
interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string | number;
  children?: NavigationItem[];
  shortcut?: string;
  description?: string;
}

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  currentPath?: string;
  onNavigate?: (href: string) => void;
  pageTitle?: string;
  pageSubtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  notifications?: number;
  showBreadcrumbs?: boolean;
  showPageHeader?: boolean;
  theme?: 'light' | 'dark' | 'system';
  onThemeChange?: (theme: 'light' | 'dark' | 'system') => void;
  className?: string;
}

interface Device {
  type: 'mobile' | 'tablet' | 'desktop';
  width: number;
  height: number;
  isTouchDevice: boolean;
  orientation: 'portrait' | 'landscape';
}

// Custom Hooks
const useDevice = (): Device => {
  const [device, setDevice] = useState<Device>({
    type: 'desktop',
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    isTouchDevice: typeof window !== 'undefined' ? 'ontouchstart' in window : false,
    orientation: typeof window !== 'undefined' && window.innerWidth < window.innerHeight ? 'portrait' : 'landscape',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      let type: Device['type'] = 'desktop';

      if (width < 768) {
        type = 'mobile';
      } else if (width < 1024) {
        type = 'tablet';
      }

      setDevice({
        type,
        width,
        height,
        isTouchDevice: 'ontouchstart' in window,
        orientation: width < height ? 'portrait' : 'landscape',
      });
    };

    updateDevice();
    window.addEventListener('resize', updateDevice);
    window.addEventListener('orientationchange', updateDevice);

    return () => {
      window.removeEventListener('resize', updateDevice);
      window.removeEventListener('orientationchange', updateDevice);
    };
  }, []);

  return device;
};

const useKeyboardShortcuts = (shortcuts: Record<string, () => void>) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const ctrlOrCmd = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;
      const alt = event.altKey;

      // Construct shortcut string
      let shortcut = '';
      if (ctrlOrCmd) shortcut += 'ctrl+';
      if (shift) shortcut += 'shift+';
      if (alt) shortcut += 'alt+';
      shortcut += key;

      if (shortcuts[shortcut]) {
        event.preventDefault();
        shortcuts[shortcut]();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

const useSwipeGesture = (
  elementRef: React.RefObject<HTMLElement>,
  onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void,
  threshold = 50
) => {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStart.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.current.x;
      const deltaY = touch.clientY - touchStart.current.y;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > threshold) {
          onSwipe(deltaX > 0 ? 'right' : 'left');
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > threshold) {
          onSwipe(deltaY > 0 ? 'down' : 'up');
        }
      }

      touchStart.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipe, threshold]);
};

// Navigation Data
const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home className="h-4 w-4" />,
    href: '/dashboard',
    shortcut: 'ctrl+h',
    description: 'Overview and insights',
  },
  {
    id: 'risks',
    label: 'Risk Management',
    icon: <Target className="h-4 w-4" />,
    href: '/risks',
    badge: 12,
    shortcut: 'ctrl+r',
    description: 'Manage and assess risks',
    children: [
      {
        id: 'risk-assessment',
        label: 'Risk Assessment',
        icon: <Target className="h-4 w-4" />,
        href: '/risks/assessment',
      },
      {
        id: 'risk-register',
        label: 'Risk Register',
        icon: <FileText className="h-4 w-4" />,
        href: '/risks/register',
      },
    ],
  },
  {
    id: 'controls',
    label: 'Controls',
    icon: <Shield className="h-4 w-4" />,
    href: '/controls',
    badge: 5,
    shortcut: 'ctrl+c',
    description: 'Control testing and monitoring',
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: <FileText className="h-4 w-4" />,
    href: '/documents',
    shortcut: 'ctrl+d',
    description: 'Document management',
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <BarChart3 className="h-4 w-4" />,
    href: '/reports',
    shortcut: 'ctrl+shift+r',
    description: 'Analytics and reporting',
  },
  {
    id: 'workflows',
    label: 'Workflows',
    icon: <Workflow className="h-4 w-4" />,
    href: '/workflows',
    badge: 'New',
    shortcut: 'ctrl+w',
    description: 'Process management',
  },
  {
    id: 'team',
    label: 'Team',
    icon: <Users className="h-4 w-4" />,
    href: '/team',
    shortcut: 'ctrl+t',
    description: 'Team collaboration',
  },
  {
    id: 'activity',
    label: 'Activity',
    icon: <Activity className="h-4 w-4" />,
    href: '/activity',
    badge: 23,
    shortcut: 'ctrl+a',
    description: 'Recent activity feed',
  },
];

// Mobile Header Component
const MobileHeader: React.FC<{
  pageTitle?: string;
  onMenuToggle: () => void;
  onBack?: () => void;
  actions?: React.ReactNode;
  notifications?: number;
}> = ({ pageTitle, onMenuToggle, onBack, actions, notifications }) => {
  const insets = useSafeAreaInsets();
  
  return (
    <header 
      className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3"
      style={{ paddingTop: `${insets.top + 12}px` }}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {onBack ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuToggle}
              className="h-9 w-9"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          {pageTitle && (
            <h1 className="text-lg font-semibold text-[#191919] font-inter truncate">
              {pageTitle}
            </h1>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {actions}
          
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 relative"
          >
            <Bell className="h-5 w-5" />
            {notifications && notifications > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-red-500 text-white border-white border-2">
                {notifications > 9 ? '9+' : notifications}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};

// Desktop Header Component
const DesktopHeader: React.FC<{
  pageTitle?: string;
  pageSubtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
  user?: ResponsiveLayoutProps['user'];
  notifications?: number;
  theme?: 'light' | 'dark' | 'system';
  onThemeChange?: (theme: 'light' | 'dark' | 'system') => void;
  showBreadcrumbs?: boolean;
}> = ({ 
  pageTitle, 
  pageSubtitle, 
  breadcrumbs, 
  actions, 
  user, 
  notifications, 
  theme = 'light',
  onThemeChange,
  showBreadcrumbs = true 
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return Sun;
      case 'dark': return Moon;
      case 'system': return Monitor;
      default: return Sun;
    }
  };

  const ThemeIcon = getThemeIcon();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        {/* Top row - Search, Theme, Notifications, User */}
        <div className="flex items-center justify-between mb-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-[#FAFAFA] text-sm font-inter placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#199BEC] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
                const currentIndex = themes.indexOf(theme);
                const nextTheme = themes[(currentIndex + 1) % themes.length];
                onThemeChange?.(nextTheme);
              }}
              className="h-10 w-10"
            >
              <ThemeIcon className="h-5 w-5" />
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 relative"
            >
              <Bell className="h-5 w-5" />
              {notifications && notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-red-500 text-white border-white border-2">
                  {notifications > 9 ? '9+' : notifications}
                </Badge>
              )}
            </Button>

            {/* User Profile */}
            {user && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#FAFAFA] transition-colors cursor-pointer">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-[#199BEC] text-white text-sm font-medium">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-medium text-[#191919] font-inter">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 font-inter">
                    {user.role || user.email}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom row - Breadcrumbs, Title, Actions */}
        <div className="flex items-center justify-between">
          {/* Left side - Breadcrumbs and Title */}
          <div className="flex-1">
            {/* Breadcrumbs */}
            {showBreadcrumbs && breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="mb-2">
                <ol className="flex items-center gap-2 text-sm text-gray-500 font-inter">
                  {breadcrumbs.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      {index > 0 && <span>/</span>}
                      {item.href ? (
                        <button className="hover:text-[#199BEC] transition-colors">
                          {item.label}
                        </button>
                      ) : (
                        <span className="text-[#191919] font-medium">{item.label}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            {/* Page Title and Subtitle */}
            <div>
              {pageTitle && (
                <h1 className="text-2xl font-bold text-[#191919] font-inter">
                  {pageTitle}
                </h1>
              )}
              {pageSubtitle && (
                <p className="text-gray-600 font-inter mt-1">
                  {pageSubtitle}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// Touch Action Bar for Mobile
const TouchActionBar: React.FC<{
  actions?: Array<{
    label: string;
    icon: React.ElementType;
    action: () => void;
    primary?: boolean;
  }>;
}> = ({ actions }) => {
  const insets = useSafeAreaInsets();

  if (!actions || actions.length === 0) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 z-40"
      style={{ paddingBottom: `${insets.bottom + 12}px` }}
    >
      {actions.map((action, index) => {
        const IconComponent = action.icon;
        return (
          <Button
            key={index}
            variant={action.primary ? 'default' : 'secondary'}
            className="flex-1 gap-2"
            onClick={action.action}
          >
            <IconComponent className="h-4 w-4" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
};

// Main Responsive Layout Component
export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  currentPath = '/dashboard',
  onNavigate = () => {},
  pageTitle,
  pageSubtitle,
  breadcrumbs,
  actions,
  user,
  notifications,
  showBreadcrumbs = true,
  showPageHeader = true,
  theme = 'light',
  onThemeChange,
  className,
}) => {
  const device = useDevice();
  const { isOpen, isCollapsed, toggle, close } = useSidebarState();
  const layoutRef = useRef<HTMLDivElement>(null);
  const insets = useSafeAreaInsets();

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+b': toggle,
    'cmd+b': toggle,
    'ctrl+k': () => console.log('Open command palette'),
    'cmd+k': () => console.log('Open command palette'),
    'ctrl+/': () => console.log('Open help'),
    'cmd+/': () => console.log('Open help'),
    'escape': close,
  });

  // Swipe gestures for mobile
  useSwipeGesture(layoutRef, (direction) => {
    if (device.type === 'mobile') {
      if (direction === 'right' && !isOpen) {
        toggle();
      } else if (direction === 'left' && isOpen) {
        close();
      }
    }
  });

  // Sample touch actions for mobile
  const mobileActions = device.type === 'mobile' ? [
    {
      label: 'Add',
      icon: Plus,
      action: () => console.log('Add action'),
      primary: true,
    },
    {
      label: 'Search',
      icon: Search,
      action: () => console.log('Search action'),
    },
  ] : undefined;

  return (
    <div 
      ref={layoutRef}
      className={cn(
        "min-h-screen bg-white font-inter",
        device.type === 'mobile' && "pb-20", // Space for touch action bar
        className
      )}
      style={{
        paddingLeft: `${insets.left}px`,
        paddingRight: `${insets.right}px`,
      }}
    >
      {/* Sidebar */}
      <ResponsiveSidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
      />

      {/* Main Content Area */}
      <div className={cn(
        "flex flex-col min-h-screen",
        device.type === 'desktop' && !isCollapsed && "ml-64",
        device.type === 'desktop' && isCollapsed && "ml-16",
        device.type === 'tablet' && "ml-16",
      )}>
        {/* Header */}
        {device.type === 'mobile' ? (
          <MobileHeader
            pageTitle={pageTitle}
            onMenuToggle={toggle}
            actions={actions}
            notifications={notifications}
          />
        ) : (
          showPageHeader && (
            <DesktopHeader
              pageTitle={pageTitle}
              pageSubtitle={pageSubtitle}
              breadcrumbs={breadcrumbs}
              actions={actions}
              user={user}
              notifications={notifications}
              theme={theme}
              onThemeChange={onThemeChange}
              showBreadcrumbs={showBreadcrumbs}
            />
          )
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className={cn(
            "h-full",
            device.type === 'mobile' ? "p-0" : "p-6",
            // Add extra padding for safe areas on mobile
            device.type === 'mobile' && insets.top > 0 && "pt-safe-top",
            device.type === 'mobile' && insets.bottom > 0 && "pb-safe-bottom"
          )}>
            {/* Mobile Page Header */}
            {device.type === 'mobile' && (pageSubtitle || breadcrumbs) && (
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                {/* Breadcrumbs */}
                {showBreadcrumbs && breadcrumbs && breadcrumbs.length > 0 && (
                  <nav className="mb-2">
                    <ol className="flex items-center gap-2 text-sm text-gray-500 font-inter">
                      {breadcrumbs.map((item, index) => (
                        <li key={index} className="flex items-center gap-2">
                          {index > 0 && <span>/</span>}
                          {item.href ? (
                            <button className="hover:text-[#199BEC] transition-colors">
                              {item.label}
                            </button>
                          ) : (
                            <span className="text-[#191919] font-medium">{item.label}</span>
                          )}
                        </li>
                      ))}
                    </ol>
                  </nav>
                )}

                {/* Page Subtitle */}
                {pageSubtitle && (
                  <p className="text-sm text-gray-600 font-inter">
                    {pageSubtitle}
                  </p>
                )}
              </div>
            )}

            {/* Page Content */}
            <div className={cn(
              "min-h-full",
              device.type === 'mobile' ? "" : "max-w-none"
            )}>
              {children}
            </div>
          </div>
        </main>

        {/* Touch Action Bar (Mobile Only) */}
        {device.type === 'mobile' && (
          <TouchActionBar actions={mobileActions} />
        )}
      </div>

      {/* Overlay for mobile sidebar */}
      {device.type === 'mobile' && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={close}
        />
      )}
    </div>
  );
};

export default ResponsiveLayout;
