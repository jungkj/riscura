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
  Lightbulb
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  user?: UserType;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  requiresPermission?: string;
  badge?: string;
  isNew?: boolean;
}

export default function Sidebar({ isOpen, user }: SidebarProps) {
  const pathname = usePathname();
  
  // Define navigation items
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      permissions: ['dashboard:read'],
    },
    {
      name: 'Risks',
      href: '/dashboard/risks',
      icon: Shield,
      permissions: ['risks:read'],
    },
    {
      name: 'Controls',
      href: '/dashboard/controls',
      icon: CheckCircle,
      permissions: ['controls:read'],
    },
    {
      name: 'Questionnaires',
      href: '/dashboard/questionnaires',
      icon: FileText,
      permissions: ['questionnaires:read'],
    },
    {
      name: 'Workflows',
      href: '/dashboard/workflows',
      icon: GitBranch,
      permissions: ['workflows:read'],
    },
    {
      name: 'Documents',
      href: '/dashboard/documents',
      icon: Folder,
      permissions: ['documents:read'],
    },
    {
      name: 'Reports',
      href: '/dashboard/reporting',
      icon: BarChart,
      permissions: ['reports:read'],
    },
    {
      name: 'AI Insights',
      href: '/dashboard/ai-insights',
      icon: Brain,
      permissions: ['ai:read'],
    },
  ];

  // Filter navigation items based on user permissions (simplified for demo)
  const filteredNavigationItems = navigationItems;

  return (
    <div className="flex h-full flex-col bg-[#FAFAFA] border-r border-[#D8C3A5] font-inter">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-[#D8C3A5] px-4">
        <Shield className="h-8 w-8 text-[#191919]" />
        {isOpen && (
          <span className="ml-2 text-xl font-bold text-[#191919] font-inter">
            Riscura
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {filteredNavigationItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-[#D8C3A5]/20 hover:text-[#191919] relative group font-inter",
                isActive
                  ? "bg-[#D8C3A5]/30 text-[#191919]"
                  : "text-[#A8A8A8]",
                !isOpen && "justify-center"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {isOpen && (
                <span className="ml-3 truncate">{item.name}</span>
              )}
              {!isOpen && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-[#191919] text-[#FAFAFA] text-sm rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 font-inter">
                  {item.name}
                </div>
              )}
              {isActive && (
                <div className="absolute right-0 top-0 h-full w-1 rounded-l-md bg-[#191919]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      {isOpen && user && (
        <div className="border-t border-[#D8C3A5] p-4">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-[#D8C3A5]/20 flex items-center justify-center">
              <User className="h-4 w-4 text-[#191919]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#191919] truncate font-inter">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-[#A8A8A8] truncate font-inter">
                {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Collapsed User Info */}
      {!isOpen && user && (
        <div className="border-t border-[#D8C3A5] p-2 relative group">
          <div className="flex justify-center">
            <div className="h-8 w-8 rounded-full bg-[#D8C3A5]/20 flex items-center justify-center">
              <User className="h-4 w-4 text-[#191919]" />
            </div>
          </div>
          <div className="absolute left-full ml-2 px-3 py-2 bg-[#191919] text-[#FAFAFA] text-sm rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 font-inter">
            <p className="font-medium">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-[#A8A8A8]">
              {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}