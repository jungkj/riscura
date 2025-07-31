'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DaisyCard, DaisyCardBody } from '@/components/ui/DaisyCard';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/DaisySheet';
import { DaisyScrollArea } from '@/components/ui/DaisyScrollArea';
import { DaisySeparator } from '@/components/ui/DaisySeparator';
import { useGesture } from '@use-gesture/react';
import {
  Menu,
  X,
  Home,
  Shield,
  BarChart3,
  FileText,
  Settings,
  Bell,
  User,
  Search,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Database,
  Users,
  Lock,
  HelpCircle,
  LogOut
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  badge?: string | number;
  children?: NavigationItem[];
  description?: string;
  accessKey?: string;
}

interface MobileNavigationProps {
  currentUser?: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  notifications?: number;
  className?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home className="w-5 h-5" />,
    href: '/dashboard',
    description: 'Main dashboard overview',
    accessKey: 'd'
  },
  {
    id: 'risks',
    label: 'Risk Management',
    icon: <Shield className="w-5 h-5" />,
    badge: 12,
    description: 'Manage organizational risks',
    accessKey: 'r',
    children: [
      {
        id: 'risk-register',
        label: 'Risk Register',
        icon: <Database className="w-4 h-4" />,
        href: '/risks/register',
        badge: 8,
        description: 'View and manage all risks'
      },
      {
        id: 'risk-assessment',
        label: 'Risk Assessment',
        icon: <BarChart3 className="w-4 h-4" />,
        href: '/risks/assessment',
        description: 'Conduct risk assessments'
      },
      {
        id: 'controls',
        label: 'Controls',
        icon: <Lock className="w-4 h-4" />,
        href: '/risks/controls',
        badge: 4,
        description: 'Manage risk controls'
      }
    ]
  },
  {
    id: 'compliance',
    label: 'Compliance',
    icon: <CheckCircle className="w-5 h-5" />,
    description: 'Compliance management',
    accessKey: 'c',
    children: [
      {
        id: 'frameworks',
        label: 'Frameworks',
        icon: <FileText className="w-4 h-4" />,
        href: '/compliance/frameworks',
        description: 'Compliance frameworks'
      },
      {
        id: 'audits',
        label: 'Audits',
        icon: <Clock className="w-4 h-4" />,
        href: '/compliance/audits',
        badge: 2,
        description: 'Audit management'
      }
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <TrendingUp className="w-5 h-5" />,
    href: '/analytics',
    description: 'Risk analytics and reporting',
    accessKey: 'a'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <FileText className="w-5 h-5" />,
    href: '/reports',
    description: 'Generate and view reports',
    accessKey: 'p'
  },
  {
    id: 'team',
    label: 'Team',
    icon: <Users className="w-5 h-5" />,
    href: '/team',
    description: 'Team management',
    accessKey: 't'
  }
];

export default function MobileNavigation({ 
  currentUser = {
    name: 'John Smith',
    email: 'john.smith@company.com',
    role: 'Risk Manager'
  },
  notifications = 5,
  className = '' 
}: MobileNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navRef = useRef<HTMLDivElement>(null);
  
  // Gesture handling for swipe navigation
  const bind = useGesture({
    onDrag: ({ direction: [dx], velocity: [vx], cancel }) => {
      // Swipe right to open navigation (from left edge)
      if (dx > 0 && vx > 0.5 && !isOpen) {
        setIsOpen(true);
        cancel();
      }
      // Swipe left to close navigation
      else if (dx < 0 && vx > 0.5 && isOpen) {
        setIsOpen(false);
        cancel();
      }
    }
  });
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + M to toggle mobile menu
      if (event.altKey && event.key === 'm') {
        event.preventDefault();
        setIsOpen(!isOpen);
      }
      
      // Alt + S to open search
      if (event.altKey && event.key === 's') {
        event.preventDefault();
        setIsSearchOpen(true);
      }
      
      // Access keys for navigation items
      if (event.altKey) {
        const item = navigationItems.find(item => item.accessKey === event.key);
        if (item && item.href) {
          event.preventDefault();
          router.push(item.href);
          setIsOpen(false);
        }
      }
      
      // Escape to close
      if (event.key === 'Escape') {
        setIsOpen(false);
        setIsSearchOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, router]);
  
  // Handle navigation item click
  const handleItemClick = (item: NavigationItem) => {
    if (item.children) {
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(item.id)) {
          newSet.delete(item.id);
        } else {
          newSet.add(item.id);
        }
        return newSet;
      });
    } else if (item.href) {
      router.push(item.href);
      setIsOpen(false);
    }
  };
  
  // Filter navigation items based on search
  const filteredItems = searchQuery
    ? navigationItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.children?.some(child =>
          child.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          child.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : navigationItems;
  
  // Render navigation item
  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const isActive = pathname === item.href;
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

  return (
    <div key={item.id} className="w-full">
        <DaisyButton
          variant={isActive ? 'default' : 'ghost'}
          className={`w-full justify-start text-left h-auto p-3 ${
            level > 0 ? 'ml-4 pl-6' : ''
          } ${isActive ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-50'}`}
          onClick={() => handleItemClick(item)}
          accessKey={item.accessKey}
          aria-label={`${item.label}${item.badge ? ` (${item.badge} items)` : ''}`}
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-describedby={`${item.id}-description`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3">
              {item.icon}
              <div className="flex flex-col items-start">
                <span className="font-medium">{item.label}</span>
                {item.description && (
                  <span 
                    id={`${item.id}-description`}
                    className="text-xs text-gray-500"
                  >
                    {item.description}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {item.badge && (
                <DaisyBadge 
                  variant={typeof item.badge === 'number' && item.badge > 0 ? 'destructive' : 'secondary'}
                  className="text-xs"
                  aria-label={`${item.badge} notifications`}
                >
                  {item.badge}
                </DaisyBadge>
              )}
              {hasChildren && (
                isExpanded 
                  ? <ChevronDown className="w-4 h-4" />
                  : <ChevronRight className="w-4 h-4" />
              )}
            </div>
          </div>
        </DaisyButton>
        
        {/* Render children */}
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1" role="group" aria-label={`${item.label} submenu`}>
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <>
      {/* Mobile Navigation Trigger */}
      <div className={`fixed top-4 left-4 z-50 lg:hidden ${className}`} {...bind()}>
        <DaisyButton
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="bg-white shadow-lg border-gray-200"
          aria-label="Open navigation menu"
          accessKey="m"
        >
          <Menu className="w-5 h-5" />
        </DaisyButton>
      </div>
      
      {/* Search Button */}
      <div className="fixed top-4 right-16 z-50 lg:hidden">
        <DaisyButton
          variant="outline"
          size="sm"
          onClick={() => setIsSearchOpen(true)}
          className="bg-white shadow-lg border-gray-200"
          aria-label="Open search"
          accessKey="s"
        >
          <Search className="w-5 h-5" />
        </DaisyButton>
      </div>
      
      {/* Notifications Button */}
      <div className="fixed top-4 right-4 z-50 lg:hidden">
        <DaisyButton
          variant="outline"
          size="sm"
          className="bg-white shadow-lg border-gray-200 relative"
          aria-label={`Notifications (${notifications} unread)`}
        >
          <Bell className="w-5 h-5" />
          {notifications > 0 && (
            <DaisyBadge 
              variant="error" 
              className="absolute -top-2 -right-2 text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center"
              aria-hidden="true"
            >
              {notifications > 99 ? '99+' : notifications}
            </DaisyBadge>
          )}
        </DaisyButton>
      </div>
      
      {/* Mobile Navigation Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent 
          side="left" 
          className="w-80 p-0"
          aria-label="Main navigation"
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="p-4 border-b">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-lg font-semibold">
                  Riscura
                </SheetTitle>
                <DaisyButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close navigation"
                >
                  <X className="w-5 h-5" />
                </DaisyButton>
              </div>
            </SheetHeader>
            
            {/* User Profile */}
            <div className="p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 truncate">{currentUser.role}</p>
                </div>
              </div>
            </div>
            
            {/* Search */}
            {isSearchOpen && (
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search navigation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    aria-label="Search navigation items"
                  />
                  <DaisyButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    aria-label="Close search"
                  >
                    <X className="w-3 h-3" />
                  </DaisyButton>
                </div>
              </div>
            )}
            
            {/* Navigation Items */}
            <DaisyScrollArea className="flex-1">
              <nav className="p-4 space-y-2" role="navigation" aria-label="Main navigation">
                {filteredItems.map(item => renderNavigationItem(item))}
              </nav>
            </DaisyScrollArea>
            
            {/* Footer */}
            <div className="p-4 border-t space-y-2">
              <DaisyButton
                variant="ghost"
                className="w-full justify-start"
                onClick={() => router.push('/settings')}
              >
                <Settings className="w-5 h-5 mr-3" />
                Settings
              </DaisyButton>
              
              <DaisyButton
                variant="ghost"
                className="w-full justify-start"
                onClick={() => router.push('/help')}
              >
                <HelpCircle className="w-5 h-5 mr-3" />
                Help & Support
              </DaisyButton>
              
              <DaisySeparator />
              
              <DaisyButton
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  // Handle logout
                  console.log('Logging out...');
                }}
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </DaisyButton>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Skip Navigation Link (for screen readers) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to main content
      </a>
    </>
  );
} 