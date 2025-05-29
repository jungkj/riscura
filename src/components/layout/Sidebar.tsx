import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { User } from '@/types';

// Icons
import { 
  LayoutDashboard, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  GitBranch, 
  BarChart3,
  Lightbulb,
  ClipboardList,
  Settings,
  Bot
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  user: User | null;
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
  const location = useLocation();
  
  // Define navigation items
  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      title: "ARIA AI Assistant",
      href: "/aria",
      icon: <Bot className="h-5 w-5" />,
      badge: "NEW",
      isNew: true
    },
    {
      title: "Risk Register",
      href: "/risks",
      icon: <AlertTriangle className="h-5 w-5" />,
      requiresPermission: "risks.view"
    },
    {
      title: "Document Analysis",
      href: "/document-analysis",
      icon: <FileText className="h-5 w-5" />
    },
    {
      title: "Control Library",
      href: "/controls",
      icon: <ShieldCheck className="h-5 w-5" />,
      requiresPermission: "controls.view"
    },
    {
      title: "Workflows",
      href: "/workflows",
      icon: <GitBranch className="h-5 w-5" />
    },
    {
      title: "Questionnaires",
      href: "/questionnaires",
      icon: <ClipboardList className="h-5 w-5" />
    },
    {
      title: "Reporting",
      href: "/reporting",
      icon: <BarChart3 className="h-5 w-5" />
    },
    {
      title: "AI Insights",
      href: "/ai-insights",
      icon: <Lightbulb className="h-5 w-5" />
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />
    },
  ];

  // Filter items based on user permissions
  const filteredNavItems = navItems.filter(item => {
    if (!item.requiresPermission) return true;
    return user?.permissions.includes(item.requiresPermission);
  });

  return (
    <aside 
      className={cn(
        "fixed left-0 z-30 w-64 flex-col border-r bg-card transition-all duration-300 ease-in-out",
        "top-16 bottom-0", // Position below navbar (assuming navbar height is 4rem/64px)
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="px-4 py-6">
        <div className="space-y-1">
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground relative",
                location.pathname === item.href ? "bg-accent text-accent-foreground" : "transparent",
                item.isNew && "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950"
              )}
            >
              {item.icon}
              <span className="ml-3">{item.title}</span>
              {item.badge && (
                <span className="ml-auto inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-2 py-1 text-xs font-medium text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}