'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import GuidedTour from '@/components/help/GuidedTour';

import {
  Shield,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  FileText,
  Clock,
  Settings,
  Activity,
  Zap,
  Brain,
  Upload,
  Target,
  Plus,
  Calendar,
  ArrowRight,
  MoreHorizontal,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  CheckCircle2
} from 'lucide-react';

// Import the interactive risk heat map component
import { RiskHeatMap as InteractiveRiskHeatMap } from '@/components/ui/interactive-risk-heatmap';

// Types
interface DashboardStats {
  totalRisks: number;
  highRisks: number;
  complianceScore: number;
  activeControls: number;
  pendingActions: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  color: string;
  badge?: string;
}

interface RecentActivity {
  id: number;
  action: string;
  user: string;
  time: string;
  type: 'success' | 'info' | 'warning' | 'error';
  module: string;
  avatar?: string;
}

interface Insight {
  id: string;
  title: string;
  description: string;
  type: 'risk' | 'compliance' | 'opportunity' | 'alert';
  priority: 'high' | 'medium' | 'low';
  action?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalRisks: 23,
    highRisks: 4,
    complianceScore: 94,
    activeControls: 18,
    pendingActions: 7
  });
  const [loading, setLoading] = useState(true);
  const [showTour, setShowTour] = useState(false);

  // Simulate loading for demonstration
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Check if user is new and should see the tour
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenDashboardTour');
    if (!hasSeenTour && !loading) {
      // Auto-start tour for new users after a short delay
      const tourTimer = setTimeout(() => {
        setShowTour(true);
      }, 2000);
      return () => clearTimeout(tourTimer);
    }
  }, [loading]);

  const quickActions: QuickAction[] = [
    {
      id: 'new-risk',
      title: 'Add New Risk',
      description: 'Document and assess a new risk',
      icon: Shield,
      href: '/dashboard/risks/new',
      color: 'text-red-600',
      badge: 'Quick'
    },
    {
      id: 'import-rcsa',
      title: 'Import RCSA',
      description: 'Upload risk assessment data',
      icon: Upload,
      href: '/dashboard/import/rcsa',
      color: 'text-blue-600'
    },
    {
      id: 'ask-aria',
      title: 'Ask ARIA',
      description: 'Get AI-powered insights',
      icon: Brain,
      href: '/dashboard/aria',
      color: 'text-purple-600',
      badge: 'AI'
    },
    {
      id: 'generate-report',
      title: 'Generate Report',
      description: 'Create compliance reports',
      icon: FileText,
      href: '/dashboard/reporting',
      color: 'text-green-600'
    },
    {
      id: 'risk-assessment',
      title: 'Risk Assessment',
      description: 'Conduct risk evaluation',
      icon: Target,
      href: '/dashboard/risks/assessment',
      color: 'text-orange-600'
    },
    {
      id: 'compliance-check',
      title: 'Compliance Check',
      description: 'Review framework status',
      icon: CheckCircle2,
      href: '/dashboard/compliance',
      color: 'text-emerald-600'
    }
  ];

  const recentActivity: RecentActivity[] = [
    { 
      id: 1, 
      action: 'Risk assessment completed for "Data Breach Scenario"', 
      user: 'Sarah Chen', 
      time: '2 hours ago', 
      type: 'success',
      module: 'Risk Management',
      avatar: 'SC'
    },
    { 
      id: 2, 
      action: 'New control "Multi-Factor Authentication" added', 
      user: 'John Smith', 
      time: '4 hours ago', 
      type: 'info',
      module: 'Controls',
      avatar: 'JS'
    },
    { 
      id: 3, 
      action: 'Compliance report generated for SOC 2', 
      user: 'Lisa Wang', 
      time: '6 hours ago', 
      type: 'success',
      module: 'Compliance',
      avatar: 'LW'
    },
    { 
      id: 4, 
      action: 'High-risk vulnerability detected in payment system', 
      user: 'System Alert', 
      time: '8 hours ago', 
      type: 'warning',
      module: 'Monitoring',
      avatar: 'SA'
    },
    { 
      id: 5, 
      action: 'Quarterly risk review meeting scheduled', 
      user: 'Mike Johnson', 
      time: '1 day ago', 
      type: 'info',
      module: 'Planning',
      avatar: 'MJ'
    }
  ];

  const insights: Insight[] = [
    {
      id: '1',
      title: 'Critical Risk Trend',
      description: 'High-risk incidents have increased by 15% this month. Consider reviewing security protocols.',
      type: 'risk',
      priority: 'high',
      action: 'Review Security'
    },
    {
      id: '2',
      title: 'Compliance Opportunity',
      description: 'Your SOC 2 compliance score has improved. Consider pursuing additional certifications.',
      type: 'opportunity',
      priority: 'medium',
      action: 'Explore Certifications'
    },
    {
      id: '3',
      title: 'Control Effectiveness',
      description: 'Multi-factor authentication controls are performing exceptionally well.',
      type: 'compliance',
      priority: 'low'
    }
  ];

  const handleQuickAction = (href: string, actionId?: string) => {
    if (actionId === 'guided-tour') {
      setShowTour(true);
      return;
    }
    
    router.push(href);
    
    // Show success toast for certain actions
    if (actionId === 'new-risk') {
      toast({
        title: "Risk Creation",
        description: "Opening risk creation form...",
      });
    }
  };

  const handleTourComplete = () => {
    setShowTour(false);
    localStorage.setItem('hasSeenDashboardTour', 'true');
    toast({
      title: "Tour Complete!",
      description: "You're ready to start managing risks effectively.",
    });
  };

  const handleTourSkip = () => {
    setShowTour(false);
    localStorage.setItem('hasSeenDashboardTour', 'true');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-tour="dashboard-main">
      {/* Guided Tour Component */}
      {showTour && (
        <GuidedTour
          tourId="platform-overview"
          autoStart={true}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
          showProgress={true}
          allowSkip={true}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between" data-tour="dashboard-header">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your risk management overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setShowTour(true)}
            className="text-sm"
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            Take Tour
          </Button>
          <Button onClick={() => router.push('/dashboard/risks/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Risk
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6" data-tour="dashboard-stats">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Risks</p>
                <p className="text-3xl font-bold text-blue-900">{stats.totalRisks}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">High Priority</p>
                <p className="text-3xl font-bold text-red-900">{stats.highRisks}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Compliance</p>
                <p className="text-3xl font-bold text-green-900">{stats.complianceScore}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Active Controls</p>
                <p className="text-3xl font-bold text-purple-900">{stats.activeControls}</p>
              </div>
              <Settings className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Pending Actions</p>
                <p className="text-3xl font-bold text-orange-900">{stats.pendingActions}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1" data-tour="quick-actions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => (
                <QuickActionCard
                  key={action.id}
                  title={action.title}
                  description={action.description}
                  icon={action.icon}
                  color={action.color}
                  badge={action.badge}
                  onClick={() => handleQuickAction(action.href, action.id)}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Risk Heat Map */}
        <div className="lg:col-span-2" data-tour="risk-heatmap">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Risk Heat Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InteractiveRiskHeatMap />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card data-tour="recent-activity">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  action={activity.action}
                  user={activity.user}
                  time={activity.time}
                  type={activity.type}
                  module={activity.module}
                  avatar={activity.avatar}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card data-tour="ai-insights">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight) => (
                <div key={insight.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{insight.title}</h4>
                        <Badge 
                          variant={insight.priority === 'high' ? 'destructive' : insight.priority === 'medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                      {insight.action && (
                        <Button variant="outline" size="sm">
                          {insight.action}
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickActionCard({ 
  title, 
  description, 
  icon: Icon, 
  color, 
  badge,
  onClick 
}: {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <div 
      className="p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-lg bg-gray-100 group-hover:bg-blue-50 transition-colors`}>
          <Icon className={`w-5 h-5 ${color} group-hover:text-blue-600 transition-colors`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-gray-900 group-hover:text-blue-900 transition-colors">{title}</h3>
            {badge && (
              <Badge variant="secondary" className="text-xs">
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ 
  action, 
  user, 
  time, 
  type,
  module,
  avatar
}: { 
  action: string; 
  user: string; 
  time: string; 
  type: 'success' | 'info' | 'warning' | 'error';
  module: string;
  avatar?: string;
}) {
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
      case 'warning':
        return { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' };
      case 'error':
        return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' };
      default:
        return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' };
    }
  };

  const getModuleBadgeColor = (module: string) => {
    const moduleLower = module.toLowerCase();
    switch (moduleLower) {
      case 'risk management':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'compliance':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'monitoring':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'controls':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'planning':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 mb-1">{action}</p>
        <div className="flex items-center space-x-2">
          <p className="text-xs text-gray-500">{user}</p>
          <span className="text-xs text-gray-400">•</span>
          <p className="text-xs text-gray-500">{time}</p>
          <span className="text-xs text-gray-400">•</span>
          <Badge className={`text-xs border ${getModuleBadgeColor(module)}`}>
            {module}
          </Badge>
        </div>
      </div>
      <div className={`p-1 rounded-full ${config.bg} flex-shrink-0`}>
        <Icon className={`w-3 h-3 ${config.color}`} />
      </div>
    </div>
  );
}