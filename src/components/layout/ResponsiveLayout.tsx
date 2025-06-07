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
  Option,
  Shift,
} from 'lucide-react';

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
  sidebarCollapsed?: boolean;
  onSidebarToggle?: (collapsed: boolean) => void;
  showBreadcrumbs?: boolean;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  pageTitle?: string;
  pageDescription?: string;
  actions?: React.ReactNode;
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

// Mobile Navigation Component
const MobileNavigation: React.FC<{
  items: NavigationItem[];
  currentPath: string;
  onNavigate: (href: string) => void;
}> = ({ items, currentPath, onNavigate }) => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden" aria-label="Open navigation menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-enterprise-4 border-b border-border">
            <div className="flex items-center space-x-enterprise-2">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="font-semibold">Riscura</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 p-enterprise-2">
            <nav className="space-y-enterprise-1">
              {items.map((item) => (
                <div key={item.id}>
                  <Button
                    variant={currentPath === item.href ? 'secondary' : 'ghost'}
                    className={cn(
                      "w-full justify-start h-12 px-enterprise-3",
                      currentPath === item.href && "bg-blue-50 text-blue-700 border-blue-200"
                    )}
                    onClick={() => {
                      onNavigate(item.href);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center space-x-enterprise-3 w-full">
                      <div className="flex-shrink-0">
                        {item.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-caption text-text-secondary truncate">
                          {item.description}
                        </div>
                      </div>
                      {item.badge && (
                        <Badge variant="secondary" className="text-caption">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  </Button>

                  {/* Sub-navigation */}
                  {item.children && currentPath.startsWith(item.href) && (
                    <div className="ml-enterprise-6 mt-enterprise-1 space-y-enterprise-1">
                      {item.children.map((child) => (
                        <Button
                          key={child.id}
                          variant={currentPath === child.href ? 'secondary' : 'ghost'}
                          className="w-full justify-start h-10 px-enterprise-3"
                          onClick={() => {
                            onNavigate(child.href);
                            setOpen(false);
                          }}
                        >
                          <div className="flex items-center space-x-enterprise-2">
                            {child.icon}
                            <span>{child.label}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-enterprise-4 border-t border-border">
            <div className="flex items-center space-x-enterprise-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>SJ</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-body-sm font-medium truncate">Sarah Johnson</div>
                <div className="text-caption text-text-secondary truncate">Risk Manager</div>
              </div>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Desktop Sidebar Component
const DesktopSidebar: React.FC<{
  items: NavigationItem[];
  currentPath: string;
  collapsed: boolean;
  onNavigate: (href: string) => void;
  onToggleCollapse: () => void;
}> = ({ items, currentPath, collapsed, onNavigate, onToggleCollapse }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <div className={cn(
      "hidden md:flex flex-col border-r border-border bg-white transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-enterprise-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center space-x-enterprise-2">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="font-semibold">Riscura</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={cn("transition-transform duration-200", collapsed && "mx-auto")}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 p-enterprise-2">
        <nav className="space-y-enterprise-1">
          {items.map((item) => (
            <div key={item.id}>
              <Button
                variant={currentPath === item.href ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start group relative",
                  collapsed ? "h-10 px-2" : "h-10 px-enterprise-3",
                  currentPath === item.href && "bg-blue-50 text-blue-700 border-blue-200"
                )}
                onClick={() => {
                  if (item.children && !collapsed) {
                    toggleExpanded(item.id);
                  } else {
                    onNavigate(item.href);
                  }
                }}
                title={collapsed ? item.label : undefined}
              >
                <div className={cn(
                  "flex items-center w-full",
                  collapsed ? "justify-center" : "space-x-enterprise-3"
                )}>
                  <div className="flex-shrink-0">
                    {item.icon}
                  </div>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-caption">
                          {item.badge}
                        </Badge>
                      )}
                      {item.children && (
                        <ChevronRight
                          className={cn(
                            "h-3 w-3 transition-transform duration-200",
                            expandedItems.includes(item.id) && "rotate-90"
                          )}
                        />
                      )}
                    </>
                  )}
                </div>

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-caption rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                    {item.shortcut && (
                      <span className="ml-2 opacity-75">{item.shortcut}</span>
                    )}
                  </div>
                )}
              </Button>

              {/* Sub-navigation */}
              {item.children && !collapsed && expandedItems.includes(item.id) && (
                <div className="ml-enterprise-6 mt-enterprise-1 space-y-enterprise-1">
                  {item.children.map((child) => (
                    <Button
                      key={child.id}
                      variant={currentPath === child.href ? 'secondary' : 'ghost'}
                      className="w-full justify-start h-8 px-enterprise-3 text-caption"
                      onClick={() => onNavigate(child.href)}
                    >
                      <div className="flex items-center space-x-enterprise-2">
                        {child.icon}
                        <span>{child.label}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      {!collapsed && (
        <div className="p-enterprise-4 border-t border-border">
          <div className="flex items-center space-x-enterprise-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>SJ</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-body-sm font-medium truncate">Sarah Johnson</div>
              <div className="text-caption text-text-secondary truncate">Risk Manager</div>
            </div>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Top Navigation Bar
const TopNavigationBar: React.FC<{
  device: Device;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  pageTitle?: string;
  pageDescription?: string;
  actions?: React.ReactNode;
  onNavigate: (href: string) => void;
  showMobileMenu: boolean;
}> = ({ device, breadcrumbs, pageTitle, pageDescription, actions, onNavigate, showMobileMenu }) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-border">
      {/* Main navigation bar */}
      <div className="flex items-center justify-between px-enterprise-4 py-enterprise-3">
        <div className="flex items-center space-x-enterprise-4">
          {/* Mobile menu and logo */}
          <div className="flex items-center space-x-enterprise-3">
            {showMobileMenu && (
              <MobileNavigation
                items={navigationItems}
                currentPath="/dashboard"
                onNavigate={onNavigate}
              />
            )}

            {/* Mobile logo */}
            <div className="md:hidden flex items-center space-x-enterprise-2">
              <div className="h-6 w-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">R</span>
              </div>
              <span className="font-semibold text-sm">Riscura</span>
            </div>
          </div>

          {/* Breadcrumbs - Hidden on mobile */}
          {breadcrumbs && device.type !== 'mobile' && (
            <nav className="hidden md:flex items-center space-x-enterprise-2 text-body-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center space-x-enterprise-2">
                  {index > 0 && <ChevronRight className="h-3 w-3 text-text-secondary" />}
                  {crumb.href ? (
                    <Button
                      variant="link"
                      className="h-auto p-0 text-text-secondary hover:text-text-primary"
                      onClick={() => onNavigate(crumb.href!)}
                    >
                      {crumb.label}
                    </Button>
                  ) : (
                    <span className="text-text-primary font-medium">{crumb.label}</span>
                  )}
                </div>
              ))}
            </nav>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-enterprise-2">
          {/* Search */}
          <div className="relative">
            {device.type === 'mobile' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSearch(!showSearch)}
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </Button>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 text-body-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-caption p-0 bg-red-500">
              3
            </Badge>
          </Button>

          {/* User menu */}
          <Button variant="ghost" size="sm" className="flex items-center space-x-enterprise-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-caption">SJ</AvatarFallback>
            </Avatar>
            {device.type !== 'mobile' && <span className="text-body-sm">Sarah</span>}
          </Button>

          {/* Custom actions */}
          {actions}
        </div>
      </div>

      {/* Mobile search overlay */}
      {showSearch && device.type === 'mobile' && (
        <div className="px-enterprise-4 pb-enterprise-3 border-t border-border bg-surface-secondary">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-3 w-full text-body-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={() => setShowSearch(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Page header - Mobile */}
      {(pageTitle || pageDescription) && device.type === 'mobile' && (
        <div className="px-enterprise-4 py-enterprise-3 border-t border-border">
          {pageTitle && <h1 className="text-heading-sm font-semibold">{pageTitle}</h1>}
          {pageDescription && (
            <p className="text-body-sm text-text-secondary mt-enterprise-1">{pageDescription}</p>
          )}
        </div>
      )}
    </header>
  );
};

// Touch-friendly Action Bar
const TouchActionBar: React.FC<{
  device: Device;
  actions: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'destructive';
    disabled?: boolean;
  }>;
}> = ({ device, actions }) => {
  if (device.type === 'desktop') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around px-enterprise-2 py-enterprise-3">
        {actions.slice(0, device.type === 'mobile' ? 4 : 6).map((action) => (
          <Button
            key={action.id}
            variant={action.variant === 'primary' ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              "flex-col h-12 px-enterprise-3 space-y-1",
              action.variant === 'destructive' && "text-red-600 hover:text-red-700 hover:bg-red-50"
            )}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.icon}
            <span className="text-caption">{action.label}</span>
          </Button>
        ))}

        {actions.length > (device.type === 'mobile' ? 4 : 6) && (
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="sm" className="flex-col h-12 px-enterprise-3 space-y-1">
                <MoreHorizontal className="h-4 w-4" />
                <span className="text-caption">More</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="p-enterprise-4">
                <h3 className="text-heading-sm font-semibold mb-enterprise-4">More Actions</h3>
                <div className="grid grid-cols-2 gap-enterprise-3">
                  {actions.slice(device.type === 'mobile' ? 4 : 6).map((action) => (
                    <Button
                      key={action.id}
                      variant="ghost"
                      className="h-12 justify-start space-x-enterprise-2"
                      onClick={action.onClick}
                      disabled={action.disabled}
                    >
                      {action.icon}
                      <span>{action.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </div>
    </div>
  );
};

// Main Responsive Layout Component
export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  sidebarCollapsed: controlledCollapsed,
  onSidebarToggle,
  showBreadcrumbs = true,
  breadcrumbs,
  pageTitle,
  pageDescription,
  actions,
}) => {
  const device = useDevice();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [currentPath, setCurrentPath] = useState('/dashboard');
  const layoutRef = useRef<HTMLDivElement>(null);

  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleSidebarToggle = () => {
    const newCollapsed = !collapsed;
    setInternalCollapsed(newCollapsed);
    onSidebarToggle?.(newCollapsed);
  };

  const handleNavigate = (href: string) => {
    setCurrentPath(href);
    // In a real app, this would use router.push(href)
    console.log('Navigate to:', href);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+k': () => console.log('Open command palette'),
    'ctrl+/': () => console.log('Open help'),
    'ctrl+b': handleSidebarToggle,
    'escape': () => console.log('Close modals'),
    ...navigationItems.reduce((acc, item) => {
      if (item.shortcut) {
        acc[item.shortcut] = () => handleNavigate(item.href);
      }
      return acc;
    }, {} as Record<string, () => void>),
  });

  // Swipe gestures for mobile
  useSwipeGesture(layoutRef, (direction) => {
    if (device.type === 'mobile') {
      if (direction === 'right') {
        // Could open sidebar or go back
        console.log('Swipe right - open sidebar');
      } else if (direction === 'left') {
        // Could close sidebar or go forward
        console.log('Swipe left - close sidebar');
      }
    }
  });

  const sampleActions = [
    {
      id: 'add',
      label: 'Add',
      icon: <Plus className="h-4 w-4" />,
      onClick: () => console.log('Add'),
      variant: 'primary' as const,
    },
    {
      id: 'filter',
      label: 'Filter',
      icon: <Filter className="h-4 w-4" />,
      onClick: () => console.log('Filter'),
    },
    {
      id: 'export',
      label: 'Export',
      icon: <Download className="h-4 w-4" />,
      onClick: () => console.log('Export'),
    },
    {
      id: 'share',
      label: 'Share',
      icon: <Share2 className="h-4 w-4" />,
      onClick: () => console.log('Share'),
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: <Archive className="h-4 w-4" />,
      onClick: () => console.log('Archive'),
    },
  ];

  return (
    <div
      ref={layoutRef}
      className="h-screen bg-surface-primary overflow-hidden flex flex-col"
    >
      {/* Top Navigation */}
      <TopNavigationBar
        device={device}
        breadcrumbs={showBreadcrumbs ? breadcrumbs : undefined}
        pageTitle={pageTitle}
        pageDescription={pageDescription}
        actions={actions}
        onNavigate={handleNavigate}
        showMobileMenu={device.type === 'mobile'}
      />

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <DesktopSidebar
          items={navigationItems}
          currentPath={currentPath}
          collapsed={collapsed}
          onNavigate={handleNavigate}
          onToggleCollapse={handleSidebarToggle}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className={cn(
            "h-full",
            device.type !== 'desktop' ? "pb-20" : "" // Add bottom padding for touch action bar
          )}>
            {/* Page Header - Desktop/Tablet */}
            {(pageTitle || pageDescription) && device.type !== 'mobile' && (
              <div className="px-enterprise-6 py-enterprise-4 border-b border-border bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    {pageTitle && <h1 className="text-heading-lg font-semibold">{pageTitle}</h1>}
                    {pageDescription && (
                      <p className="text-body-base text-text-secondary mt-enterprise-1">
                        {pageDescription}
                      </p>
                    )}
                  </div>
                  {actions && device.type === 'desktop' && actions}
                </div>
              </div>
            )}

            {/* Page Content */}
            <div className={cn(
              "h-full",
              (pageTitle || pageDescription) && device.type !== 'mobile' ? "pt-0" : "pt-enterprise-6",
              device.type === 'mobile' ? "px-enterprise-4" : "px-enterprise-6"
            )}>
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Touch Action Bar */}
      <TouchActionBar device={device} actions={sampleActions} />

      {/* Keyboard Shortcuts Help - Desktop only */}
      {device.type === 'desktop' && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            variant="outline"
            size="sm"
            className="shadow-lg bg-white"
            onClick={() => console.log('Show keyboard shortcuts')}
          >
            <Keyboard className="h-4 w-4 mr-enterprise-1" />
            Shortcuts
          </Button>
        </div>
      )}
    </div>
  );
};

export default ResponsiveLayout;
