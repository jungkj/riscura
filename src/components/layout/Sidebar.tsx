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
  ExternalLink
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SidebarProps {
  isOpen: boolean;
  user?: UserType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string;
  isNew?: boolean;
  isActive?: boolean;
  subItems?: NavItem[];
}

export default function Sidebar({ isOpen, user }: SidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>(['main']);
  
  // Define navigation sections with cleaner organization
  const navigationSections: NavSection[] = [
    {
      title: 'Main',
      items: [
        {
          title: 'Overview',
          href: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          title: 'Risk Management',
          href: '/dashboard/risks',
          icon: Shield,
          badge: '23',
        },
        {
          title: 'Compliance',
          href: '/dashboard/aria',
          icon: CheckCircle,
          badge: '94%',
        },
      ]
    },
    {
      title: 'Workflows',
      items: [
        {
          title: 'Questionnaires',
          href: '/dashboard/questionnaires',
          icon: ClipboardList,
        },
        {
          title: 'Controls',
          href: '/dashboard/controls',
          icon: ShieldCheck,
        },
        {
          title: 'Documents',
          href: '/dashboard/documents',
          icon: Folder,
        },
        {
          title: 'Workflows',
          href: '/dashboard/workflows',
          icon: GitBranch,
        },
      ]
    },
    {
      title: 'Analytics',
      items: [
        {
          title: 'Reports',
          href: '/dashboard/reporting',
          icon: BarChart3,
        },
        {
          title: 'AI Insights',
          href: '/dashboard/ai-insights',
          icon: Brain,
          badge: 'New',
          isNew: true,
        },
      ]
    }
  ];

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionTitle)
        ? prev.filter(s => s !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  const isItemActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
  };

  if (!isOpen) {
    // Collapsed sidebar
    return (
      <div className="w-16 h-full bg-[#FAFAFA] border-r border-[#D8C3A5] flex flex-col font-inter">
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

  // Expanded sidebar - Vanta style
  return (
    <div className="w-64 h-full bg-[#FAFAFA] border-r border-[#D8C3A5] flex flex-col font-inter">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-[#D8C3A5]">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-[#191919]" />
          <span className="text-xl font-bold text-[#191919]">Riscura</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navigationSections.map((section) => {
          const isExpanded = expandedSections.includes(section.title.toLowerCase());
          
          return (
            <div key={section.title} className="mb-6">
              {/* Section Header */}
              <div className="px-4 mb-2">
                <h3 className="text-xs font-semibold text-[#A8A8A8] uppercase tracking-wider">
                  {section.title}
                </h3>
              </div>

              {/* Section Items */}
              <div className="space-y-1 px-2">
                {section.items.map((item) => {
                  const isActive = isItemActive(item.href);
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 mx-1 rounded-lg text-sm font-medium transition-colors group",
                        isActive
                          ? "bg-[#191919] text-[#FAFAFA]"
                          : "text-[#A8A8A8] hover:bg-[#D8C3A5]/20 hover:text-[#191919]"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {item.badge && (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs px-1.5 py-0.5 border-0",
                              item.isNew
                                ? "bg-green-100 text-green-700"
                                : isActive
                                ? "bg-[#FAFAFA]/20 text-[#FAFAFA]"
                                : "bg-[#D8C3A5]/30 text-[#191919]"
                            )}
                          >
                            {item.badge}
                          </Badge>
                        )}
                        
                        {item.subItems && (
                          <ChevronRight className={cn(
                            "h-4 w-4 transition-transform",
                            isExpanded && "rotate-90"
                          )} />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Quick Actions */}
      <div className="border-t border-[#D8C3A5] p-4 space-y-2">
        <Button 
          size="sm" 
          className="w-full bg-[#191919] text-[#FAFAFA] hover:bg-[#191919]/90 font-inter"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Risk
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full border-[#D8C3A5] text-[#A8A8A8] hover:bg-[#D8C3A5]/20 hover:text-[#191919] font-inter"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Help Center
        </Button>
      </div>

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