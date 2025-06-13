import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  useDevice, 
  useSidebarState, 
  useSwipeGesture, 
  useKeyboardShortcuts 
} from '@/lib/responsive/hooks';
import {
  Menu,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  Shield,
  Target,
  Activity,
  ShieldCheck,
  Calendar,
  MapPin,
  TrendingUp,
  FileCheck,
  Users,
  ClipboardList,
  Upload,
  Bot,
  Sparkles,
  Lightbulb,
  Brain,
  BarChart,
  Folder,
  GitBranch,
  Zap,
  Clock,
  Monitor,
} from 'lucide-react';

// Navigation Types
interface NavItem {
  id: string;
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning';
  description?: string;
  shortcut?: string;
  isNew?: boolean;
}

interface NavSection {
  id: string;
  title: string;
  emoji: string;
  collapsible: boolean;
  items: NavItem[];
}

interface ResponsiveSidebarProps {
  currentPath?: string;
  onNavigate?: (href: string) => void;
  className?: string;
}

// Navigation Data
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
        shortcut: 'cmd+d',
      },
      {
        id: 'quick-actions',
        title: 'Quick Actions',
        href: '/dashboard/quick-actions',
        icon: Zap,
        description: 'Frequently used actions',
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
        id: 'risk-register',
        title: 'Risk Register',
        href: '/dashboard/risks',
        icon: Shield,
        badge: 23,
        badgeVariant: 'destructive',
        description: 'Comprehensive risk inventory',
        shortcut: 'cmd+r',
      },
      {
        id: 'risk-assessment',
        title: 'Risk Assessment',
        href: '/dashboard/risks/assessment',
        icon: Target,
        description: 'Risk evaluation and analysis',
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
        shortcut: 'cmd+a',
      }
    ]
  }
];

// Mobile Sidebar Component
const MobileSidebar: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onNavigate: (href: string) => void;
}> = ({ isOpen, onClose, currentPath, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>(['overview']);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleNavigate = (href: string) => {
    onNavigate(href);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0 bg-[#FAFAFA]">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <Image
              src="/images/logo/riscura.png"
              alt="Riscura Logo"
              width={100}
              height={28}
              className="object-contain"
              priority
            />
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {navigationSections.map((section) => (
                <div key={section.id} className="mb-2">
                  {section.collapsible ? (
                    <Button
                      variant="ghost"
                      className="w-full justify-between h-10 px-3 mb-1 text-[#191919] font-inter font-medium"
                      onClick={() => toggleSection(section.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{section.emoji}</span>
                        <span className="text-sm">{section.title}</span>
                      </div>
                      <ChevronDown 
                        className={cn(
                          "h-4 w-4 transition-transform",
                          expandedSections.includes(section.id) && "rotate-180"
                        )}
                      />
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 mb-1">
                      <span className="text-base">{section.emoji}</span>
                      <span className="text-sm font-medium text-[#191919] font-inter">{section.title}</span>
                    </div>
                  )}

                  {(!section.collapsible || expandedSections.includes(section.id)) && (
                    <div className="space-y-1 pl-2">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPath === item.href;

                        return (
                          <Button
                            key={item.id}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start h-12 px-3 font-inter",
                              isActive 
                                ? "bg-[#199BEC]/10 text-[#199BEC] font-medium" 
                                : "text-gray-700 hover:bg-gray-100"
                            )}
                            onClick={() => handleNavigate(item.href)}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Icon className="h-4 w-4 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm truncate">{item.title}</span>
                                  {item.badge && (
                                    <Badge variant={item.badgeVariant || 'default'} className="text-xs">
                                      {item.badge}
                                    </Badge>
                                  )}
                                  {item.isNew && (
                                    <Badge variant="success" className="text-xs">New</Badge>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-xs text-gray-500 truncate">{item.description}</p>
                                )}
                              </div>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Desktop Sidebar Component
const DesktopSidebar: React.FC<{
  isCollapsed: boolean;
  onToggle: () => void;
  currentPath: string;
  onNavigate: (href: string) => void;
}> = ({ isCollapsed, onToggle, currentPath, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>(['overview']);

  const toggleSection = (sectionId: string) => {
    if (isCollapsed) return;
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <div className={cn(
      "hidden md:flex flex-col border-r border-gray-200 bg-[#FAFAFA] transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        {!isCollapsed && (
          <Image
            src="/images/logo/riscura.png"
            alt="Riscura Logo"
            width={100}
            height={28}
            className="object-contain"
            priority
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn(
            "h-8 w-8 p-0 transition-transform duration-200",
            isCollapsed && "mx-auto"
          )}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Search - Only show when not collapsed */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {navigationSections.map((section) => (
            <div key={section.id} className="mb-2">
              {!isCollapsed ? (
                // Expanded view
                <>
                  {section.collapsible ? (
                    <Button
                      variant="ghost"
                      className="w-full justify-between h-10 px-3 mb-1 text-[#191919] font-inter font-medium"
                      onClick={() => toggleSection(section.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{section.emoji}</span>
                        <span className="text-sm">{section.title}</span>
                      </div>
                      <ChevronDown 
                        className={cn(
                          "h-4 w-4 transition-transform",
                          expandedSections.includes(section.id) && "rotate-180"
                        )}
                      />
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 mb-1">
                      <span className="text-base">{section.emoji}</span>
                      <span className="text-sm font-medium text-[#191919] font-inter">{section.title}</span>
                    </div>
                  )}

                  {(!section.collapsible || expandedSections.includes(section.id)) && (
                    <div className="space-y-1 pl-2">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPath === item.href;

                        return (
                          <Button
                            key={item.id}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start h-10 px-3 font-inter",
                              isActive 
                                ? "bg-[#199BEC]/10 text-[#199BEC] font-medium" 
                                : "text-gray-700 hover:bg-gray-100"
                            )}
                            onClick={() => onNavigate(item.href)}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Icon className="h-4 w-4 flex-shrink-0" />
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-sm truncate">{item.title}</span>
                                {item.badge && (
                                  <Badge variant={item.badgeVariant || 'default'} className="text-xs">
                                    {item.badge}
                                  </Badge>
                                )}
                                {item.isNew && (
                                  <Badge variant="success" className="text-xs">New</Badge>
                                )}
                              </div>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                // Collapsed view - show only icons
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPath === item.href;

                    return (
                      <Button
                        key={item.id}
                        variant="ghost"
                        title={item.title}
                        className={cn(
                          "w-full h-10 px-0 justify-center",
                          isActive 
                            ? "bg-[#199BEC]/10 text-[#199BEC]" 
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                        onClick={() => onNavigate(item.href)}
                      >
                        <div className="relative">
                          <Icon className="h-4 w-4" />
                          {item.badge && (
                            <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

// Main Responsive Sidebar Component
export const ResponsiveSidebar: React.FC<ResponsiveSidebarProps> = ({
  currentPath = '/dashboard',
  onNavigate = () => {},
  className,
}) => {
  const device = useDevice();
  const { isOpen, isCollapsed, toggle, close } = useSidebarState();
  const layoutRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+b': toggle,
    'cmd+b': toggle,
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

  return (
    <div ref={layoutRef} className={cn("flex", className)}>
      {device.type === 'mobile' ? (
        <>
          {/* Mobile Menu Trigger */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="md:hidden fixed top-4 left-4 z-50 h-10 w-10 p-0 bg-white border border-gray-200 shadow-sm"
            onClick={toggle}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <MobileSidebar
            isOpen={isOpen}
            onClose={close}
            currentPath={currentPath}
            onNavigate={onNavigate}
          />
        </>
      ) : (
        <DesktopSidebar
          isCollapsed={isCollapsed}
          onToggle={toggle}
          currentPath={currentPath}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}; 