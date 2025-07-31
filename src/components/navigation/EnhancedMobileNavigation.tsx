/**
 * Enhanced Mobile Navigation System
 * Provides enterprise-grade mobile navigation with gestures, accessibility, and performance optimization
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import {
  Menu,
  X,
  Search,
  Home,
  Shield,
  FileText,
  Settings,
  User,
  Bell,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  LogOut,
  Zap,
} from 'lucide-react';

import {
  useDeviceInfo,
  useSwipeGesture,
  TouchOptimizedButton,
  useA11yAnnouncement,
} from '@/lib/responsive/mobile-optimization-framework';
import { useAuth } from '@/lib/auth/auth-context';
import { enhancedCache } from '@/lib/cache/enhanced-cache-layer';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  children?: NavigationItem[];
  requiresPro?: boolean;
  description?: string;
}

interface NavigationGroup {
  id: string;
  label: string;
  items: NavigationItem[];
}

interface MobileNavigationProps {
  className?: string;
  onNavigate?: (path: string) => void;
}

// ============================================================================
// NAVIGATION STRUCTURE
// ============================================================================

const NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    id: 'main',
    label: 'Main',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        description: 'Overview and key metrics',
      },
      {
        id: 'risks',
        label: 'Risk Management',
        href: '/risks',
        icon: Shield,
        children: [
          { id: 'risks-list', label: 'All Risks', href: '/risks', icon: Shield },
          {
            id: 'risks-assessments',
            label: 'Assessments',
            href: '/risks/assessments',
            icon: Shield,
          },
          {
            id: 'risks-matrix',
            label: 'Risk Matrix',
            href: '/risks/matrix',
            icon: Shield,
            requiresPro: true,
          },
        ],
      },
      {
        id: 'compliance',
        label: 'Compliance',
        href: '/compliance',
        icon: FileText,
        children: [
          { id: 'compliance-overview', label: 'Overview', href: '/compliance', icon: FileText },
          {
            id: 'compliance-frameworks',
            label: 'Frameworks',
            href: '/compliance/frameworks',
            icon: FileText,
          },
          {
            id: 'compliance-audits',
            label: 'Audits',
            href: '/compliance/audits',
            icon: FileText,
            requiresPro: true,
          },
        ],
      },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    items: [
      {
        id: 'profile',
        label: 'Profile',
        href: '/profile',
        icon: User,
        description: 'Manage your account settings',
      },
      {
        id: 'notifications',
        label: 'Notifications',
        href: '/notifications',
        icon: Bell,
        badge: 3,
        description: 'View recent notifications',
      },
      {
        id: 'settings',
        label: 'Settings',
        href: '/settings',
        icon: Settings,
        description: 'Application preferences',
      },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    items: [
      {
        id: 'help',
        label: 'Help Center',
        href: '/help',
        icon: HelpCircle,
        description: 'Documentation and guides',
      },
      {
        id: 'upgrade',
        label: 'Upgrade Plan',
        href: '/billing',
        icon: Zap,
        description: 'Unlock advanced features',
      },
    ],
  },
];

// ============================================================================
// ENHANCED MOBILE NAVIGATION COMPONENT
// ============================================================================

export function EnhancedMobileNavigation({ className, onNavigate }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [searchResults, setSearchResults] = useState<NavigationItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const device = useDeviceInfo();
  const announce = useA11yAnnouncement();
  const { user, signOut } = useAuth();

  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dragX = useMotionValue(0);
  const dragOpacity = useTransform(dragX, [-300, 0], [0, 1]);

  // ============================================================================
  // GESTURE HANDLING
  // ============================================================================

  const swipeGestures = useSwipeGesture({
    onSwipeLeft: () => {
      if (isOpen) {
        closeMenu();
      }
    },
    onSwipeRight: () => {
      if (!isOpen && dragX.get() === 0) {
        openMenu();
      }
    },
    threshold: 50,
  });

  const handleDragEnd = useCallback(
    (event: any, info: PanInfo) => {
      const shouldClose = info.offset.x < -150 || info.velocity.x < -500;

      if (shouldClose) {
        closeMenu();
      } else {
        // Snap back to open position
        dragX.set(0);
      }
    },
    [dragX]
  );

  // ============================================================================
  // MENU CONTROLS
  // ============================================================================

  const openMenu = useCallback(() => {
    setIsOpen(true);
    announce('Navigation menu opened', 'polite');

    // Focus search input when menu opens
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);

    // Preload navigation data
    enhancedCache.warmCache().catch(console.error);
  }, [announce]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
    setIsSearching(false);
    setSearchResults([]);
    dragX.set(0);
    announce('Navigation menu closed', 'polite');
  }, [announce, dragX]);

  const toggleMenu = useCallback(() => {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }, [isOpen, openMenu, closeMenu]);

  // ============================================================================
  // NAVIGATION HANDLING
  // ============================================================================

  const handleNavigate = useCallback(
    (href: string, label: string) => {
      closeMenu();
      onNavigate?.(href);
      router.push(href);
      announce(`Navigating to ${label}`, 'polite');

      // Add haptic feedback
      if (device.isTouch && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
    },
    [closeMenu, onNavigate, router, announce, device.isTouch]
  );

  const handleGroupToggle = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  // ============================================================================
  // SEARCH FUNCTIONALITY
  // ============================================================================

  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      // Simulate search with debouncing
      const searchTimeout = setTimeout(() => {
        const allItems = NAVIGATION_GROUPS.flatMap((group) =>
          group.items.flatMap((item) => [item, ...(item.children || [])])
        );

        const results = allItems.filter(
          (item) =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.description?.toLowerCase().includes(query.toLowerCase())
        );

        setSearchResults(results);
        setIsSearching(false);

        if (results.length > 0) {
          announce(`Found ${results.length} navigation items`, 'polite');
        } else {
          announce('No navigation items found', 'polite');
        }
      }, 300);

      return () => clearTimeout(searchTimeout);
    },
    [announce]
  );

  useEffect(() => {
    performSearch(searchQuery);
  }, [searchQuery, performSearch]);

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key === 'm') {
        event.preventDefault();
        toggleMenu();
      }

      if (event.key === 'Escape' && isOpen) {
        closeMenu();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleMenu, closeMenu]);

  // ============================================================================
  // RENDER NAVIGATION ITEM
  // ============================================================================

  const renderNavigationItem = useCallback(
    (item: NavigationItem, level = 0) => {
      const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedGroups.has(item.id);

      return (
        <div key={item.id} className="space-y-1">
          <motion.button
            className={cn(
              'w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors duration-200',
              'min-h-[48px] touch-manipulation',
              level > 0 && 'ml-4 pl-6',
              isActive
                ? 'bg-blue-100 text-blue-900 border border-blue-200'
                : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
            )}
            onClick={() => {
              if (hasChildren) {
                handleGroupToggle(item.id);
              } else {
                handleNavigate(item.href, item.label);
              }
            }}
            whileTap={{ scale: 0.98 }}
            aria-expanded={hasChildren ? isExpanded : undefined}
          >
            <div className="flex items-center space-x-3">
              <item.icon
                className={cn(
                  'w-5 h-5 flex-shrink-0',
                  isActive ? 'text-blue-600' : 'text-gray-500'
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-base truncate">{item.label}</span>
                  {item.requiresPro && (
                    <span className="px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded">
                      PRO
                    </span>
                  )}
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-gray-500 truncate mt-0.5">{item.description}</p>
                )}
              </div>
            </div>
            {hasChildren && (
              <ChevronDown
                className={cn(
                  'w-4 h-4 transition-transform duration-200 flex-shrink-0',
                  isExpanded ? 'transform rotate-180' : ''
                )}
              />
            )}
          </motion.button>

          {/* Render children */}
          <AnimatePresence>
            {hasChildren && isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden space-y-1"
              >
                {item.children!.map((child) => renderNavigationItem(child, level + 1))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    },
    [pathname, expandedGroups, handleGroupToggle, handleNavigate]
  );

  // ============================================================================
  // RENDER COMPONENT
  // ============================================================================

  return (
    <>
      {/* Menu Toggle Button */}
      <TouchOptimizedButton
        onClick={toggleMenu}
        className={cn(
          'fixed top-4 left-4 z-50 p-2 rounded-lg shadow-lg',
          'bg-white border border-gray-200',
          'md:hidden', // Only show on mobile
          className
        )}
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        size="md"
        variant="ghost"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isOpen ? 'close' : 'menu'}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.div>
        </AnimatePresence>
      </TouchOptimizedButton>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMenu}
            {...swipeGestures}
          />
        )}
      </AnimatePresence>

      {/* Navigation Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-xl z-50 flex flex-col"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="x"
            dragConstraints={{ left: -300, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ x: dragX, opacity: dragOpacity }}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Navigation</h2>
                <TouchOptimizedButton
                  onClick={closeMenu}
                  variant="ghost"
                  size="sm"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </TouchOptimizedButton>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search navigation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  aria-label="Search navigation items"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {searchQuery ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500 px-3">
                    Search Results ({searchResults.length})
                  </h3>
                  {searchResults.length > 0 ? (
                    searchResults.map((item) => renderNavigationItem(item))
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No navigation items found</p>
                    </div>
                  )}
                </div>
              ) : (
                NAVIGATION_GROUPS.map((group) => (
                  <div key={group.id} className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-500 px-3 uppercase tracking-wider">
                      {group.label}
                    </h3>
                    <div className="space-y-1">
                      {group.items.map((item) => renderNavigationItem(item))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              {user && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <TouchOptimizedButton
                    onClick={() => signOut()}
                    variant="ghost"
                    size="sm"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </TouchOptimizedButton>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================================
// EXPORT
// ============================================================================

export default EnhancedMobileNavigation;
