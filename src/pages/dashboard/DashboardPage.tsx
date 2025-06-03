'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

// Dashboard Components
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { RealTimeMetrics } from '@/components/dashboard/RealTimeMetrics';
import { AIBriefingPanel } from '@/components/dashboard/AIBriefingPanel';
import { ExecutiveSummary } from '@/components/dashboard/ExecutiveSummary';
import { InteractiveRiskLandscape } from '@/components/dashboard/InteractiveRiskLandscape';
import { AlertsNotificationCenter } from '@/components/dashboard/AlertsNotificationCenter';
import { QuickActionCenter } from '@/components/dashboard/QuickActionCenter';
import { CollaborationIndicators } from '@/components/dashboard/CollaborationIndicators';
import { AdvancedFilters } from '@/components/dashboard/AdvancedFilters';
import { IntegratedSearch } from '@/components/dashboard/IntegratedSearch';

// AI Intelligence Components
import { AIInsightsWidget } from '@/components/ai/AIInsightsWidget';
import { PredictiveAnalyticsChart } from '@/components/ai/PredictiveAnalyticsChart';
import { AnomalyDetectionDemo } from '@/components/ai/AnomalyDetectionDemo';

// Enhanced Visualizations
import RiskHeatMap from '@/components/dashboard/RiskHeatMap';
import RecentActivityTimeline from '@/components/dashboard/RecentActivityTimeline';
import { ComplianceDonut } from '@/components/dashboard/ComplianceDonut';
import { RiskByCategory } from '@/components/dashboard/RiskByCategory';

// Icons
import { 
  ArrowRight, BarChart3, Calendar, FileText, Plus, RefreshCw, Shield, AlertTriangle,
  CheckCircle, Activity, Brain, Sparkles, TrendingUp, Bot, Zap, Eye, Target, Users,
  Clock, Star, ArrowUpRight, ArrowDownRight, DollarSign, Globe, Lock, AlertCircle,
  Settings, Download, Filter, Search, Mic, Sun, Moon, Menu, Grid, Layout,
  PieChart, LineChart, AreaChart, Gauge, Map, Bell, MessageSquare, Phone, Video,
  Share, Maximize, Minimize, RotateCcw, Play, Pause, Volume2
} from 'lucide-react';

// Types
import type { Risk, Control } from '@/types';

// Theme and Layout Types
type DashboardTheme = 'light' | 'dark' | 'system';
type LayoutMode = 'grid' | 'masonry' | 'flex';
type ViewMode = 'executive' | 'analyst' | 'operator' | 'auditor';

interface DashboardWidget {
  id: string;
  title: string;
  type: 'chart' | 'metric' | 'list' | 'ai' | 'custom';
  position: { x: number; y: number; w: number; h: number };
  data?: any;
  config?: any;
  visible: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  
  // State Management
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [theme, setTheme] = useState<DashboardTheme>('system');
  const [viewMode, setViewMode] = useState<ViewMode>('executive');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<any>({});
  const [onlineUsers, setOnlineUsers] = useState([
    { id: '1', name: 'Sarah Chen', role: 'Risk Analyst', avatar: '/avatars/sarah.jpg', status: 'online' as const },
    { id: '2', name: 'Mike Johnson', role: 'Compliance Officer', avatar: '/avatars/mike.jpg', status: 'online' as const },
    { id: '3', name: 'Elena Rodriguez', role: 'CISO', avatar: '/avatars/elena.jpg', status: 'away' as const },
  ]);

  // Widget Configuration
  const [widgets, setWidgets] = useState<DashboardWidget[]>([
    { id: 'metrics', title: 'Key Metrics', type: 'metric', position: { x: 0, y: 0, w: 4, h: 2 }, visible: true },
    { id: 'risk-heatmap', title: 'Risk Landscape', type: 'chart', position: { x: 4, y: 0, w: 4, h: 3 }, visible: true },
    { id: 'ai-insights', title: 'AI Insights', type: 'ai', position: { x: 8, y: 0, w: 4, h: 2 }, visible: true },
    { id: 'compliance', title: 'Compliance Status', type: 'chart', position: { x: 0, y: 2, w: 4, h: 2 }, visible: true },
    { id: 'recent-activity', title: 'Recent Activity', type: 'list', position: { x: 8, y: 2, w: 4, h: 3 }, visible: true },
    { id: 'predictive', title: 'Predictive Analytics', type: 'chart', position: { x: 4, y: 3, w: 4, h: 2 }, visible: true },
  ]);

  // Real-time Data Simulation
  const [realTimeData, setRealTimeData] = useState({
    totalRisks: 156,
    highPriorityRisks: 23,
    complianceScore: 94,
    activeIncidents: 2,
    controlsActive: 245,
    aiInsights: 12,
    lastUpdate: new Date(),
  });

  // Demo Data
  const [demoRisks] = useState<Risk[]>([
    {
      id: 'risk-001',
      title: 'Cybersecurity Incident Risk',
      description: 'Risk of data breach or cyber attack affecting customer data and business operations',
      category: 'technology',
      likelihood: 3,
      impact: 4,
      riskScore: 12,
      riskLevel: 'high',
      owner: 'CISO',
      status: 'identified',
      controls: [],
      evidence: [],
      createdAt: '2024-01-01',
      updatedAt: new Date().toISOString(),
      lastAssessed: new Date('2024-01-15'),
      dateIdentified: '2024-01-01',
      nextReview: new Date('2024-04-15')
    },
    {
      id: 'risk-002',
      title: 'Market Volatility Risk',
      description: 'Risk from market fluctuations affecting investment portfolio and revenue streams',
      category: 'financial',
      likelihood: 4,
      impact: 3,
      riskScore: 12,
      riskLevel: 'high',
      owner: 'CFO',
      status: 'identified',
      controls: [],
      evidence: [],
      createdAt: '2024-01-01',
      updatedAt: new Date().toISOString(),
      lastAssessed: new Date('2024-01-10'),
      dateIdentified: '2024-01-01',
      nextReview: new Date('2024-04-10')
    },
    {
      id: 'risk-003',
      title: 'Regulatory Compliance Risk',
      description: 'Risk of regulatory violations and non-compliance with industry standards',
      category: 'compliance',
      likelihood: 2,
      impact: 5,
      riskScore: 10,
      riskLevel: 'medium',
      owner: 'Legal',
      status: 'identified',
      controls: [],
      evidence: [],
      createdAt: '2024-01-01',
      updatedAt: new Date().toISOString(),
      lastAssessed: new Date('2024-01-20'),
      dateIdentified: '2024-01-01',
      nextReview: new Date('2024-04-20')
    }
  ]);

  // Initialize Dashboard
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Simulate loading dashboard configuration
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Load user preferences
        const savedTheme = localStorage.getItem('dashboard-theme') as DashboardTheme;
        if (savedTheme) setTheme(savedTheme);
        
        const savedViewMode = localStorage.getItem('dashboard-view') as ViewMode;
        if (savedViewMode) setViewMode(savedViewMode);
        
        // Initialize real-time updates
        startRealTimeUpdates();
        
        setIsLoading(false);
        
        toast({
          title: 'Dashboard Loaded',
          description: 'Your command center is ready with real-time intelligence.',
        });
      } catch (error) {
        console.error('Dashboard initialization failed:', error);
        setIsLoading(false);
      }
    };

    initializeDashboard();
    
    // Cleanup
    return () => {
      stopRealTimeUpdates();
    };
  }, []);

  // Real-time Updates
  const startRealTimeUpdates = useCallback(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        ...prev,
        totalRisks: prev.totalRisks + Math.floor(Math.random() * 3 - 1),
        highPriorityRisks: Math.max(0, prev.highPriorityRisks + Math.floor(Math.random() * 3 - 1)),
        complianceScore: Math.max(85, Math.min(100, prev.complianceScore + Math.random() * 2 - 1)),
        lastUpdate: new Date(),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const stopRealTimeUpdates = useCallback(() => {
    // Cleanup real-time subscriptions
  }, []);

  // Theme Management
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (theme === 'system') {
        root.classList.toggle('dark', prefersDark);
      } else {
        root.classList.toggle('dark', theme === 'dark');
      }
    };

    applyTheme();
    localStorage.setItem('dashboard-theme', theme);
  }, [theme]);

  // Voice Commands
  const startVoiceCommand = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({
        title: 'Voice Commands Unavailable',
        description: 'Speech recognition is not supported in this browser.',
        variant: 'destructive',
      });
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript.toLowerCase();
      processVoiceCommand(command);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({
        title: 'Voice Command Error',
        description: 'Unable to process voice command. Please try again.',
        variant: 'destructive',
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, []);

  const processVoiceCommand = useCallback((command: string) => {
    if (command.includes('refresh')) {
      handleRefresh();
    } else if (command.includes('search')) {
      // Extract search term and perform search
      const searchTerm = command.replace('search', '').trim();
      setSearchQuery(searchTerm);
    } else if (command.includes('show risks')) {
      router.push('/dashboard/risks');
    } else if (command.includes('show controls')) {
      router.push('/dashboard/controls');
    } else if (command.includes('show compliance')) {
      router.push('/dashboard/aria');
    } else {
      toast({
        title: 'Command Not Recognized',
        description: `"${command}" is not a recognized voice command.`,
        variant: 'destructive',
      });
    }
  }, [router]);

  // Dashboard Actions
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRealTimeData(prev => ({ ...prev, lastUpdate: new Date() }));
      toast({
        title: 'Dashboard Refreshed',
        description: 'All data and AI insights have been updated.',
      });
    } catch {
      toast({
        title: 'Refresh Failed',
        description: 'Unable to refresh dashboard. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = async () => {
    try {
      toast({
        title: 'Export Started',
        description: 'Generating executive dashboard report...',
      });
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Export Complete',
        description: 'Dashboard report has been downloaded.',
      });
    } catch {
      toast({
        title: 'Export Failed',
        description: 'Unable to generate report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Widget Management
  const toggleWidgetVisibility = (widgetId: string) => {
    setWidgets(prev => 
      prev.map(widget => 
        widget.id === widgetId 
          ? { ...widget, visible: !widget.visible }
          : widget
      )
    );
  };

  const resetLayout = () => {
    setWidgets(prev => 
      prev.map((widget, index) => ({
        ...widget,
        position: { 
          x: (index % 3) * 4, 
          y: Math.floor(index / 3) * 2, 
          w: 4, 
          h: 2 
        }
      }))
    );
    toast({
      title: 'Layout Reset',
      description: 'Dashboard layout has been restored to default.',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F1E9] flex items-center justify-center font-inter">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-[#191919] border-t-transparent rounded-full mx-auto"
          />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-[#191919] font-inter">
              Initializing Command Center
            </h2>
            <p className="text-[#A8A8A8] font-inter">
              Loading your personalized dashboard with AI insights...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#F5F1E9] font-inter">
        {/* Dashboard Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 bg-[#F5F1E9]/95 backdrop-blur-sm border-b border-[#D8C3A5]"
        >
          <div className="flex items-center justify-between p-4">
            {/* Title and Breadcrumb */}
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-3"
              >
                <div className="w-8 h-8 bg-[#191919] rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-[#FAFAFA]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#191919] font-inter">
                    Command Center
                  </h1>
                  <p className="text-sm text-[#A8A8A8] font-inter">
                    Executive Dashboard • Real-time Intelligence
                  </p>
                </div>
              </motion.div>
              
              {/* Online Collaboration Indicators */}
              <CollaborationIndicators users={onlineUsers} />
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-2">
              {/* Integrated Search */}
              <IntegratedSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search across all data..."
              />
              
              {/* Voice Command Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isListening ? "default" : "ghost"}
                    size="sm"
                    onClick={startVoiceCommand}
                    disabled={!voiceEnabled}
                    className={`${isListening ? "animate-pulse bg-[#191919] text-[#FAFAFA]" : "bg-[#FAFAFA] text-[#191919] border-[#D8C3A5] hover:bg-[#D8C3A5]"} font-inter`}
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isListening ? 'Listening...' : 'Voice Commands'}
                </TooltipContent>
              </Tooltip>

              {/* Filters Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showFilters ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`${showFilters ? "bg-[#191919] text-[#FAFAFA]" : "bg-[#FAFAFA] text-[#191919] border-[#D8C3A5] hover:bg-[#D8C3A5]"} font-inter`}
                  >
                    <Filter className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Advanced Filters</TooltipContent>
              </Tooltip>

              {/* Theme Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                    className="bg-[#FAFAFA] text-[#191919] border-[#D8C3A5] hover:bg-[#D8C3A5] font-inter"
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle Theme</TooltipContent>
              </Tooltip>

              {/* Export */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleExport}
                    className="bg-[#FAFAFA] text-[#191919] border-[#D8C3A5] hover:bg-[#D8C3A5] font-inter"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export Dashboard</TooltipContent>
              </Tooltip>

              {/* Refresh */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="bg-[#FAFAFA] text-[#191919] border-[#D8C3A5] hover:bg-[#D8C3A5] font-inter"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh Data</TooltipContent>
              </Tooltip>

              {/* Settings */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="bg-[#FAFAFA] text-[#191919] border-[#D8C3A5] hover:bg-[#D8C3A5] font-inter"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Dashboard Settings</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-[#D8C3A5] bg-[#FAFAFA]"
              >
                <AdvancedFilters
                  filters={selectedFilters}
                  onChange={setSelectedFilters}
                  onClose={() => setShowFilters(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        {/* Dashboard Content */}
        <main className="p-6 space-y-6">
          {/* AI Daily Briefing */}
          <AIBriefingPanel 
            data={realTimeData}
            risks={demoRisks}
            enabled={aiEnabled}
          />

          {/* Real-time Metrics Bar */}
          <RealTimeMetrics data={realTimeData} />

          {/* Quick Actions & Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <QuickActionCenter viewMode={viewMode} />
            </div>
            <div>
              <AlertsNotificationCenter />
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <DashboardGrid
            widgets={widgets}
            onWidgetToggle={toggleWidgetVisibility}
            onLayoutReset={resetLayout}
            layoutMode={layoutMode}
            viewMode={viewMode}
            data={{
              risks: demoRisks,
              realTime: realTimeData,
              ai: { enabled: aiEnabled }
            }}
          />

          {/* Executive Summary */}
          <ExecutiveSummary
            data={realTimeData}
            risks={demoRisks}
            viewMode={viewMode}
          />

          {/* Interactive 3D Risk Landscape */}
          <InteractiveRiskLandscape
            risks={demoRisks}
            controls={[]}
          />
        </main>
      </div>
    </TooltipProvider>
  );
}