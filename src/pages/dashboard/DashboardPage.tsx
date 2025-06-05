'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion, stagger, useAnimation } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

// Enhanced UI Components
import { NotificationCenter } from '@/components/ui/notification-center';
import { ToastNotification, Notification, NotificationList } from '@/components/ui/notification';
import { 
  StatusIndicator, 
  ServiceStatus, 
  ProgressMetric, 
  SystemHealth,
  StatusType 
} from '@/components/ui/status-indicator';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogLarge,
  DialogFullscreen,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CheckCircle,
  Activity,
  Brain,
  Sparkles,
  TrendingUp,
  Bot,
  Zap,
  Eye,
  Target,
  Users,
  Clock,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Globe,
  Lock,
  AlertCircle,
  Settings,
  Download,
  Filter,
  Search,
  Bell,
  MessageSquare,
  MoreHorizontal,
  ChevronDown,
  ExternalLink,
  Info,
  Gauge,
  LineChart,
  PieChart,
  AreaChart,
  Lightbulb,
  HelpCircle,
  CheckCircle2,
  X,
  Shield,
  BarChart3,
  FileText,
  RefreshCw,
  AlertTriangle,
  Plus,
  ArrowRight,
  Calendar,
  Database,
  Cloud,
  Server,
  Wifi,
  Menu,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';

// Dashboard Components - we'll redesign these to be more Vanta/Drata-like
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { RealTimeMetrics } from '@/components/dashboard/RealTimeMetrics';

// Types
import type { Risk, Control } from '@/types';

type ViewMode = 'overview' | 'risks' | 'compliance' | 'insights' | 'forms' | 'status';

interface SystemStatus {
  service: string;
  status: 'online' | 'warning' | 'offline';
  uptime: string;
  lastChecked: string;
}

// Animation variants for smooth transitions
const pageVariants = {
  initial: { 
    opacity: 0, 
    y: 20,
    scale: 0.98
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

const slideIn = {
  initial: { opacity: 0, x: -20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  
  // Responsive state management
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeView, setActiveView] = useState<ViewMode>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(true);

  // Real-time metrics for dashboard header
  const [metrics, setMetrics] = useState({
    totalRisks: 156,
    highRisks: 23,
    complianceScore: 94,
    lastUpdate: new Date().toLocaleTimeString(),
  });

  // Enhanced notification system state
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'error',
      title: 'Critical Security Alert',
      message: 'Potential data breach detected in the customer database. Immediate action required.',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      read: false,
      metadata: {
        source: 'Security Monitor',
        priority: 'critical',
        category: 'Security'
      },
      actions: [
        { label: 'Investigate', onClick: () => {}, variant: 'primary' },
        { label: 'Escalate', onClick: () => {}, variant: 'secondary' }
      ]
    },
    {
      id: '2',
      type: 'warning',
      title: 'Compliance Alert',
      message: 'SOC 2 audit deadline approaching in 7 days. Please review outstanding controls.',
      timestamp: new Date(Date.now() - 600000), // 10 minutes ago
      read: false,
      metadata: {
        source: 'Compliance Engine',
        priority: 'high',
        category: 'Compliance'
      }
    },
    {
      id: '3',
      type: 'success',
      title: 'Risk Assessment Complete',
      message: 'Q1 2024 risk assessment has been successfully completed and approved.',
      timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      read: true,
      metadata: {
        source: 'Risk Engine',
        priority: 'low',
        category: 'Assessment'
      }
    },
    {
      id: '4',
      type: 'info',
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM EST.',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      read: false,
      metadata: {
        source: 'System Admin',
        priority: 'medium',
        category: 'Maintenance'
      }
    },
    {
      id: '5',
      type: 'system',
      title: 'New Feature Available',
      message: 'AI-powered risk prediction is now available in your dashboard.',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      read: true,
      metadata: {
        source: 'Product Team',
        priority: 'low',
        category: 'Feature'
      }
    }
  ]);

  // Toast notifications for real-time alerts
  const [toastNotifications, setToastNotifications] = useState<Notification[]>([]);

  // System status for professional monitoring feel
  const [systemStatus] = useState<SystemStatus[]>([
    { service: 'Risk Engine', status: 'online', uptime: '99.9%', lastChecked: '2 mins ago' },
    { service: 'Compliance Monitor', status: 'online', uptime: '99.8%', lastChecked: '1 min ago' },
    { service: 'Data Sync', status: 'warning', uptime: '98.5%', lastChecked: '5 mins ago' },
  ]);

  // Recent activity for activity timeline
  const [recentActivity] = useState([
    { id: '1', type: 'risk_identified', title: 'New cyber risk identified', time: '2 minutes ago', severity: 'high' },
    { id: '2', type: 'control_updated', title: 'Access control policy updated', time: '15 minutes ago', severity: 'medium' },
    { id: '3', type: 'compliance_check', title: 'SOC 2 compliance verified', time: '1 hour ago', severity: 'low' },
    { id: '4', type: 'assessment_completed', title: 'Q1 risk assessment completed', time: '2 hours ago', severity: 'low' },
  ]);

  // Responsive breakpoint detection
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileSize = window.innerWidth < 768;
      setIsMobile(isMobileSize);
      
      // Auto-manage sidebar based on screen size
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Notification management functions
  const handleDismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleMarkAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const handleClearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const handleDismissToast = useCallback((id: string) => {
    setToastNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Enhanced view switching with loading states
  const handleViewChange = useCallback(async (newView: ViewMode) => {
    if (newView === activeView) return;
    
    setDataLoading(true);
    
    // Simulate data loading delay for smooth transitions
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setActiveView(newView);
    setDataLoading(false);
    
    // Toast feedback for view changes
    const viewNames = {
      overview: 'Overview Dashboard',
      risks: 'Risk Management',
      compliance: 'Compliance',
      insights: 'AI Insights',
      forms: 'Enhanced Forms',
      status: 'Status & Notifications'
    };
    
    toast({
      title: `Switched to ${viewNames[newView]}`,
      description: 'Loading latest data...',
      duration: 2000,
    });
  }, [activeView]);

  // Simulate real-time notifications
  const simulateNotification = useCallback(() => {
    const notificationTypes = ['success', 'warning', 'error', 'info', 'system'] as const;
    const titles = [
      'Security scan completed',
      'New risk detected',
      'Compliance check passed',
      'System update available',
      'Audit reminder'
    ];
    const messages = [
      'All systems are operating normally.',
      'A new security vulnerability was identified.',
      'Your organization meets all compliance requirements.',
      'A system update is ready to install.',
      'Your next audit is scheduled for next week.'
    ];

    const randomType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    const newNotification: Notification = {
      id: `notification-${Date.now()}`,
      type: randomType,
      title: randomTitle,
      message: randomMessage,
      timestamp: new Date(),
      read: false,
      metadata: {
        source: 'System',
        priority: randomType === 'error' ? 'high' : 'medium',
        category: 'Auto-generated'
      }
    };

    setNotifications(prev => [newNotification, ...prev]);
    setToastNotifications(prev => [...prev, newNotification]);
  }, []);

  // Initialize Dashboard with enhanced loading sequence
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Simulate progressive loading
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsLoading(false);
        
        // Simulate chart loading
        setTimeout(() => setChartLoading(false), 1200);
        
        toast({
          title: 'Dashboard Ready',
          description: 'Your risk management command center is active.',
        });
      } catch (error) {
        console.error('Dashboard initialization failed:', error);
        setIsLoading(false);
        setChartLoading(false);
      }
    };

    initializeDashboard();

    // Set up real-time updates
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        lastUpdate: new Date().toLocaleTimeString()
      }));
    }, 30000);

    // Simulate periodic notifications for demo
    const notificationInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        simulateNotification();
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(notificationInterval);
    };
  }, [simulateNotification]);

  // Enhanced refresh with visual feedback
  const handleRefresh = async () => {
    setRefreshing(true);
    setDataLoading(true);
    
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setRefreshing(false);
    setDataLoading(false);
    
    toast({
      title: 'Data Refreshed',
      description: 'All metrics and insights have been updated.',
    });
  };

  // Navigation tabs for mobile-first design
  const navigationTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3, shortLabel: 'Overview' },
    { id: 'risks', label: 'Risk Management', icon: Shield, shortLabel: 'Risks' },
    { id: 'compliance', label: 'Compliance', icon: CheckCircle, shortLabel: 'Compliance' },
    { id: 'insights', label: 'AI Insights', icon: Brain, shortLabel: 'AI' },
    { id: 'forms', label: 'Enhanced Forms', icon: FileText, shortLabel: 'Forms' },
    { id: 'status', label: 'Status & Notifications', icon: Activity, shortLabel: 'Status' },
  ];

  // Enhanced loading screen with animation
  if (isLoading) {
    return (
      <motion.div 
        className="flex items-center justify-center min-h-screen bg-card"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className="text-center space-y-6"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div 
            className="relative"
            variants={scaleIn}
          >
            <motion.div 
              className="w-20 h-20 border-4 border-secondary border-t-foreground rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <Shield className="w-8 h-8 text-foreground absolute inset-0 m-auto" />
            
            {/* Pulse effect */}
            <motion.div
              className="absolute inset-0 border-4 border-[#D8C3A5] rounded-full"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
          
          <motion.div className="space-y-3" variants={fadeInUp}>
            <h3 className="text-xl font-bold text-foreground font-inter">Loading Dashboard</h3>
            <p className="text-base text-foreground font-semibold font-inter">Initializing your risk management center...</p>
            
            {/* Progress bar */}
            <motion.div 
              className="w-64 mx-auto"
              variants={fadeInUp}
            >
              <div className="bg-[#D8C3A5]/30 rounded-full h-2 overflow-hidden border border-[#D8C3A5]">
                <motion.div
                  className="bg-[#191919] h-full rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-background"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Toast Notifications */}
      <AnimatePresence>
        {toastNotifications.map((notification) => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            onDismiss={handleDismissToast}
            position="top-right"
          />
        ))}
      </AnimatePresence>

      {/* Loading overlay for data operations */}
      <AnimatePresence>
        {dataLoading && (
          <motion.div
            className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="bg-white rounded-xl p-6 shadow-2xl border-2 border-[#D8C3A5]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 text-[#191919] animate-spin" />
                <span className="text-sm font-medium text-[#191919] font-inter">Loading data...</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Mobile-First Header */}
      <motion.header 
        className="bg-card border-b-2 border-border sticky top-0 z-40 shadow-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Left Section - Logo and Mobile Menu */}
            <motion.div 
              className="flex items-center space-x-3 sm:space-x-4"
              variants={slideIn}
              initial="initial"
              animate="animate"
            >
              {/* Enhanced Mobile Menu Button */}
              <motion.div
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 text-[#191919] hover:bg-[#D8C3A5]/20 transition-colors duration-200"
                  aria-label="Toggle navigation menu"
                >
                  <motion.div
                    animate={sidebarOpen ? { rotate: 90 } : { rotate: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-5 h-5" />
                  </motion.div>
                </Button>
              </motion.div>

              {/* Animated Logo */}
              <motion.div 
                className="flex items-center space-x-2 sm:space-x-3"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-[#191919]" />
                </motion.div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#191919] font-inter">Riscura</h1>
              </motion.div>
            </motion.div>

            {/* Right Section - Enhanced Actions */}
            <motion.div 
              className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4"
              variants={slideIn}
              initial="initial"
              animate="animate"
            >
              {/* Enhanced Search */}
              <div className="hidden sm:block relative">
                <motion.div
                  whileFocus={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#A8A8A8]" />
                  <Input
                    type="text"
                    placeholder={isMobile ? "Search..." : "Search across all data..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-32 sm:w-48 lg:w-64 h-9 bg-[#FAFAFA] border-[#D8C3A5] focus:border-[#191919] focus:ring-2 focus:ring-[#D8C3A5]/30 font-inter text-sm transition-all duration-200"
                  />
                </motion.div>
              </div>

              {/* Enhanced Mobile Search Button */}
              <motion.div
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="sm:hidden p-2 text-[#A8A8A8] hover:text-[#191919] hover:bg-[#D8C3A5]/20 transition-all duration-200"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </Button>
              </motion.div>

              {/* Enhanced Notification Center */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <NotificationCenter
                  notifications={notifications}
                  onDismiss={handleDismissNotification}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onClearAll={handleClearAll}
                  onSettingsOpen={() => toast({ title: 'Settings', description: 'Notification settings opened.' })}
                  className="flex-shrink-0"
                />
              </motion.div>

              {/* Enhanced Refresh Button */}
              <motion.div
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 text-[#A8A8A8] hover:text-[#191919] hover:bg-[#D8C3A5]/20 transition-all duration-200 disabled:opacity-50"
                  aria-label="Refresh data"
                >
                  <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-500 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </motion.div>

              {/* Enhanced User Menu */}
              <motion.div 
                className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 rounded-lg bg-[#D8C3A5] border-2 border-[#191919] cursor-pointer"
                whileHover={{ 
                  backgroundColor: "#C4AE96", 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.98 }}
              >
                <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                  <AvatarFallback className="bg-[#191919] text-[#FAFAFA] text-xs sm:text-sm font-semibold">
                    DU
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-sm">
                  <p className="font-medium text-[#191919] leading-tight">Demo User</p>
                  <p className="text-[#191919]/70 text-xs">Admin</p>
                </div>
                <motion.div
                  animate={{ rotate: sidebarOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-[#191919]" />
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Enhanced Mobile Navigation Tabs */}
        <div className="lg:hidden border-t-2 border-[#D8C3A5] bg-white">
          <motion.div 
            className="flex overflow-x-auto scrollbar-hide px-4"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {navigationTabs.map((tab, index) => (
              <motion.button
                key={tab.id}
                onClick={() => handleViewChange(tab.id as ViewMode)}
                className={`flex-shrink-0 flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-all duration-300 border-b-2 relative ${
                  activeView === tab.id
                    ? 'text-[#191919] border-[#191919] bg-[#D8C3A5]/20'
                    : 'text-[#A8A8A8] border-transparent hover:text-[#191919] hover:border-[#D8C3A5] hover:bg-[#D8C3A5]/10'
                }`}
                variants={fadeInUp}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  animate={activeView === tab.id ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <tab.icon className="w-4 h-4" />
                </motion.div>
                <span className="whitespace-nowrap">{isMobile ? tab.shortLabel : tab.label}</span>
                
                {/* Active indicator */}
                {activeView === tab.id && (
                  <motion.div
                    className="absolute inset-0 bg-[#D8C3A5]/20 rounded-lg"
                    layoutId="activeTab"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* Enhanced Desktop Navigation */}
        <div className="hidden lg:block border-t-2 border-[#D8C3A5] bg-white">
          <div className="px-8">
            <motion.nav 
              className="flex items-center space-x-1"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {navigationTabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => handleViewChange(tab.id as ViewMode)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 relative ${
                    activeView === tab.id
                      ? 'bg-[#191919] text-[#FAFAFA] shadow-lg'
                      : 'text-[#A8A8A8] hover:text-[#191919] hover:bg-[#D8C3A5]/20'
                  }`}
                  variants={fadeInUp}
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  layout
                >
                  <motion.div
                    animate={activeView === tab.id ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <tab.icon className="w-4 h-4" />
                  </motion.div>
                  <span>{tab.label}</span>
                  
                  {/* Notification badge for some tabs */}
                  {tab.id === 'status' && notifications.filter(n => !n.read).length > 0 && (
                    <motion.div
                      className="w-2 h-2 bg-red-500 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    />
                  )}
                </motion.button>
              ))}
            </motion.nav>
          </div>
        </div>
      </motion.header>

      {/* Collapsible Sidebar for Desktop */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Mobile Overlay */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Enhanced Sidebar */}
            <motion.aside
              initial={{ x: isMobile ? '-100%' : 0, opacity: isMobile ? 0 : 1 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isMobile ? '-100%' : 0, opacity: isMobile ? 0 : 1 }}
              transition={{ 
                duration: 0.4, 
                ease: [0.4, 0, 0.2, 1],
                staggerChildren: 0.1
              }}
              className={`fixed top-0 left-0 h-full w-64 bg-white border-r-2 border-[#D8C3A5] z-40 lg:z-20 shadow-2xl ${
                isMobile ? 'lg:hidden' : 'hidden lg:block'
              }`}
            >
              <motion.div 
                className="p-6"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                <motion.div 
                  className="flex items-center justify-between mb-6"
                  variants={fadeInUp}
                >
                  <motion.div 
                    className="flex items-center space-x-3"
                    whileHover={{ scale: 1.02 }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      <Shield className="w-8 h-8 text-[#191919]" />
                    </motion.div>
                    <span className="text-xl font-bold text-[#191919] font-inter">Riscura</span>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSidebarOpen(false)}
                      className="p-2 text-[#A8A8A8] hover:text-[#191919] hover:bg-[#D8C3A5]/20 transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </motion.div>

                {/* Enhanced Quick Stats */}
                <motion.div 
                  className="grid grid-cols-2 gap-3 mb-6"
                  variants={staggerContainer}
                >
                  <motion.div 
                    className="bg-[#D8C3A5] rounded-lg p-3 cursor-pointer border-2 border-[#191919]"
                    variants={scaleIn}
                    whileHover={{ 
                      scale: 1.05, 
                      backgroundColor: "#C4AE96",
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.p 
                      className="text-2xl font-bold text-[#191919] font-inter"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {metrics.totalRisks}
                    </motion.p>
                    <p className="text-xs text-[#191919]/70 font-inter">Total Risks</p>
                  </motion.div>
                  <motion.div 
                    className="bg-[#D8C3A5] rounded-lg p-3 cursor-pointer border-2 border-[#191919]"
                    variants={scaleIn}
                    whileHover={{ 
                      scale: 1.05, 
                      backgroundColor: "#C4AE96",
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.p 
                      className="text-2xl font-bold text-[#191919] font-inter"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    >
                      {metrics.complianceScore}%
                    </motion.p>
                    <p className="text-xs text-[#191919]/70 font-inter">Compliance</p>
                  </motion.div>
                </motion.div>

                {/* Enhanced Quick Actions */}
                <motion.div 
                  className="space-y-2"
                  variants={staggerContainer}
                >
                  <motion.h3 
                    className="text-sm font-semibold text-[#191919] font-inter mb-3"
                    variants={fadeInUp}
                  >
                    Quick Actions
                  </motion.h3>
                  
                  {[
                    { icon: Plus, label: 'New Risk Assessment' },
                    { icon: FileText, label: 'Generate Report' },
                    { icon: Settings, label: 'Settings' }
                  ].map((action, index) => (
                    <motion.div
                      key={action.label}
                      variants={slideIn}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left border-2 border-[#D8C3A5] text-[#A8A8A8] hover:text-[#191919] hover:bg-[#D8C3A5]/20 hover:border-[#191919] transition-all duration-300"
                      >
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.3 }}
                        >
                          <action.icon className="w-4 h-4 mr-2" />
                        </motion.div>
                        {action.label}
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Dashboard Content */}
      <motion.div 
        className="flex-1 min-h-0"
        variants={fadeInUp}
      >
        <motion.div 
          className="h-full p-4 sm:p-6 lg:p-8 overflow-auto"
          variants={staggerContainer}
        >
          {/* Floating Toast Notifications */}
          <AnimatePresence>
            {toastNotifications.map((notification) => (
              <ToastNotification
                key={notification.id}
                notification={notification}
                onDismiss={() => handleDismissToast(notification.id)}
              />
            ))}
          </AnimatePresence>

          {/* Loading Overlay */}
          <AnimatePresence>
            {dataLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
              >
                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading data...</span>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced Dashboard Views */}
          <AnimatePresence mode="wait">
            {activeView === 'overview' && (
              <motion.div
                key="overview"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <OverviewDashboard 
                  metrics={metrics} 
                  systemStatus={systemStatus} 
                  recentActivity={recentActivity}
                  chartLoading={chartLoading}
                />
              </motion.div>
            )}

            {activeView === 'risks' && (
              <motion.div
                key="risks"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <RiskManagementView />
              </motion.div>
            )}

            {activeView === 'compliance' && (
              <motion.div
                key="compliance"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <ComplianceView />
              </motion.div>
            )}

            {activeView === 'insights' && (
              <motion.div
                key="insights"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <AIInsightsView />
              </motion.div>
            )}

            {activeView === 'forms' && (
              <motion.div
                key="forms"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <EnhancedFormsView />
              </motion.div>
            )}

            {activeView === 'status' && (
              <motion.div
                key="status"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <StatusNotificationView
                  notifications={notifications}
                  onDismiss={handleDismissNotification}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onClearAll={handleClearAll}
                  onSimulateNotification={simulateNotification}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// Enhanced Status & Notification System View
function StatusNotificationView({
  notifications,
  onDismiss,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onSimulateNotification
}: {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSimulateNotification: () => void;
}) {
  return (
    <motion.div 
      className="space-y-4 sm:space-y-6 lg:space-y-8"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Enhanced Header */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0"
        variants={fadeInUp}
      >
        <div>
          <motion.h2 
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#191919] font-inter"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Status & Notifications
          </motion.h2>
          <motion.p 
            className="text-sm sm:text-base text-[#A8A8A8] font-inter mt-1 sm:mt-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Monitor system health and manage notifications
          </motion.p>
        </div>
        <motion.div 
          className="flex flex-col sm:flex-row gap-2 sm:gap-3"
          variants={staggerContainer}
        >
          <motion.div
            variants={scaleIn}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={onSimulateNotification}
              size="sm"
              variant="outline"
              className="border-[#D8C3A5]/60 text-[#A8A8A8] hover:text-[#191919] hover:bg-[#F5F1E9] hover:border-[#191919] h-10 text-sm transition-all duration-300"
            >
              <motion.div
                animate={{ rotate: [0, 20, -20, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Bell className="w-4 h-4 mr-2" />
              </motion.div>
              <span className="hidden sm:inline">Simulate Alert</span>
              <span className="sm:hidden">Alert</span>
            </Button>
          </motion.div>
          <motion.div
            variants={scaleIn}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              size="sm"
              className="bg-[#191919] text-[#FAFAFA] hover:bg-[#2a2a2a] h-10 text-sm shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <Settings className="w-4 h-4 mr-2" />
              </motion.div>
              <span className="hidden sm:inline">Settings</span>
              <span className="sm:hidden">Config</span>
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Enhanced System Health Overview */}
      <motion.div variants={fadeInUp}>
        <SystemHealth
          overallStatus="operational"
          services={[
            { name: 'Risk Engine', status: 'operational', icon: Server },
            { name: 'Authentication', status: 'operational', icon: Shield },
            { name: 'Data Sync', status: 'degraded', icon: Database },
            { name: 'Analytics', status: 'operational', icon: Activity }
          ]}
          metrics={{
            uptime: '99.9%',
            responseTime: '120ms',
            throughput: '1.2k/sec',
            errorRate: '0.01%'
          }}
          lastUpdated="2 minutes ago"
        />
      </motion.div>

      {/* Enhanced Progress Metrics */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
        variants={staggerContainer}
      >
        {[
          { label: "System Uptime", value: 99.9, target: 99.5, unit: "%", trend: "stable", color: "green" as const },
          { label: "Response Time", value: 120, target: 200, unit: "ms", trend: "up", color: "blue" as const },
          { label: "Security Score", value: 95, target: 90, unit: "/100", trend: "up", color: "red" as const },
          { label: "Compliance Rate", value: 94, target: 95, unit: "%", trend: "down", color: "yellow" as const }
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            variants={scaleIn}
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <ProgressMetric
              label={metric.label}
              value={metric.value}
              target={metric.target}
              unit={metric.unit}
              trend={metric.trend as any}
              color={metric.color}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Enhanced Service Status Monitor */}
      <motion.div variants={fadeInUp}>
        <Card className="bg-white border-2 border-[#D8C3A5] shadow-sm hover:shadow-md hover:border-[#191919] transition-all duration-300">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl font-bold text-[#191919] font-inter">
              Service Status Monitor
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6"
              variants={staggerContainer}
            >
              {[
                { name: "Risk Engine", status: "operational", uptime: "99.9%", responseTime: "85ms", incidents: 0, lastChecked: "2 mins ago" },
                { name: "Compliance Monitor", status: "operational", uptime: "99.8%", responseTime: "92ms", incidents: 0, lastChecked: "1 min ago" },
                { name: "Data Sync", status: "degraded", uptime: "98.5%", responseTime: "340ms", incidents: 1, lastChecked: "5 mins ago" },
                { name: "Authentication", status: "operational", uptime: "100%", responseTime: "45ms", incidents: 0, lastChecked: "30 secs ago" },
                { name: "Notification Service", status: "operational", uptime: "99.7%", responseTime: "120ms", incidents: 0, lastChecked: "1 min ago" },
                { name: "AI Analytics", status: "operational", uptime: "99.9%", responseTime: "180ms", incidents: 0, lastChecked: "3 mins ago" }
              ].map((service, index) => (
                <motion.div
                  key={service.name}
                  variants={slideIn}
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <ServiceStatus
                    name={service.name}
                    status={service.status as any}
                    uptime={service.uptime}
                    responseTime={service.responseTime}
                    incidents={service.incidents}
                    lastChecked={service.lastChecked}
                  />
                </motion.div>
              ))}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced Notification Management */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
        variants={staggerContainer}
      >
        {/* Enhanced Notification List */}
        <motion.div 
          className="lg:col-span-2"
          variants={slideIn}
        >
          <Card className="bg-white border-2 border-[#D8C3A5] shadow-sm hover:shadow-md hover:border-[#191919] transition-all duration-300">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <CardTitle className="text-lg sm:text-xl font-bold text-[#191919] font-inter">
                  Recent Notifications
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={onMarkAllAsRead}
                      variant="outline"
                      size="sm"
                      className="border-2 border-[#D8C3A5] text-[#A8A8A8] hover:text-[#191919] hover:bg-[#D8C3A5]/20 hover:border-[#191919] h-8 text-xs transition-all duration-300"
                    >
                      Mark All Read
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={onClearAll}
                      variant="outline"
                      size="sm"
                      className="border-2 border-[#D8C3A5] text-[#A8A8A8] hover:text-[#191919] hover:bg-[#D8C3A5]/20 hover:border-[#191919] h-8 text-xs transition-all duration-300"
                    >
                      Clear All
                    </Button>
                  </motion.div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <NotificationList
                notifications={notifications}
                onDismiss={onDismiss}
                onMarkAsRead={onMarkAsRead}
                onMarkAllAsRead={onMarkAllAsRead}
                onClearAll={onClearAll}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Statistics Panel */}
        <motion.div 
          className="space-y-4 sm:space-y-6"
          variants={slideIn}
        >
          <Card className="bg-white border-2 border-[#D8C3A5] shadow-sm hover:shadow-md hover:border-[#191919] transition-all duration-300">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl font-bold text-[#191919] font-inter">
                Notification Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <motion.div 
                className="space-y-3 sm:space-y-4"
                variants={staggerContainer}
              >
                {[
                  { label: 'Total', value: notifications.length, color: 'text-[#191919]' },
                  { label: 'Unread', value: notifications.filter(n => !n.read).length, color: 'text-[#191919]' },
                  { label: 'Critical', value: notifications.filter(n => n.metadata?.priority === 'critical').length, color: 'text-red-600' },
                  { label: 'Today', value: notifications.filter(n => {
                    const today = new Date();
                    const notificationDate = new Date(n.timestamp);
                    return notificationDate.toDateString() === today.toDateString();
                  }).length, color: 'text-[#191919]' }
                ].map((stat, index) => (
                  <motion.div 
                    key={stat.label}
                    className="flex justify-between items-center p-3 bg-[#D8C3A5]/10 rounded-lg cursor-pointer border-2 border-[#D8C3A5]/50 hover:border-[#191919] hover:bg-[#D8C3A5]/20 transition-all duration-300"
                    variants={scaleIn}
                    whileHover={{ 
                      scale: 1.02,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-sm font-medium text-[#191919] font-inter">{stat.label}</span>
                    <motion.span 
                      className={`text-lg font-bold font-inter ${stat.color}`}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: index * 0.2 }}
                    >
                      {stat.value}
                    </motion.span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Enhanced Quick Actions */}
              <motion.div 
                className="mt-4 sm:mt-6 space-y-2"
                variants={staggerContainer}
              >
                <motion.h4 
                  className="text-sm font-semibold text-[#191919] font-inter mb-3"
                  variants={fadeInUp}
                >
                  Quick Actions
                </motion.h4>
                
                {[
                  { icon: Bell, label: 'Configure Alerts' },
                  { icon: Download, label: 'Export Log' },
                  { icon: Settings, label: 'Preferences' }
                ].map((action, index) => (
                  <motion.div
                    key={action.label}
                    variants={slideIn}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start border-2 border-[#D8C3A5] text-[#A8A8A8] hover:text-[#191919] hover:bg-[#D8C3A5]/20 hover:border-[#191919] h-10 text-sm transition-all duration-300"
                    >
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.3 }}
                      >
                        <action.icon className="w-4 h-4 mr-2" />
                      </motion.div>
                      {action.label}
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// Enhanced Overview Dashboard Component
function OverviewDashboard({ 
  metrics, 
  systemStatus, 
  recentActivity,
  chartLoading = false
}: { 
  metrics: any; 
  systemStatus: SystemStatus[]; 
  recentActivity: any[];
  chartLoading?: boolean;
}) {
  return (
    <motion.div 
      className="space-y-4 sm:space-y-6 lg:space-y-8"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Enhanced Header */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0"
        variants={fadeInUp}
      >
        <div>
          <motion.h2 
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#191919] font-inter"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Welcome back
          </motion.h2>
          <motion.p 
            className="text-sm sm:text-base text-[#A8A8A8] font-inter mt-1 sm:mt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Here's what's happening with your risk management
          </motion.p>
        </div>
        <motion.div
          variants={scaleIn}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            size="sm"
            className="self-start sm:self-auto bg-[#191919] text-[#FAFAFA] hover:bg-[#2a2a2a] px-4 py-2 sm:px-6 sm:py-3 h-auto font-inter shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.3 }}
            >
              <Download className="w-4 h-4 mr-2" />
            </motion.div>
            <span className="hidden sm:inline">Export Report</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </motion.div>
      </motion.div>

      {/* Enhanced Responsive Metrics Grid */}
      <motion.div 
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
        variants={staggerContainer}
      >
        {[
          { title: "Total Risks", value: metrics.totalRisks, change: "+12%", changeType: "increase", icon: Shield, color: "blue" },
          { title: "High Priority", value: metrics.highRisks, change: "-5%", changeType: "decrease", icon: AlertTriangle, color: "red" },
          { title: "Compliance", value: `${metrics.complianceScore}%`, change: "+2%", changeType: "increase", icon: CheckCircle, color: "green" },
          { title: "AI Insights", value: "47", change: "+18%", changeType: "increase", icon: Brain, color: "red" }
        ].map((metric, index) => (
          <motion.div
            key={metric.title}
            variants={scaleIn}
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <MetricCard
              title={metric.title}
              value={metric.value}
              change={metric.change}
              changeType={metric.changeType as any}
              icon={metric.icon}
              color={metric.color}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Enhanced Responsive Content Grid */}
      <motion.div 
        className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
        variants={staggerContainer}
      >
        {/* Enhanced Main Charts Section */}
        <motion.div 
          className="xl:col-span-2 space-y-4 sm:space-y-6"
          variants={slideIn}
        >
          {/* Enhanced Risk Trend Chart */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Card className="bg-white border-2 border-[#D8C3A5] shadow-sm hover:shadow-md hover:border-[#191919] transition-all duration-300">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <CardTitle className="text-lg sm:text-xl font-bold text-[#191919] font-inter">
                    Risk Trends
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Select defaultValue="30days">
                      <SelectTrigger className="w-28 sm:w-32 h-8 sm:h-9 text-xs sm:text-sm transition-all duration-200 hover:border-[#191919] border-2 border-[#D8C3A5]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7days">7 days</SelectItem>
                        <SelectItem value="30days">30 days</SelectItem>
                        <SelectItem value="90days">90 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <RiskTrendChart loading={chartLoading} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Enhanced Compliance Progress */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Card className="bg-white border-2 border-[#D8C3A5] shadow-sm hover:shadow-md hover:border-[#191919] transition-all duration-300">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl font-bold text-[#191919] font-inter">
                  Compliance Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <ComplianceProgressChart loading={chartLoading} />
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Enhanced Sidebar Content */}
        <motion.div 
          className="space-y-4 sm:space-y-6"
          variants={slideIn}
        >
          {/* Enhanced System Status */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <SystemStatusCard systemStatus={systemStatus} />
          </motion.div>
          
          {/* Enhanced Recent Activity */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <RecentActivityCard activities={recentActivity} />
          </motion.div>
          
          {/* Enhanced Risk Distribution */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Card className="bg-white border-2 border-[#D8C3A5] shadow-sm hover:shadow-md hover:border-[#191919] transition-all duration-300">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl font-bold text-[#191919] font-inter">
                  Risk Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <RiskDistributionChart loading={chartLoading} />
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// Enhanced Metric Card Component with micro-interactions
function MetricCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  color 
}: {
  title: string;
  value: string | number;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
}) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'increase': return 'text-green-600';
      case 'decrease': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getIconColor = () => {
    return `text-${color}-600`;
  };

  return (
    <Card className="notion-card hover:shadow-lg transition-all duration-300 border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-foreground">
                {value}
              </p>
              <p className={`text-xs font-medium ${getChangeColor()}`}>
                {change}
              </p>
            </div>
          </div>
          <div className={`p-3 rounded-full bg-secondary/20`}>
            <Icon className={`h-6 w-6 ${getIconColor()}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Placeholder components for other views to prevent linter errors
function RiskManagementView() {
  return (
    <motion.div 
      className="space-y-6"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.div variants={fadeInUp}>
        <Card className="bg-white border-2 border-[#D8C3A5] rounded-xl p-6 shadow-sm hover:shadow-md hover:border-[#191919] transition-all duration-300">
          <motion.h2 
            className="text-2xl font-bold text-[#191919] font-inter mb-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            Risk Management
          </motion.h2>
          <motion.p 
            className="text-[#A8A8A8] font-inter"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Comprehensive risk assessment and management tools.
          </motion.p>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function ComplianceView() {
  return (
    <motion.div 
      className="space-y-6"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.div variants={fadeInUp}>
        <Card className="bg-white border-2 border-[#D8C3A5] rounded-xl p-6 shadow-sm hover:shadow-md hover:border-[#191919] transition-all duration-300">
          <motion.h2 
            className="text-2xl font-bold text-[#191919] font-inter mb-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            Compliance Management
          </motion.h2>
          <motion.p 
            className="text-[#A8A8A8] font-inter"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Track compliance across multiple frameworks and standards.
          </motion.p>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function AIInsightsView() {
  return (
    <motion.div 
      className="space-y-6"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.div variants={fadeInUp}>
        <Card className="bg-white border-2 border-[#D8C3A5] rounded-xl p-6 shadow-sm hover:shadow-md hover:border-[#191919] transition-all duration-300">
          <motion.h2 
            className="text-2xl font-bold text-[#191919] font-inter mb-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            AI-Powered Insights
          </motion.h2>
          <motion.p 
            className="text-[#A8A8A8] font-inter"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Machine learning-driven risk analysis and predictions.
          </motion.p>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function EnhancedFormsView() {
  return (
    <motion.div 
      className="space-y-6"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <motion.div variants={fadeInUp}>
        <Card className="bg-white border-2 border-[#D8C3A5] rounded-xl p-6 shadow-sm hover:shadow-md hover:border-[#191919] transition-all duration-300">
          <motion.h2 
            className="text-2xl font-bold text-[#191919] font-inter mb-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            Enhanced Forms
          </motion.h2>
          <motion.p 
            className="text-[#A8A8A8] font-inter"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Professional form elements with Drata-style design.
          </motion.p>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// Enhanced chart components with loading states
function RiskTrendChart({ loading = false }: { loading?: boolean }) {
  if (loading) {
    return (
      <div className="w-full h-48 sm:h-64 lg:h-80 flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="w-8 h-8 border-2 border-[#D8C3A5] border-t-[#191919] rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-sm text-[#A8A8A8] font-inter">Loading chart data...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      className="w-full"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <motion.div 
        className="h-48 sm:h-64 lg:h-80 bg-gradient-to-br from-[#D8C3A5]/20 to-[#D8C3A5]/10 rounded-lg border-2 border-[#D8C3A5] flex items-center justify-center group cursor-pointer hover:border-[#191919] transition-all duration-300"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="text-center space-y-2 sm:space-y-4">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <TrendingUp className="w-8 h-8 sm:w-12 sm:h-12 text-[#191919] mx-auto" />
          </motion.div>
          <motion.p 
            className="text-sm sm:text-base font-medium text-[#191919] font-inter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Risk Trend Chart
          </motion.p>
          <motion.p 
            className="text-xs sm:text-sm text-[#A8A8A8] font-inter max-w-xs px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Interactive chart showing risk trends over time
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ComplianceProgressChart({ loading = false }: { loading?: boolean }) {
  const complianceData = [
    { framework: 'SOC 2', progress: 94, status: 'On Track' },
    { framework: 'ISO 27001', progress: 78, status: 'In Progress' },
    { framework: 'GDPR', progress: 100, status: 'Complete' },
    { framework: 'HIPAA', progress: 67, status: 'Needs Attention' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Complete': return 'text-green-700 bg-green-100 border-green-200';
      case 'On Track': return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'In Progress': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'Needs Attention': return 'text-red-700 bg-red-100 border-red-200';
      default: return 'text-[#A8A8A8] bg-[#D8C3A5]/20 border-[#D8C3A5]';
    }
  };

  if (loading) {
    return (
      <motion.div 
        className="space-y-3 sm:space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {[...Array(4)].map((_, index) => (
          <motion.div 
            key={index}
            className="p-3 sm:p-4 bg-[#D8C3A5]/10 rounded-lg border-2 border-[#D8C3A5]/30"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 mb-3">
              <div className="w-24 h-4 bg-[#D8C3A5]/50 rounded animate-pulse" />
              <div className="w-16 h-6 bg-[#D8C3A5]/50 rounded animate-pulse" />
            </div>
            <div className="w-full h-3 bg-[#D8C3A5]/30 rounded animate-pulse" />
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-3 sm:space-y-4"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {complianceData.map((item, index) => (
        <motion.div 
          key={index} 
          className="p-3 sm:p-4 bg-[#D8C3A5]/10 rounded-lg cursor-pointer group border-2 border-[#D8C3A5]/50 hover:border-[#191919] hover:bg-[#D8C3A5]/20 transition-all duration-300"
          variants={slideIn}
          whileHover={{ 
            scale: 1.02,
            transition: { duration: 0.2 }
          }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 mb-3">
            <motion.span 
              className="text-sm sm:text-base font-medium text-[#191919] font-inter"
              animate={{ x: [0, 2, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: index * 0.3 }}
            >
              {item.framework}
            </motion.span>
            <div className="flex items-center space-x-2">
              <motion.span 
                className="text-sm sm:text-base font-bold text-[#191919] font-inter"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: index * 0.2 }}
              >
                {item.progress}%
              </motion.span>
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Badge className={`text-xs px-2 py-1 border ${getStatusColor(item.status)}`}>
                  {item.status}
                </Badge>
              </motion.div>
            </div>
          </div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, delay: index * 0.2, ease: "easeOut" }}
          >
            <Progress 
              value={item.progress} 
              className="h-2 sm:h-3 bg-white border-2 border-[#D8C3A5]"
            />
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function RiskDistributionChart({ loading = false }: { loading?: boolean }) {
  const riskData = [
    { category: 'Cyber Security', count: 45, percentage: 35, color: 'bg-red-500' },
    { category: 'Operational', count: 32, percentage: 25, color: 'bg-yellow-500' },
    { category: 'Financial', count: 26, percentage: 20, color: 'bg-blue-500' },
    { category: 'Compliance', count: 19, percentage: 15, color: 'bg-green-500' },
    { category: 'Strategic', count: 6, percentage: 5, color: 'bg-red-500' }
  ];

  if (loading) {
    return (
      <motion.div 
        className="space-y-3 sm:space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="h-4 sm:h-6 bg-[#D8C3A5]/30 rounded border-2 border-[#D8C3A5] animate-pulse" />
        {[...Array(5)].map((_, index) => (
          <motion.div 
            key={index}
            className="flex items-center justify-between p-2 sm:p-3 rounded-lg border-2 border-[#D8C3A5]/30"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#D8C3A5]/50 rounded-full animate-pulse" />
              <div className="w-20 h-4 bg-[#D8C3A5]/50 rounded animate-pulse" />
            </div>
            <div className="w-12 h-4 bg-[#D8C3A5]/50 rounded animate-pulse" />
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-3 sm:space-y-4"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Enhanced Visual distribution bars */}
      <motion.div 
        className="flex h-4 sm:h-6 rounded-lg overflow-hidden bg-white border-2 border-[#D8C3A5]"
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        {riskData.map((item, index) => (
          <motion.div
            key={index}
            className={`${item.color} transition-all duration-300 hover:opacity-80 cursor-pointer`}
            style={{ width: `${item.percentage}%` }}
            title={`${item.category}: ${item.count} risks`}
            initial={{ width: 0 }}
            animate={{ width: `${item.percentage}%` }}
            transition={{ duration: 1, delay: index * 0.2, ease: "easeOut" }}
            whileHover={{ scale: 1.05 }}
          />
        ))}
      </motion.div>

      {/* Enhanced Risk category breakdown */}
      <motion.div 
        className="space-y-2 sm:space-y-3"
        variants={staggerContainer}
      >
        {riskData.map((item, index) => (
          <motion.div 
            key={index} 
            className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-[#D8C3A5]/10 transition-all duration-300 cursor-pointer group border-2 border-transparent hover:border-[#D8C3A5]"
            variants={slideIn}
            whileHover={{ x: 5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <motion.div 
                className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${item.color} flex-shrink-0 border-2 border-white shadow-sm`}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: index * 0.3 }}
              />
              <motion.span 
                className="text-sm sm:text-base text-[#191919] font-inter font-medium truncate"
                whileHover={{ x: 2 }}
              >
                {item.category}
              </motion.span>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <motion.span 
                className="text-sm sm:text-base font-bold text-[#191919] font-inter"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: index * 0.2 }}
              >
                {item.count}
              </motion.span>
              <motion.span 
                className="text-xs sm:text-sm text-[#A8A8A8] font-inter"
                initial={{ opacity: 0.7 }}
                whileHover={{ opacity: 1 }}
              >
                ({item.percentage}%)
              </motion.span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

function SystemStatusCard({ systemStatus }: { systemStatus: SystemStatus[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'offline': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-muted-foreground bg-secondary/20 border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'offline': return <X className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Card className="notion-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Activity className="h-5 w-5" />
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {systemStatus.map((service, index) => (
          <motion.div
            key={service.service}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-secondary/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-full ${getStatusColor(service.status)}`}>
                {getStatusIcon(service.status)}
              </div>
              <div>
                <p className="font-medium text-foreground">{service.service}</p>
                <p className="text-xs text-muted-foreground">Uptime: {service.uptime}</p>
              </div>
            </div>
            <Badge className={getStatusColor(service.status)}>
              {service.status}
            </Badge>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

function RecentActivityCard({ activities }: { activities: any[] }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'risk_added': return <Shield className="h-4 w-4" />;
      case 'control_tested': return <CheckCircle className="h-4 w-4" />;
      case 'report_generated': return <FileText className="h-4 w-4" />;
      case 'user_action': return <Users className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-muted-foreground bg-secondary/20';
    }
  };

  return (
    <Card className="notion-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <motion.div
              key={`${activity.type}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-secondary/10 transition-colors"
            >
              <div className={`p-2 rounded-full ${getSeverityColor(activity.severity)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground text-sm">{activity.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
              </div>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  );
}